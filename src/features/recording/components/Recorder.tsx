'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Square, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import AudioVisualizer from './AudioVisualizer'
import { formatDuration } from '@/lib/utils'

type RecordingState = 'idle' | 'recording' | 'processing' | 'done' | 'error'

export default function Recorder() {
  const [state, setState] = useState<RecordingState>('idle')
  const [seconds, setSeconds] = useState(0)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [title, setTitle] = useState('')
  const [meetingId, setMeetingId] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Timer
  useEffect(() => {
    if (state === 'recording') {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [state])

  const startRecording = useCallback(async () => {
    setErrorMsg('')
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setStream(mediaStream)

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4'

      const recorder = new MediaRecorder(mediaStream, { mimeType })
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.start(1000) // collect every second
      setState('recording')
      setSeconds(0)
    } catch (err) {
      setErrorMsg('No se pudo acceder al micrófono. Ve a Configuración → Privacidad → Micrófono.')
      setState('error')
    }
  }, [])

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current) return
    setState('processing')

    mediaRecorderRef.current.stop()
    stream?.getTracks().forEach((t) => t.stop())
    setStream(null)

    await new Promise<void>((resolve) => {
      mediaRecorderRef.current!.onstop = () => resolve()
    })

    const mimeType = mediaRecorderRef.current.mimeType
    const blob = new Blob(chunksRef.current, { type: mimeType })

    try {
      // 1. Create meeting record
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const meetingTitle = title.trim() || `Reunión ${new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' })}`

      const { data: meeting, error: meetingError } = await supabase
        .from('meetings')
        .insert({
          user_id: user.id,
          title: meetingTitle,
          duration_seconds: seconds,
          status: 'processing',
        })
        .select()
        .single()

      if (meetingError) throw meetingError
      setMeetingId(meeting.id)

      // 2. Upload audio to Supabase Storage
      const ext = mimeType.includes('mp4') ? 'm4a' : 'webm'
      const filePath = `${user.id}/${meeting.id}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('meeting-audio')
        .upload(filePath, blob, { contentType: mimeType })

      if (uploadError) throw uploadError

      // 3. Transcribe via Groq
      const formData = new FormData()
      formData.append('audio', blob, `audio.${ext}`)
      formData.append('meetingId', meeting.id)

      const transcribeRes = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!transcribeRes.ok) throw new Error('Error en transcripción')
      const { transcript } = await transcribeRes.json()

      // 4. Summarize via Cerebras
      await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId: meeting.id, transcript }),
      })

      setState('done')

      // 5. Redirect to meeting detail
      setTimeout(() => router.push(`/meeting/${meeting.id}`), 1500)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setErrorMsg(msg)
      setState('error')
    }
  }, [stream, seconds, title, supabase, router])

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-sm mx-auto">
      {/* Title input */}
      {state === 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nombre de la reunión (opcional)"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 transition text-center text-sm"
          />
        </motion.div>
      )}

      {/* Waveform */}
      <div className="w-full flex justify-center min-h-[80px]">
        <AudioVisualizer isRecording={state === 'recording'} stream={stream} />
      </div>

      {/* Timer */}
      <AnimatePresence>
        {state === 'recording' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 record-pulse" />
            <span className="text-3xl font-mono font-bold text-white tabular-nums">
              {formatDuration(seconds)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main button */}
      <div className="relative">
        {state === 'idle' && (
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={startRecording}
            className="w-28 h-28 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center transition glow"
            style={{ boxShadow: '0 0 40px rgba(99,102,241,0.4), 0 0 80px rgba(99,102,241,0.1)' }}
          >
            <Mic className="w-12 h-12 text-white" />
          </motion.button>
        )}

        {state === 'recording' && (
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={stopRecording}
            className="w-28 h-28 rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center transition record-pulse"
            style={{ boxShadow: '0 0 40px rgba(239,68,68,0.5)' }}
          >
            <Square className="w-10 h-10 text-white fill-white" />
          </motion.button>
        )}

        {state === 'processing' && (
          <div
            className="w-28 h-28 rounded-full glass flex flex-col items-center justify-center gap-2"
          >
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
            <span className="text-xs text-white/50">Procesando…</span>
          </div>
        )}

        {state === 'done' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-28 h-28 rounded-full bg-emerald-600/20 border-2 border-emerald-500 flex items-center justify-center"
          >
            <CheckCircle className="w-12 h-12 text-emerald-400" />
          </motion.div>
        )}

        {state === 'error' && (
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => { setState('idle'); setErrorMsg('') }}
            className="w-28 h-28 rounded-full bg-rose-600/20 border-2 border-rose-500 flex flex-col items-center justify-center gap-1"
          >
            <AlertCircle className="w-10 h-10 text-rose-400" />
            <span className="text-xs text-rose-400">Reintentar</span>
          </motion.button>
        )}
      </div>

      {/* State labels */}
      <div className="text-center">
        {state === 'idle' && (
          <div>
            <p className="text-white font-semibold">Toca para grabar</p>
            <p className="text-white/40 text-sm mt-1">Funciona en iPhone y escritorio</p>
          </div>
        )}
        {state === 'recording' && (
          <div>
            <p className="text-white font-semibold">Grabando…</p>
            <p className="text-white/40 text-sm mt-1">Toca el botón para detener</p>
          </div>
        )}
        {state === 'processing' && (
          <div>
            <p className="text-white font-semibold">Transcribiendo con IA</p>
            <p className="text-white/40 text-sm mt-1">Groq Whisper + Cerebras AI</p>
          </div>
        )}
        {state === 'done' && (
          <div>
            <p className="text-emerald-400 font-semibold">¡Listo!</p>
            <p className="text-white/40 text-sm mt-1">Redirigiendo a tu reunión…</p>
          </div>
        )}
        {state === 'error' && errorMsg && (
          <div className="glass rounded-xl px-4 py-3 border border-rose-500/30">
            <p className="text-rose-400 text-sm">{errorMsg}</p>
          </div>
        )}
      </div>
    </div>
  )
}
