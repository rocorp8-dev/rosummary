'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Mic, Mail, Lock, ArrowRight, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react'

// Google icon inline SVG
function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

type Mode = 'google' | 'password' | 'magic' | 'signup'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('google')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const siteUrl = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin)
    : process.env.NEXT_PUBLIC_SITE_URL || ''

  // ── Google OAuth ──
  const handleGoogle = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${siteUrl}/auth/callback` },
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  // ── Email + contraseña ──
  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Correo o contraseña incorrectos'
        : error.message)
    }
    setLoading(false)
  }

  // ── Crear cuenta ──
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${siteUrl}/auth/callback` },
    })
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  // ── Magic link ──
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${siteUrl}/auth/callback` },
    })
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 flex flex-col items-center gap-3"
      >
        <div className="w-16 h-16 rounded-2xl glass glow flex items-center justify-center">
          <Mic className="w-8 h-8 text-indigo-400" />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold gradient-text">RoSummary</h1>
          <p className="text-white/50 text-sm mt-1">Reuniones que trabajan por ti</p>
          <a
            href="https://despacho9.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/25 hover:text-indigo-400 text-xs mt-1 transition block"
          >
            by despacho9.vercel.app
          </a>
        </div>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-3xl p-8 w-full max-w-sm"
      >
        {sent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 py-4 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-lg">
                {mode === 'signup' ? '¡Cuenta creada!' : 'Revisa tu correo'}
              </p>
              <p className="text-white/50 text-sm mt-1">
                Enviamos un enlace a <span className="text-indigo-400">{email}</span>
              </p>
            </div>
            <button
              onClick={() => { setSent(false); setMode('google') }}
              className="text-white/40 hover:text-white/70 text-sm transition"
            >
              Volver
            </button>
          </motion.div>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-white mb-5 text-center">Iniciar sesión</h2>

            {/* ── Google button ── */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 disabled:opacity-60 text-gray-800 font-semibold rounded-xl py-3 transition mb-4"
            >
              {loading && mode === 'google' ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
              ) : (
                <GoogleIcon />
              )}
              Continuar con Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/30 text-xs">o</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* ── Tabs: contraseña | crear cuenta ── */}
            <div className="flex rounded-xl bg-white/5 p-1 mb-4">
              <button
                onClick={() => { setMode('password'); setError('') }}
                className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition ${
                  mode === 'password' ? 'bg-indigo-600 text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                Contraseña
              </button>
              <button
                onClick={() => { setMode('signup'); setError('') }}
                className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition ${
                  mode === 'signup' ? 'bg-indigo-600 text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                Crear cuenta
              </button>
            </div>

            {/* ── Email + password form ── */}
            {(mode === 'password' || mode === 'signup') && (
              <form onSubmit={mode === 'signup' ? handleSignup : handlePassword} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña"
                    required
                    minLength={6}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {error && (
                  <p className="text-rose-400 text-xs bg-rose-400/10 rounded-lg px-3 py-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim() || !password}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition text-sm"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {mode === 'signup' ? 'Crear cuenta' : 'Ingresar'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ── Magic link como opción secundaria ── */}
            <div className="mt-4 text-center">
              <button
                onClick={() => { setMode('magic'); setError('') }}
                className="text-white/30 hover:text-white/60 text-xs transition"
              >
                {mode === 'magic' ? '↑ Volver' : 'Enviar enlace mágico por correo'}
              </button>
            </div>

            {mode === 'magic' && (
              <form onSubmit={handleMagicLink} className="mt-3 space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 transition text-sm"
                  />
                </div>
                {error && (
                  <p className="text-rose-400 text-xs bg-rose-400/10 rounded-lg px-3 py-2">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full bg-white/10 hover:bg-white/15 disabled:opacity-50 text-white font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition text-sm"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar enlace'}
                </button>
              </form>
            )}
          </>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 flex gap-6 text-white/30 text-xs"
      >
        <span>🎙 Graba reuniones</span>
        <span>✨ Resúmenes IA</span>
        <span>💬 Chat con la reunión</span>
      </motion.div>
    </div>
  )
}
