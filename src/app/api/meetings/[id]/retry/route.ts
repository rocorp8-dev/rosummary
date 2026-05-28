import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

const GROQ_MODEL = 'llama-3.1-8b-instant'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id: meetingId } = await params

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Obtener la reunión con su transcripción
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('id, transcript, status')
      .eq('id', meetingId)
      .eq('user_id', user.id)
      .single()

    if (meetingError || !meeting) {
      return NextResponse.json({ error: 'Reunión no encontrada' }, { status: 404 })
    }

    if (!meeting.transcript) {
      return NextResponse.json({ error: 'Esta reunión no tiene transcripción para resumir' }, { status: 400 })
    }

    // Marcar como processing mientras reintentamos
    await supabase
      .from('meetings')
      .update({ status: 'processing' })
      .eq('id', meetingId)
      .eq('user_id', user.id)

    const groqKey = process.env.GROQ_API_KEY
    if (!groqKey) throw new Error('GROQ_API_KEY not configured')

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
${meeting.transcript.substring(0, 4000)}`

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    })

    if (!groqRes.ok) {
      const err = await groqRes.text()
      throw new Error(`Groq error: ${err}`)
    }

    const groqData = await groqRes.json()
    const rawContent: string = groqData.choices?.[0]?.message?.content || '{}'

    // Limpiar posibles bloques markdown
    const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let parsed: { summary?: string; action_items?: unknown[]; title?: string } = {}
    try {
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
    } catch {
      parsed = { summary: rawContent }
    }

    const summary = parsed.summary || 'Resumen no disponible'
    const actionItems = Array.isArray(parsed.action_items) ? parsed.action_items : []
    const title = parsed.title

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

    return NextResponse.json({ ok: true, summary, action_items: actionItems })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[retry-summarize]', msg)

    // Marcar como error para que la UI no quede en processing infinito
    try {
      const supabase = await createClient()
      await supabase
        .from('meetings')
        .update({ status: 'error' })
        .eq('id', meetingId)
    } catch {}

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
