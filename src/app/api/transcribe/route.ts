import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const audio = formData.get('audio') as File | null
    const meetingId = formData.get('meetingId') as string | null

    if (!audio || !meetingId) {
      return NextResponse.json({ error: 'Audio and meetingId required' }, { status: 400 })
    }

    const groqKey = process.env.GROQ_API_KEY
    if (!groqKey) throw new Error('GROQ_API_KEY not configured')

    // Send to Groq Whisper
    const groqForm = new FormData()
    groqForm.append('file', audio, 'audio.webm')
    groqForm.append('model', 'whisper-large-v3-turbo')
    groqForm.append('language', 'es')
    groqForm.append('response_format', 'verbose_json')

    const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${groqKey}` },
      body: groqForm,
    })

    if (!groqRes.ok) {
      const err = await groqRes.text()
      throw new Error(`Groq error: ${err}`)
    }

    const groqData = await groqRes.json()
    const transcript: string = groqData.text || ''

    // Extract participant names (basic heuristic: look for names after ":" pattern)
    const participants: string[] = []
    const speakerMatches = transcript.match(/([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+):/g)
    if (speakerMatches) {
      const unique = [...new Set(speakerMatches.map((s) => s.replace(':', '').trim()))]
      participants.push(...unique.slice(0, 8))
    }

    // Save transcript to meeting
    await supabase
      .from('meetings')
      .update({
        transcript,
        participants,
        status: 'processing', // summarize will set to 'ready'
      })
      .eq('id', meetingId)
      .eq('user_id', user.id)

    return NextResponse.json({ transcript, participants })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[transcribe]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
