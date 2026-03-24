import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

const CEREBRAS_MODEL = 'llama3.1-8b'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { meetingId, message, transcript, history } = await req.json()
    if (!meetingId || !message || !transcript) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const cerebrasKey = process.env.CEREBRAS_API_KEY
    if (!cerebrasKey) throw new Error('CEREBRAS_API_KEY not configured')

    const systemPrompt = `Eres un asistente inteligente que ha analizado una reunión de negocios.
Tu única fuente de información es la transcripción de la reunión que se te proporciona.
Responde en español de forma concisa y útil.
Si la información no está en la transcripción, dilo claramente.
No inventes datos que no estén en la transcripción.

TRANSCRIPCIÓN DE LA REUNIÓN:
---
${transcript.substring(0, 3500)}
---`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).slice(-6),
      { role: 'user', content: message },
    ]

    const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cerebrasKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: CEREBRAS_MODEL,
        messages,
        temperature: 0.5,
        max_tokens: 512,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Cerebras error: ${err}`)
    }

    const data = await res.json()
    const reply: string = data.choices?.[0]?.message?.content || 'No pude generar una respuesta.'

    return NextResponse.json({ reply })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[chat]', msg)
    return NextResponse.json({ reply: 'Ocurrió un error. Intenta de nuevo.' }, { status: 200 })
  }
}
