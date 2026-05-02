'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Square, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import AudioVisualizer from './AudioVisualizer'
import { formatDuration } from '@/lib/utils'

type RecordingState = 'idle' | 'recording' | 'processing' | 'done' | 'error'

const SEGMENT_MS = 2 * 60 * 1000 // rotate every 2 minutes

function getSupportedMimeType(): string {
  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus'
  if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm'
  return 'audio/mp4'
}

export default function Recorder() {
  const [state, setState] = useState<RecordingState>('idle')
  const [seconds, setSeconds] = useState(0)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [title, setTitle] = useState('')
  const [statusMsg, setStatusMsg] = useState('')

  const mediaRecorderRef  = useRef<MediaRecorder | null>(null)
  const chunksRef         = useRef<Blob[]>([])
  const streamRef         = useRef<MediaStream | null>(null)
  const mimeTypeRef       = useRef<string>('')
  const segmentPromises   = useRef<Promise<string>[]>([])
  const rotateTimerRef    = useRef<NodeJS.Timeout | null>(null)
  const timerRef          = useRef<NodeJS.Timeout | null>(null)
  const wakeLockRef       = useRef<WakeLockSentinel | null>(null)
  const audioCtxRef       = useRef<AudioContext | null>(null)
  const noSleepSourceRef  = useRef<AudioBufferSourceNode | null>(null)

  const router   = useRouter()
  const supabase = createClient()

  // ── Wake Lock: evita que la pantalla se apague (Chrome/Android/iOS 16.4+) ──
  const requestWakeLock = useCallback(async () => {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      } catch { /* silencioso si no soportado */ }
    }
  }, [])

  const releaseWakeLock = useCallback(() => {
    wakeLockRef.current?.release().catch(() => {})
    wakeLockRef.current = null
  }, [])

  // ── Silent AudioContext: mantiene iOS vivo cuando la pantalla se bloquea ──
  const startNoSleep = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtx()
      const buffer = ctx.createBuffer(1, 1, 22050)
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.loop = true
      source.connect(ctx.destination)
      source.start(0)
      audioCtxRef.current = ctx
      noSleepSourceRef.current = source
    } catch { /* silencioso */ }
  }, [])

  const stopNoSleep = useCallback(() => {
    try { noSleepSourceRef.current?.stop() } catch {}
    try { audioCtxRef.current?.close() } catch {}
    noSleepSourceRef.current = null
    audioCtxRef.current = null
  }, [])

  // ── Detectar si la grabación se interrumpió al volver a la app ──
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && state === 'recording') {
        if (mediaRecorderRef.current?.state === 'inactive') {
          stopNoSleep()
          releaseWakeLock()
          setErrorMsg('La grabación se interrumpió porque cerraste la app o la pantalla se apagó. Vuelve a intentarlo.')
          setState('error')
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [state, stopNoSleep, releaseWakeLock])

  // ── Timer ──
  useEffect(() => {
    if (state === 'recording') {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [state])

  // ── Transcribe a blob (no DB save — just returns text) ──
  const transcribeBlob = useCallback(async (blob: Blob): Promise<string> => {
    const ext = mimeTypeRef.current.includes('mp4') ? 'm4a' : 'webm'
    const fd = new FormData()
    fd.append('audio', blob, `seg.${ext}`)
    const res = await fetch('/api/transcribe', { method: 'POST', body: fd })
    if (!res.ok) return ''
    const data = await res.json()
    return data.transcript || ''
  }, [])

  // ── Create a new MediaRecorder on the existing stream ──
  const startRecorder = useCallback((mediaStream: MediaStream) => {
    const mimeType = mimeTypeRef.current
    const recorder = new MediaRecorder(mediaStream, { mimeType })
    chunksRef.current = []
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.start(1000)
    mediaRecorderRef.current = recorder
  }, [])

  // ── Stop current recorder and get its blob ──
  const stopRecorderAndGetBlob = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current!
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current })
        chunksRef.current = []
        resolve(blob)
      }
      if (recorder.state !== 'inactive') recorder.stop()
      else resolve(new Blob([], { type: mimeTypeRef.current }))
    })
  }, [])

  // ── Rotate: stop segment, transcribe in background, start new segment ──
  const rotateSegment = useCallback(async () => {
    const blob = await stopRecorderAndGetBlob()
    if (streamRef.current) startRecorder(streamRef.current)     // restart immediately
    if (blob.size > 1000) {
      segmentPromises.current.push(transcribeBlob(blob))
    }
  }, [stopRecorderAndGetBlob, startRecorder, transcribeBlob])

  // ── START ──
  const startRecording = useCallback(async () => {
    setErrorMsg('')
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = mediaStream
      setStream(mediaStream)
      mimeTypeRef.current = getSupportedMimeType()
      segmentPromises.current = []

      startRecorder(mediaStream)
      setState('recording')
      setSeconds(0)

      // Mantener vivo en background (Wake Lock + silent audio para iOS)
      await requestWakeLock()
      startNoSleep()

      // Rotate every 2 minutes
      rotateTimerRef.current = setInterval(rotateSegment, SEGMENT_MS)
    } catch {
      setErrorMsg('No se pudo acceder al micrófono. Ve a Configuración → Privacidad → Micrófono.')
      setState('error')
    }
  }, [startRecorder, rotateSegment, requestWakeLock, startNoSleep])

  // ── STOP ──
  const stopRecording = useCallback(async () => {
    // Stop rotation timer
    if (rotateTimerRef.current) {
      clearInterval(rotateTimerRef.current)
      rotateTimerRef.current = null
    }

    setState('processing')
    setStatusMsg('Finalizando grabación…')

    // Liberar Wake Lock y silent audio
    releaseWakeLock()
    stopNoSleep()

    // Stop final segment
    const finalBlob = await stopRecorderAndGetBlob()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    setStream(null)

    if (finalBlob.size > 1000) {
      segmentPromises.current.push(transcribeBlob(finalBlob))
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const meetingTitle = title.trim() ||
        `Reunión ${new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' })}`

      // Create meeting record
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

      // Upload audio (last segment only for storage reference)
      const ext = mimeTypeRef.current.includes('mp4') ? 'm4a' : 'webm'
      await supabase.storage
        .from('meeting-audio')
        .upload(`${user.id}/${meeting.id}.${ext}`, finalBlob, { contentType: mimeTypeRef.current })

      // Wait for all segment transcriptions
      setStatusMsg(`Transcribiendo ${segmentPromises.current.length} segmento(s)…`)
      const transcripts = await Promise.all(segmentPromises.current)
      const fullTranscript = transcripts.filter(Boolean).join(' ')

      // Save combined transcript
      const participantsSet = new Set<string>()
      const speakerMatches = fullTranscript.match(/([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+):/g)
      if (speakerMatches) {
        speakerMatches.forEach((s) => participantsSet.add(s.replace(':', '').trim()))
      }

      await supabase
        .from('meetings')
        .update({ transcript: fullTranscript, participants: [...participantsSet].slice(0, 8), status: 'processing' })
        .eq('id', meeting.id)

      // Summarize
      setStatusMsg('Generando resumen con IA…')
      await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId: meeting.id, transcript: fullTranscript }),
      })

      setState('done')
      setStatusMsg('')
      setTimeout(() => router.push(`/meeting/${meeting.id}`), 1500)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido')
      setState('error')
    }
  }, [stopRecorderAndGetBlob, transcribeBlob, seconds, title, supabase, router, releaseWakeLock, stopNoSleep])

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
          <div className="w-28 h-28 rounded-full glass flex flex-col items-center justify-center gap-2">
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
            <p className="text-white/40 text-sm mt-1">Puedes bloquear la pantalla — sigue grabando</p>
          </div>
        )}
        {state === 'processing' && (
          <div>
            <p className="text-white font-semibold">Transcribiendo con IA</p>
            <p className="text-white/40 text-sm mt-1">{statusMsg || 'Groq Whisper + Cerebras AI'}</p>
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
