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

export default function MeetingChat({ meetingId, initialMessages, transcript }: Props) {
  const [messages, setMessages] = useState<MeetingMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg: MeetingMessage = {
      id: Date.now().toString(),
      meeting_id: meetingId,
      role: 'user',
      content: input.trim(),
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      // Save user message
      await supabase.from('meeting_messages').insert({
        meeting_id: meetingId,
        role: 'user',
        content: userMsg.content,
      })

      // Get AI response
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

      // Save assistant message
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

  if (!transcript) return null

  const suggestedQuestions = [
    '¿Cuáles fueron las decisiones principales?',
    '¿Qué seguimiento necesita esta reunión?',
    '¿Quiénes participaron?',
  ]

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-cyan-400" />
        <h3 className="font-semibold text-white text-sm">Habla con tu reunión</h3>
      </div>

      {/* Messages */}
      <div className="px-4 py-4 space-y-3 max-h-80 overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-center py-4">
            <Bot className="w-8 h-8 text-white/20 mx-auto mb-2" />
            <p className="text-white/40 text-sm mb-4">
              Pregúntame sobre la reunión
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="text-xs bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 rounded-lg px-3 py-1.5 transition border border-white/10"
                >
                  {q}
                </button>
              ))}
            </div>
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
              {/* Avatar */}
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

              {/* Bubble */}
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-2"
          >
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
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregunta sobre la reunión…"
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
