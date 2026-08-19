import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout'
import { DndProvider } from '@/components/dnd'
import { Inbox } from '@/components/inbox'
import { PriorityManager } from '@/components/priority'
import { RestoreModal } from '@/components/restore'
import { ConfirmModal } from '@/components/ui'
import { useTodoStore, useSettingsStore, ensureToken } from '@/stores'
import { syncService } from '@/services'
import { toast } from '@/stores/toastStore'

function HomePage() {
  const todos = useTodoStore((state) => state.todos)
  const token = useSettingsStore((state) => state.token)

  // Generate token on first todo
  useEffect(() => {
    if (todos.length > 0 && !token) {
      const newToken = ensureToken()
      toast.info(`Din återställningskod: ${newToken}`)
    }
  }, [todos.length, token])

  return (
    <DndProvider>
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Inbox Sidebar */}
        <aside className="w-full lg:w-80">
          <Inbox />
        </aside>

        {/* Priority Columns */}
        <main className="flex-1">
          <PriorityManager />
        </main>
      </div>
    </DndProvider>
  )
}

function RestorePage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [isRestoring, setIsRestoring] = useState(true)
  const [confirmState, setConfirmState] = useState<{
    localTodosCount: number
    localPrioritiesCount: number
    remoteTodosCount: number
    remotePrioritiesCount: number
  } | null>(null)

  useEffect(() => {
    if (!token) return

    syncService.restore(token)
      .then((result) => {
        if (result.status === 'needs_confirmation') {
          // Local data exists on this device — don't auto-overwrite it.
          // Wait for explicit confirmation instead of restoring silently.
          setIsRestoring(false)
          setConfirmState(result)
          return
        }

        setIsRestoring(false)
        if (result.status === 'success') {
          toast.success('Din lista har återställts!')
        } else if (result.status === 'empty') {
          toast.info('Den koden har ingen sparad data.')
        } else {
          toast.error('Kunde inte återställa. Kontrollera koden.')
        }
        navigate('/', { replace: true })
      })
      .catch((error) => {
        console.error('Failed to restore:', error)
        setIsRestoring(false)
        toast.error('Kunde inte återställa data. Kontrollera din kod och försök igen.')
        navigate('/', { replace: true })
      })
  }, [token, navigate])

  const handleConfirm = async () => {
    if (!token) return

    setIsRestoring(true)
    try {
      const result = await syncService.restore(token, { force: true })
      if (result.status === 'success') {
        toast.success('Din lista har återställts!')
      } else if (result.status === 'empty') {
        toast.info('Den koden har ingen sparad data.')
      } else if (result.status === 'error') {
        toast.error('Kunde inte återställa. Kontrollera koden.')
      }
    } catch (error) {
      console.error('Failed to restore:', error)
      toast.error('Kunde inte återställa data. Kontrollera din kod och försök igen.')
    } finally {
      setIsRestoring(false)
      setConfirmState(null)
      navigate('/', { replace: true })
    }
  }

  const handleCancel = () => {
    setConfirmState(null)
    navigate('/', { replace: true })
  }

  if (confirmState) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <ConfirmModal
          isOpen
          onClose={handleCancel}
          onConfirm={handleConfirm}
          title="Ersätta din nuvarande lista?"
          message={`Du har just nu ${confirmState.localTodosCount} uppgifter och ${confirmState.localPrioritiesCount} prioriteringar sparade lokalt. Den här länken innehåller ${confirmState.remoteTodosCount} uppgifter och ${confirmState.remotePrioritiesCount} prioriteringar. Om du fortsätter ersätts din nuvarande lista helt – detta går inte att ångra.`}
          confirmText="Ersätt min lista"
          cancelText="Avbryt"
          variant="warning"
          isLoading={isRestoring}
        />
      </div>
    )
  }

  if (isRestoring) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto" />
          <p className="text-white/70">Återställer din lista...</p>
        </div>
      </div>
    )
  }

  return null
}

function WelcomeModal() {
  const [showRestore, setShowRestore] = useState(false)
  const todos = useTodoStore((state) => state.todos)
  const token = useSettingsStore((state) => state.token)

  // Show welcome modal if no todos and no token (new user)
  const isNewUser = todos.length === 0 && !token
  const [dismissed, setDismissed] = useState(false)

  if (!isNewUser || dismissed) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="glass mx-4 max-w-md rounded-2xl p-6">
          <h2 className="mb-2 text-2xl font-semibold text-gradient">
            Välkommen till Prioritiz!
          </h2>
          <p className="mb-6 text-white/70">
            En vacker todo-app med prioriteringssystem.
            Har du en återställningskod från tidigare?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowRestore(true)}
              className="btn-secondary flex-1"
            >
              Ja, återställ
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="btn-primary flex-1"
            >
              Nej, börja ny
            </button>
          </div>
        </div>
      </div>

      <RestoreModal
        isOpen={showRestore}
        onClose={() => setShowRestore(false)}
        onSuccess={() => setDismissed(true)}
      />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <MainLayout>
              <WelcomeModal />
              <HomePage />
            </MainLayout>
          }
        />
        <Route path="/restore/:token" element={<RestorePage />} />
      </Routes>
    </BrowserRouter>
  )
}
