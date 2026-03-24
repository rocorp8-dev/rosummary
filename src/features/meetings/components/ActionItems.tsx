'use client'

import { useState } from 'react'
import { ActionItem } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { CheckSquare, Square, ListChecks } from 'lucide-react'

interface Props {
  meetingId: string
  initialItems: ActionItem[]
}

export default function ActionItems({ meetingId, initialItems }: Props) {
  const [items, setItems] = useState<ActionItem[]>(initialItems || [])
  const supabase = createClient()

  const toggleItem = async (id: string) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, done: !item.done } : item
    )
    setItems(updated)
    await supabase
      .from('meetings')
      .update({ action_items: updated })
      .eq('id', meetingId)
  }

  if (items.length === 0) return null

  const doneCount = items.filter((i) => i.done).length

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-indigo-400" />
          <h3 className="font-semibold text-white text-sm">Tareas pendientes</h3>
        </div>
        <span className="text-xs text-white/40">{doneCount}/{items.length}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-white/5 rounded-full h-1 mb-4">
        <div
          className="bg-indigo-500 h-1 rounded-full transition-all duration-500"
          style={{ width: `${items.length > 0 ? (doneCount / items.length) * 100 : 0}%` }}
        />
      </div>

      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => toggleItem(item.id)}
              className="flex items-start gap-3 w-full text-left group"
            >
              <div className="mt-0.5 flex-shrink-0">
                {item.done ? (
                  <CheckSquare className="w-4 h-4 text-indigo-400" />
                ) : (
                  <Square className="w-4 h-4 text-white/30 group-hover:text-white/60 transition" />
                )}
              </div>
              <span
                className={`text-sm leading-snug transition ${
                  item.done ? 'line-through text-white/30' : 'text-white/70 group-hover:text-white/90'
                }`}
              >
                {item.text}
                {item.assignee && (
                  <span className="ml-2 text-xs text-indigo-400">@{item.assignee}</span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
