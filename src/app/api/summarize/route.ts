import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

const GROQ_MODEL = 'llama-3.1-8b-instant'

export async function POST(req: NextRequest) {
  // Leer el body una sola vez antes del try para poder usarlo en el catch
  let meetingId: string | undefined
  let transcript: string | undefined

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    meetingId = body.meetingId
    transcript = body.transcript

    if (!meetingId || !transcript) {
      return NextResponse.json({ error: 'meetingId and transcript required' }, { status: 400 })
    }

    const groqKey = process.env.GROQ_API_KEY
    if (!groqKey) throw new Error('GROQ_API_KEY not configured')

    const prompt = `Eres un asistente experto en analizar reuniones de negocios.
Analiza detenidamente toda la transcripción y extrae con rigurosidad todos los temas discutidos, las decisiones clave y los puntos de acuerdo. No omitas información importante de ninguna parte de la reunión, especialmente de las partes media y final.

Devuelve ÚNICAMENTE un objeto JSON válido (sin markdown, sin explicación) con esta estructura exacta:

{
  "summary": "Un resumen ejecutivo muy completo, estructurado y detallado de la reunión. Describe el objetivo principal, desglosa con claridad todos los temas clave discutidos (con sus respectivos detalles, argumentos y conclusiones) y especifica los acuerdos alcanzados de forma organizada y fácil de leer. Puedes usar saltos de línea (\\n) para estructurarlo.",
  "action_items": [
    {
      "id": "1",
      "text": "Descripción clara, detallada y específica de la tarea acordada",
      "done": false,
      "assignee": "Nombre del responsable o null"
    }
  ],
  "title": "Título descriptivo de la reunión en máximo 8 palabras"
}

Transcripción de la reunión:
${transcript.substring(0, 120000)}`

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

    // Limpiar posibles bloques de código markdown que Groq puede incluir
    const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    // Parse JSON safely
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

    // Marcar la reunión como error usando meetingId ya leído (no re-parsear req)
    if (meetingId) {
      try {
        const supabase = await createClient()
        await supabase.from('meetings').update({ status: 'error' }).eq('id', meetingId)
      } catch {}
    }

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
