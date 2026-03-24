'use client'

import { Sparkles } from 'lucide-react'

interface Props {
  summary: string | null
  status: string
}

export default function SummaryPanel({ summary, status }: Props) {
  if (status === 'processing') {
    return (
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
          <h3 className="font-semibold text-white text-sm">Resumen IA</h3>
        </div>
        <div className="space-y-2">
          <div className="shimmer h-4 rounded-lg" />
          <div className="shimmer h-4 rounded-lg w-5/6" />
          <div className="shimmer h-4 rounded-lg w-4/6" />
        </div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-white/20" />
          <h3 className="font-semibold text-white/40 text-sm">Resumen IA</h3>
        </div>
        <p className="text-white/30 text-sm">No hay resumen disponible</p>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-indigo-400" />
        <h3 className="font-semibold text-white text-sm">Resumen IA</h3>
      </div>
      <p className="text-white/80 text-sm leading-relaxed">{summary}</p>
    </div>
  )
}
