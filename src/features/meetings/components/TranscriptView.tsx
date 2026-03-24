'use client'

import { useState } from 'react'
import { FileText, Copy, Check, Users } from 'lucide-react'

interface Props {
  transcript: string | null
}

type Segment = { speaker: 'A' | 'B'; text: string }

/**
 * Intenta separar la transcripción en segmentos por hablante.
 * Detecta patrones: "Speaker 1:", "Hablante A:", "A:", "1:", líneas en blanco, etc.
 * Si no detecta patrones claros, divide por párrafos y alterna A/B.
 */
function parseSegments(transcript: string): Segment[] | null {
  // Patrón explícito: "Speaker 1:", "Hablante 1:", "A:", "B:", "1:", "2:"
  const explicitPattern = /^(speaker\s*\d+|hablante\s*[ab\d]+|[ab\d])\s*:/im
  if (explicitPattern.test(transcript)) {
    const lines = transcript.split('\n').filter((l) => l.trim())
    const segments: Segment[] = []
    let current: Segment | null = null

    for (const line of lines) {
      const match = line.match(/^(speaker\s*(\d+)|hablante\s*([ab\d]+)|([ab\d]))\s*:(.*)/i)
      if (match) {
        if (current) segments.push(current)
        const label = (match[2] || match[3] || match[4] || '').toLowerCase()
        const speaker: 'A' | 'B' = (label === '1' || label === 'a') ? 'A' : 'B'
        current = { speaker, text: match[5].trim() }
      } else if (current) {
        current.text += ' ' + line.trim()
      }
    }
    if (current) segments.push(current)
    return segments.length >= 2 ? segments : null
  }

  // Sin patrón explícito: dividir por doble salto de línea y alternar
  const paragraphs = transcript.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  if (paragraphs.length >= 2) {
    return paragraphs.map((text, i) => ({
      speaker: (i % 2 === 0 ? 'A' : 'B') as 'A' | 'B',
      text,
    }))
  }

  return null
}

export default function TranscriptView({ transcript }: Props) {
  const [copied, setCopied] = useState(false)
  const [mode, setMode] = useState<'split' | 'full'>('split')

  const handleCopy = async () => {
    if (!transcript) return
    await navigator.clipboard.writeText(transcript)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!transcript) {
    return (
      <div className="glass rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
        <FileText className="w-8 h-8 text-white/20" />
        <p className="text-white/40 text-sm">Transcripción no disponible</p>
      </div>
    )
  }

  const segments = parseSegments(transcript)
  const hasSegments = segments && segments.length >= 2

  return (
    <div className="glass rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <h3 className="font-semibold text-white text-sm">Transcripción</h3>
        </div>
        <div className="flex items-center gap-2">
          {hasSegments && (
            <button
              onClick={() => setMode(mode === 'split' ? 'full' : 'split')}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition px-2 py-1 rounded-lg hover:bg-white/5"
            >
              <Users className="w-3 h-3" />
              {mode === 'split' ? 'Ver completo' : 'Ver por hablante'}
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition px-2 py-1 rounded-lg hover:bg-white/5"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-3">
        {hasSegments && mode === 'split' ? (
          <>
            {/* Leyenda */}
            <div className="flex gap-3 text-xs text-white/40 mb-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block" />
                Hablante A
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                Hablante B
              </span>
              <span className="text-white/25 ml-auto italic">estimado por pausas</span>
            </div>

            {segments!.map((seg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${seg.speaker === 'B' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Badge hablante */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-xs font-bold ${
                    seg.speaker === 'A'
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'bg-cyan-500/20 text-cyan-400'
                  }`}
                >
                  {seg.speaker}
                </div>
                <div
                  className={`flex-1 text-sm leading-relaxed px-4 py-2.5 rounded-2xl ${
                    seg.speaker === 'A'
                      ? 'bg-indigo-500/10 text-white/75 rounded-tl-sm border-l-2 border-indigo-500/30'
                      : 'bg-cyan-500/10 text-white/75 rounded-tr-sm border-r-2 border-cyan-500/30'
                  }`}
                >
                  {seg.text}
                </div>
              </div>
            ))}
          </>
        ) : (
          <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{transcript}</p>
        )}
      </div>
    </div>
  )
}
