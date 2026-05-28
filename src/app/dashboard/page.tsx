import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MeetingCard from '@/features/meetings/components/MeetingCard'
import StatsBar from '@/features/meetings/components/StatsBar'
import { Meeting } from '@/types'
import { Plus, LogOut, Mic } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

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
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(145deg,#1a1048,#0d0a28)', boxShadow: '0 0 0 1px rgba(0,200,220,0.3)' }}>
              <Mic className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="font-black tracking-tight text-xl leading-none">
              <span className="text-white">Ro</span>
              <span style={{ color: '#00c8dc' }}>D</span>
              <span className="text-white">icta</span>
            </span>
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
        className="relative w-36 h-48"
        style={{ filter: 'drop-shadow(0 0 30px rgba(0,200,220,0.4))' }}
      >
        <Image src="/rodicta-mic.png" alt="RoDicta" fill className="object-contain" />
      </div>
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white">Sin reuniones aún</h3>
        <p className="text-white/40 text-sm mt-2 max-w-xs">
          Graba tu primera reunión y obtén un resumen inteligente en segundos
        </p>
      </div>
      <Link
        href="/meeting/new"
        className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-6 py-3 rounded-xl transition"
      >
        Grabar primera reunión
      </Link>
    </div>
  )
}
