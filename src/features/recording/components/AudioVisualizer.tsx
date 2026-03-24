'use client'

import { useEffect, useRef } from 'react'

interface Props {
  isRecording: boolean
  stream: MediaStream | null
}

export default function AudioVisualizer({ isRecording, stream }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const contextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    if (!isRecording || !stream) {
      // Draw flat line when not recording
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(0, canvas.height / 2)
          ctx.lineTo(canvas.width, canvas.height / 2)
          ctx.stroke()
        }
      }
      return
    }

    const audioCtx = new AudioContext()
    contextRef.current = audioCtx
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 256
    analyserRef.current = analyser

    const source = audioCtx.createMediaStreamSource(stream)
    source.connect(analyser)

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!

    const draw = () => {
      animRef.current = requestAnimationFrame(draw)
      analyser.getByteTimeDomainData(dataArray)

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Gradient stroke
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)')
      gradient.addColorStop(0.5, 'rgba(34, 211, 238, 0.9)')
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0.4)')
      ctx.strokeStyle = gradient
      ctx.lineWidth = 2.5
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      ctx.beginPath()
      const sliceWidth = canvas.width / bufferLength

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0
        const y = (v * canvas.height) / 2
        if (i === 0) ctx.moveTo(0, y)
        else ctx.lineTo(i * sliceWidth, y)
      }
      ctx.stroke()
    }

    draw()

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      audioCtx.close()
    }
  }, [isRecording, stream])

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={80}
      className="w-full max-w-xs opacity-90"
    />
  )
}
