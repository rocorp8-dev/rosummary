'use client'

import { useState, useRef, useEffect } from 'react'
import { MeetingMessage } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, Loader2, Bot, User } from 'lucide-react'

interface Props {
  meetingId: string
  initialMessages: MeetingMessage[]
  transcript: string | null
}

const SUGGESTED = [
  '¿Cuáles fueron las decisiones principales?',
  '¿Qué seguimiento necesita esta reunión?',
  '¿Quiénes participaron?',
  '¿Cuáles son los próximos pasos?',
]

export default function MeetingChat({ meetingId, initialMessages, transcript }: Props) {
  const [messages, setMessages] = useState<MeetingMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return

    const userMsg: MeetingMessage = {
      id: Date.now().toString(),
      meeting_id: meetingId,
      role: 'user',
      content: text.trim(),
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      await supabase.from('meeting_messages').insert({
        meeting_id: meetingId,
        role: 'user',
        content: userMsg.content,
      })

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId,
          message: userMsg.content,
          transcript,
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) throw new Error('Error del servidor')
      const { reply } = await res.json()

      const assistantMsg: MeetingMessage = {
        id: (Date.now() + 1).toString(),
        meeting_id: meetingId,
        role: 'assistant',
        content: reply,
        created_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMsg])

      await supabase.from('meeting_messages').insert({
        meeting_id: meetingId,
        role: 'assistant',
        content: reply,
      })
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          meeting_id: meetingId,
          role: 'assistant',
          content: 'Lo siento, no pude procesar tu pregunta. Intenta de nuevo.',
          created_at: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  if (!transcript) return null

  return (
    <div className="glass rounded-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-cyan-400" />
        <h3 className="font-semibold text-white text-sm">Habla con tu reunión</h3>
      </div>

      {/* Suggested questions — siempre visibles */}
      <div className="px-4 pt-3 pb-2 border-b border-white/5">
        <p className="text-white/30 text-xs mb-2">Preguntas rápidas</p>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              disabled={loading}
              className="text-xs bg-white/5 hover:bg-cyan-500/15 text-white/55 hover:text-cyan-300 rounded-lg px-3 py-1.5 transition border border-white/10 hover:border-cyan-500/30 disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="px-4 py-4 space-y-3 max-h-72 overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <Bot className="w-8 h-8 text-white/15 mx-auto mb-2" />
            <p className="text-white/30 text-sm">Usa una pregunta rápida o escribe la tuya</p>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  msg.role === 'user' ? 'bg-indigo-600/30' : 'bg-cyan-500/20'
                }`}
              >
                {msg.role === 'user' ? (
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                ) : (
                  <Bot className="w-3.5 h-3.5 text-cyan-400" />
                )}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600/20 text-white/90 rounded-tr-sm'
                    : 'bg-white/5 text-white/80 rounded-tl-sm'
                }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="bg-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
              <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/5">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta…"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-cyan-500/50 transition"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 bg-cyan-600/30 hover:bg-cyan-600/50 disabled:opacity-40 text-cyan-400 rounded-xl transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
