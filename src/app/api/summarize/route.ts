import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

const CEREBRAS_MODEL = 'llama3.1-8b'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { meetingId, transcript } = await req.json()
    if (!meetingId || !transcript) {
      return NextResponse.json({ error: 'meetingId and transcript required' }, { status: 400 })
    }

    const cerebrasKey = process.env.CEREBRAS_API_KEY
    if (!cerebrasKey) throw new Error('CEREBRAS_API_KEY not configured')

    const prompt = `Eres un asistente experto en analizar reuniones de negocios.
Analiza la siguiente transcripción y devuelve ÚNICAMENTE un objeto JSON válido (sin markdown, sin explicación) con esta estructura:

{
  "summary": "Resumen ejecutivo de la reunión en 3-5 oraciones. Menciona el objetivo, puntos clave discutidos y conclusiones.",
  "action_items": [
    {
      "id": "1",
      "text": "Descripción clara de la tarea",
      "done": false,
      "assignee": "Nombre del responsable o null"
    }
  ],
  "title": "Título descriptivo de la reunión en máximo 8 palabras"
}

Transcripción:
${transcript.substring(0, 4000)}`

    const cerebrasRes = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cerebrasKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: CEREBRAS_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    })

    if (!cerebrasRes.ok) {
      const err = await cerebrasRes.text()
      throw new Error(`Cerebras error: ${err}`)
    }

    const cerebrasData = await cerebrasRes.json()
    const rawContent: string = cerebrasData.choices?.[0]?.message?.content || '{}'

    // Parse JSON safely
    let parsed: { summary?: string; action_items?: unknown[]; title?: string } = {}
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
    } catch {
      parsed = { summary: rawContent }
    }

    const summary = parsed.summary || 'Resumen no disponible'
    const actionItems = Array.isArray(parsed.action_items) ? parsed.action_items : []
    const title = parsed.title

    // Update meeting
    const updatePayload: Record<string, unknown> = {
      summary,
      action_items: actionItems,
      status: 'ready',
    }
    if (title) updatePayload.title = title

    await supabase
      .from('meetings')
      .update(updatePayload)
      .eq('id', meetingId)
      .eq('user_id', user.id)

    return NextResponse.json({ summary, action_items: actionItems })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[summarize]', msg)

    // Mark meeting as error
    try {
      const supabase = await createClient()
      const { meetingId } = await (req.clone().json() as Promise<{ meetingId?: string }>)
      if (meetingId) {
        await supabase.from('meetings').update({ status: 'error' }).eq('id', meetingId)
      }
    } catch {}

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
