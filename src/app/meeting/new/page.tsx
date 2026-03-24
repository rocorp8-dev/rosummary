import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Recorder from '@/features/recording/components/Recorder'
import { ArrowLeft, Mic } from 'lucide-react'
import Link from 'next/link'

export default async function NewMeetingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 glass border-b border-white/5">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl hover:bg-white/5 text-white/50 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-white">Nueva reunión</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Tips */}
        <div className="glass rounded-2xl p-4 mb-10 w-full max-w-sm">
          <p className="text-white/60 text-xs text-center leading-relaxed">
            💡 <span className="text-white/80">Tip:</span> Habla con claridad y menciona los nombres de los participantes para una mejor transcripción.
          </p>
        </div>

        {/* Recorder component */}
        <Recorder />
      </main>
    </div>
  )
}
