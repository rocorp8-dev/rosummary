import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Meeting, MeetingMessage } from '@/types'
import TranscriptView from '@/features/meetings/components/TranscriptView'
import SummaryPanel from '@/features/meetings/components/SummaryPanel'
import ActionItems from '@/features/meetings/components/ActionItems'
import MeetingChat from '@/features/meetings/components/MeetingChat'
import { ArrowLeft, Calendar, Clock, Users, Mic } from 'lucide-react'
import { formatDuration, formatRelativeDate } from '@/lib/utils'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function MeetingDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: meeting } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!meeting) notFound()

  const { data: messages } = await supabase
    .from('meeting_messages')
    .select('*')
    .eq('meeting_id', id)
    .order('created_at', { ascending: true })

  const m = meeting as Meeting
  const msgs = (messages || []) as MeetingMessage[]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20 glass border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl hover:bg-white/5 text-white/50 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-white truncate">{m.title}</h1>
            <p className="text-white/40 text-xs">{formatRelativeDate(m.date)}</p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {/* Meta bar — full width */}
        <div className="glass rounded-2xl px-5 py-4">
          <div className="flex flex-wrap gap-4 text-sm text-white/50">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-400" />
              {new Date(m.date).toLocaleDateString('es-MX', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              {formatDuration(m.duration_seconds)}
            </span>
            {m.participants.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-400" />
                {m.participants.join(', ')}
              </span>
            )}
            {m.status === 'processing' && (
              <span className="flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="text-amber-400">Procesando…</span>
              </span>
            )}
          </div>
        </div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {/* ── Columna izquierda: Resumen + Tareas + Chat ── */}
          <div className="space-y-4">
            <SummaryPanel summary={m.summary} status={m.status} />
            <ActionItems meetingId={m.id} initialItems={m.action_items || []} />
            <MeetingChat meetingId={m.id} initialMessages={msgs} transcript={m.transcript} />
          </div>

          {/* ── Columna derecha: Transcripción ── */}
          <div className="lg:sticky lg:top-24">
            <TranscriptView transcript={m.transcript} />
          </div>
        </div>
      </main>
    </div>
  )
}
