import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'CRYPSIS Dashboard',
  description: 'Mes projets freelance',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-bold tracking-tight text-slate-900">
              CRYPSIS <span className="text-brand-600">Dashboard</span>
            </Link>
            <Link
              href="/projects/new"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              + Nouveau projet
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
        <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-400">
          © {new Date().getFullYear()} — CRYPSIS Dashboard
        </footer>
      </body>
    </html>
  )
}
