import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MeetingCard from '@/features/meetings/components/MeetingCard'
import StatsBar from '@/features/meetings/components/StatsBar'
import { Meeting } from '@/types'
import { Mic, Plus, LogOut } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: meetings } = await supabase
    .from('meetings')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  const allMeetings: Meeting[] = meetings || []

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20 glass border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <Mic className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="font-bold text-white text-lg">RoSummary</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-white/40 text-sm">{user.email}</span>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white/70 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Title + CTA */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Tus reuniones</h1>
            <p className="text-white/40 text-sm mt-1">
              {allMeetings.length === 0 ? 'Empieza grabando tu primera reunión' : `${allMeetings.length} reuniones guardadas`}
            </p>
          </div>
          <Link
            href="/meeting/new"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl transition glow text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva reunión</span>
            <span className="sm:hidden">Nueva</span>
          </Link>
        </div>

        {/* Stats */}
        {allMeetings.length > 0 && <StatsBar meetings={allMeetings} />}

        {/* Meeting list */}
        {allMeetings.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {allMeetings.map((meeting, i) => (
              <MeetingCard key={meeting.id} meeting={meeting} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5">
      <div
        className="w-24 h-24 rounded-3xl glass flex items-center justify-center"
        style={{ boxShadow: '0 0 60px rgba(99,102,241,0.2)' }}
      >
        <Mic className="w-12 h-12 text-indigo-400" />
      </div>
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white">Sin reuniones aún</h3>
        <p className="text-white/40 text-sm mt-2 max-w-xs">
          Graba tu primera reunión y obtén un resumen inteligente en segundos
        </p>
      </div>
      <Link
        href="/meeting/new"
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition"
      >
        <Mic className="w-4 h-4" />
        Grabar primera reunión
      </Link>
    </div>
  )
}
