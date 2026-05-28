'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, RefreshCw, AlertCircle, Loader2 } from 'lucide-react'

interface Props {
  summary: string | null
  status: string
  meetingId: string
}

export default function SummaryPanel({ summary, status, meetingId }: Props) {
  const [retrying, setRetrying] = useState(false)
  const [retryError, setRetryError] = useState('')
  const router = useRouter()

  const handleRetry = async () => {
    setRetrying(true)
    setRetryError('')
    try {
      const res = await fetch(`/api/meetings/${meetingId}/retry`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al reintentar')
      }
      router.refresh()
    } catch (err) {
      setRetryError(err instanceof Error ? err.message : 'Error desconocido')
      setRetrying(false)
    }
  }

  // ── Atascada procesando ──
  if (status === 'processing') {
    return (
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            <h3 className="font-semibold text-white text-sm">Resumen IA</h3>
          </div>
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition disabled:opacity-50"
          >
            {retrying
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <RefreshCw className="w-3 h-3" />
            }
            {retrying ? 'Generando…' : 'Reintentar'}
          </button>
        </div>
        <div className="space-y-2">
          <div className="shimmer h-4 rounded-lg" />
          <div className="shimmer h-4 rounded-lg w-5/6" />
          <div className="shimmer h-4 rounded-lg w-4/6" />
        </div>
        {retryError && (
          <p className="mt-3 text-xs text-rose-400">{retryError}</p>
        )}
      </div>
    )
  }

  // ── Error ──
  if (status === 'error') {
    return (
      <div className="glass rounded-2xl p-5 border border-rose-500/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <h3 className="font-semibold text-rose-400 text-sm">Error al resumir</h3>
          </div>
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 transition disabled:opacity-50"
          >
            {retrying
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <RefreshCw className="w-3 h-3" />
            }
            {retrying ? 'Generando…' : 'Reintentar'}
          </button>
        </div>
        <p className="text-white/40 text-sm">
          El resumen no pudo generarse. Haz clic en Reintentar para volver a intentarlo.
        </p>
        {retryError && (
          <p className="mt-3 text-xs text-rose-400">{retryError}</p>
        )}
      </div>
    )
  }

  // ── Sin resumen ──
  if (!summary) {
    return (
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-white/20" />
            <h3 className="font-semibold text-white/40 text-sm">Resumen IA</h3>
          </div>
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 transition disabled:opacity-50"
          >
            {retrying
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <Sparkles className="w-3 h-3" />
            }
            {retrying ? 'Generando…' : 'Generar resumen'}
          </button>
        </div>
        <p className="text-white/30 text-sm">No hay resumen disponible</p>
        {retryError && (
          <p className="mt-3 text-xs text-rose-400">{retryError}</p>
        )}
      </div>
    )
  }

  // ── Listo ──
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h3 className="font-semibold text-white text-sm">Resumen IA</h3>
        </div>
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
        >
          {retrying
            ? <Loader2 className="w-3 h-3 animate-spin" />
            : <RefreshCw className="w-3 h-3" />
          }
          {retrying ? 'Generando…' : 'Volver a generar'}
        </button>
      </div>
      <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">{summary}</p>
      {retryError && (
        <p className="mt-3 text-xs text-rose-400">{retryError}</p>
      )}
    </div>
  )
}

