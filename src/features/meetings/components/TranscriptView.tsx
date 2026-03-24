'use client'

import { useState } from 'react'
import { FileText, Copy, Check } from 'lucide-react'

interface Props {
  transcript: string | null
}

export default function TranscriptView({ transcript }: Props) {
  const [copied, setCopied] = useState(false)

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

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <h3 className="font-semibold text-white text-sm">Transcripción</h3>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition px-2 py-1 rounded-lg hover:bg-white/5"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto pr-1">
        <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{transcript}</p>
      </div>
    </div>
  )
}
