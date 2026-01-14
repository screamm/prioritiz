import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, Copy, QrCode, Check, Cloud, CloudOff } from 'lucide-react'
import { useSettingsStore } from '@/stores'
import { copyToClipboard } from '@/utils'
import { toast } from '@/stores/toastStore'
import { Button } from '@/components/ui'
import { SettingsModal } from '@/components/settings'

export function Header() {
  const { token, lastSyncAt } = useSettingsStore()
  const [copied, setCopied] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleCopyToken = async () => {
    if (token) {
      const success = await copyToClipboard(token)
      if (success) {
        setCopied(true)
        toast.success('Token kopierad!')
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }

  const isSynced = lastSyncAt && Date.now() - lastSyncAt < 60000 // Synced within last minute

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50">
        <div className="glass border-b border-border-glass">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
            {/* Logo */}
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
                <span className="text-xl font-bold text-white">P</span>
              </div>
              <h1 className="text-xl font-semibold text-gradient">Prioritiz</h1>
            </motion.div>

            {/* Token & Actions */}
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {/* Sync Status */}
              <div className="flex items-center gap-2 text-sm">
                {isSynced ? (
                  <Cloud className="h-4 w-4 text-green-400" />
                ) : (
                  <CloudOff className="h-4 w-4 text-white/40" />
                )}
                <span className="hidden text-white/60 sm:inline">
                  {isSynced ? 'Synkad' : 'Ej synkad'}
                </span>
              </div>

              {/* Token Display */}
              {token && (
                <div className="flex items-center gap-2">
                  <div className="hidden items-center gap-2 rounded-lg bg-surface px-3 py-1.5 sm:flex">
                    <span className="font-mono text-sm text-white/80">{token}</span>
                    <button
                      onClick={handleCopyToken}
                      className="text-white/60 transition-colors hover:text-white"
                      title="Kopiera token"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toast.info('QR-kod kommer snart!')}
                    className="sm:hidden"
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Settings Button */}
              <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)}>
                <Settings className="h-5 w-5" />
              </Button>
            </motion.div>
          </div>
        </div>
      </header>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}
