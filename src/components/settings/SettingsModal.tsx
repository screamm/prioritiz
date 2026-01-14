import { Modal, Button } from '@/components/ui'
import { ThemeSelector } from './ThemeSelector'
import { TokenDisplay } from './TokenDisplay'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Inställningar">
      <div className="space-y-6">
        {/* Theme Selection */}
        <section>
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-white/60">
            Bakgrundstema
          </h3>
          <ThemeSelector />
        </section>

        {/* Token Management */}
        <section>
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-white/60">
            Återställningskod
          </h3>
          <TokenDisplay />
        </section>

        {/* Danger Zone */}
        <section className="border-t border-border-glass pt-6">
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-red-400">
            Farozon
          </h3>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (confirm('Är du säker på att du vill rensa alla todos?')) {
                  // Clear todos logic
                }
              }}
            >
              Rensa alla todos
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (
                  confirm(
                    'Är du säker på att du vill återställa till standardprioriteringar?'
                  )
                ) {
                  // Reset priorities logic
                }
              }}
            >
              Återställ prioriteringar
            </Button>
          </div>
        </section>
      </div>
    </Modal>
  )
}
