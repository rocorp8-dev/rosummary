import type { Metadata, Viewport } from 'next'
import './globals.css'
import ServiceWorkerRegister from './sw-register'

export const metadata: Metadata = {
  title: 'RoSummary — Reuniones Inteligentes',
  description: 'Graba, transcribe y analiza tus reuniones con IA. Resúmenes automáticos, tareas pendientes y chat con tu reunión.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'RoSummary',
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#07071a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen antialiased">
        {/* Background gradient */}
        <div
          className="fixed inset-0 -z-10"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.15) 0%, transparent 60%), #07071a',
          }}
        />
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  )
}
