import type { ReactNode } from 'react'
import { Header } from './Header'
import { BackgroundProvider } from '@/components/backgrounds'
import { ToastContainer } from '@/components/ui'

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <BackgroundProvider>
      <div className="relative min-h-screen">
        {/* Header */}
        <Header />

        {/* Main Content */}
        <main className="relative z-10 mx-auto max-w-7xl px-4 pb-8 pt-24">{children}</main>

        {/* Toast Notifications */}
        <ToastContainer />
      </div>
    </BackgroundProvider>
  )
}
