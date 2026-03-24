'use client'

import { Meeting } from '@/types'
import { formatDuration } from '@/lib/utils'
import { Mic, Clock, CheckSquare, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

interface Props {
  meetings: Meeting[]
}

export default function StatsBar({ meetings }: Props) {
  const totalSeconds = meetings.reduce((sum, m) => sum + (m.duration_seconds || 0), 0)
  const readyMeetings = meetings.filter((m) => m.status === 'ready').length
  const totalTasks = meetings.reduce((sum, m) => sum + (m.action_items?.length || 0), 0)
  const pendingTasks = meetings.reduce(
    (sum, m) => sum + (m.action_items?.filter((a) => !a.done).length || 0),
    0
  )

  const stats = [
    { icon: Mic, label: 'Reuniones', value: meetings.length, sub: `${readyMeetings} procesadas` },
    { icon: Clock, label: 'Tiempo total', value: formatDuration(totalSeconds), sub: 'grabado' },
    { icon: CheckSquare, label: 'Tareas', value: totalTasks, sub: `${pendingTasks} pendientes` },
    { icon: TrendingUp, label: 'Esta semana', value: meetings.filter(m => {
      const d = new Date(m.date)
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return d >= weekAgo
    }).length, sub: 'reuniones' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {stats.map((stat, i) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4 text-indigo-400" />
              <span className="text-white/40 text-xs">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-white/30 text-xs mt-0.5">{stat.sub}</p>
          </motion.div>
        )
      })}
    </div>
  )
}
