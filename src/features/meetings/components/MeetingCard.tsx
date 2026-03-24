'use client'

import { Meeting } from '@/types'
import { formatDuration, formatRelativeDate } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Clock, Mic, CheckSquare, Loader2, AlertCircle, ChevronRight } from 'lucide-react'
import Link from 'next/link'

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
  const status = statusConfig[meeting.status]
  const StatusIcon = status.icon
  const actionCount = meeting.action_items?.filter((a) => !a.done).length ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <Link href={`/meeting/${meeting.id}`} className="block group">
        <div className="glass rounded-2xl p-5 hover:border-indigo-500/40 transition-all duration-200 group-hover:bg-white/[0.07]">
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

            <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/50 transition mt-1 flex-shrink-0" />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
