'use client'

import { Meeting } from '@/types'
import { formatDuration, formatRelativeDate } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Mic, CheckSquare, Loader2, AlertCircle, ChevronRight, Trash2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const statusConfig = {
  recording: { icon: Mic, color: 'text-rose-400', bg: 'bg-rose-400/10', label: 'Grabando' },
  processing: { icon: Loader2, color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'Procesando' },
  ready: { icon: CheckSquare, color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Listo' },
  error: { icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-400/10', label: 'Error' },
}

interface Props {
  meeting: Meeting
  index: number
}

export default function MeetingCard({ meeting, index }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  const status = statusConfig[meeting.status]
  const StatusIcon = status.icon
  const actionCount = meeting.action_items?.filter((a) => !a.done).length ?? 0

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setConfirming(true)
  }

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setConfirming(false)
  }

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDeleting(true)
    try {
      const res = await fetch(`/api/meetings/${meeting.id}`, { method: 'DELETE' })
      if (res.ok) {
        router.refresh()
      }
    } catch {
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="relative"
    >
      <Link href={`/meeting/${meeting.id}`} className="block group">
        <div className={`glass rounded-2xl p-5 hover:border-indigo-500/40 transition-all duration-200 group-hover:bg-white/[0.07] ${deleting ? 'opacity-50' : ''}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Status badge */}
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${status.bg} mb-3`}>
                <StatusIcon
                  className={`w-3 h-3 ${status.color} ${meeting.status === 'processing' ? 'animate-spin' : ''}`}
                />
                <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-white truncate text-base leading-snug">
                {meeting.title}
              </h3>

              {/* Meta */}
              <div className="flex items-center gap-4 mt-2 text-white/40 text-sm">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(meeting.duration_seconds)}
                </span>
                <span>{formatRelativeDate(meeting.date)}</span>
                {meeting.participants.length > 0 && (
                  <span>{meeting.participants.length} participantes</span>
                )}
              </div>

              {/* Summary preview */}
              {meeting.summary && (
                <p className="mt-3 text-sm text-white/50 line-clamp-2 leading-relaxed">
                  {meeting.summary}
                </p>
              )}

              {/* Action items badge */}
              {actionCount > 0 && (
                <div className="mt-3 inline-flex items-center gap-1.5 bg-indigo-500/15 text-indigo-400 text-xs px-2.5 py-1 rounded-full">
                  <CheckSquare className="w-3 h-3" />
                  {actionCount} tarea{actionCount !== 1 ? 's' : ''} pendiente{actionCount !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 mt-1">
              {/* Delete button */}
              <button
                onClick={handleDeleteClick}
                className="p-1.5 rounded-lg text-white/20 hover:text-rose-400 hover:bg-rose-400/10 transition opacity-0 group-hover:opacity-100"
                title="Eliminar reunión"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/50 transition" />
            </div>
          </div>
        </div>
      </Link>

      {/* Confirmation overlay */}
      <AnimatePresence>
        {confirming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 rounded-2xl bg-[#0d0920]/95 backdrop-blur-sm border border-rose-500/30 flex flex-col items-center justify-center gap-4 p-6"
          >
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-semibold text-sm">¿Eliminar esta reunión?</span>
            </div>
            <p className="text-white/50 text-xs text-center max-w-xs">
              <span className="text-white/80 font-medium">"{meeting.title}"</span>
              <br />Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm font-medium transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 disabled:opacity-60 text-white text-sm font-medium transition flex items-center gap-2"
              >
                {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Sí, eliminar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
