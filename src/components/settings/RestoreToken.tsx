import { useState, useCallback } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { syncService } from '@/services/sync'
import { toast } from '@/stores/toastStore'
import { cn } from '@/utils'

export function RestoreToken() {
  const [restoreCode, setRestoreCode] = useState('')
  const [isRestoring, setIsRestoring] = useState(false)

  // Format input as XXX-XXX-XXX
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')

    // Add dashes after every 3 characters
    if (value.length > 3) {
      value = value.slice(0, 3) + '-' + value.slice(3)
    }
    if (value.length > 7) {
      value = value.slice(0, 7) + '-' + value.slice(7)
    }

    // Limit to 11 characters (XXX-XXX-XXX)
    value = value.slice(0, 11)

    setRestoreCode(value)
  }, [])

  const isValidCode = restoreCode.length === 11 && /^[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{3}$/.test(restoreCode)

  const handleRestore = useCallback(async () => {
    if (!isValidCode || isRestoring) return

    setIsRestoring(true)

    try {
      const success = await syncService.restore(restoreCode)

      if (success) {
        toast.success('Data återställd! Dina todos och prioriteringar har laddats.')
        setRestoreCode('')
      } else {
        toast.error('Kunde inte återställa data. Kontrollera koden och försök igen.')
      }
    } catch (error) {
      toast.error('Ett fel uppstod vid återställning. Försök igen senare.')
    } finally {
      setIsRestoring(false)
    }
  }, [restoreCode, isValidCode, isRestoring])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isValidCode && !isRestoring) {
      handleRestore()
    }
  }, [handleRestore, isValidCode, isRestoring])

  return (
    <div className="space-y-3">
      <p className="text-sm text-white/60">
        Har du en återställningskod? Skriv in den nedan för att ladda din sparade data.
      </p>

      <div className="flex gap-2">
        <Input
          type="text"
          value={restoreCode}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="XXX-XXX-XXX"
          disabled={isRestoring}
          className={cn(
            'font-mono text-center tracking-widest',
            restoreCode.length > 0 && !isValidCode && 'border-yellow-500/50'
          )}
          aria-label="Återställningskod"
        />

        <Button
          variant="primary"
          onClick={handleRestore}
          disabled={!isValidCode || isRestoring}
          icon={isRestoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        >
          {isRestoring ? 'Laddar...' : 'Återställ'}
        </Button>
      </div>

      {restoreCode.length > 0 && !isValidCode && (
        <p className="text-xs text-yellow-400">
          Koden ska vara i formatet XXX-XXX-XXX (bokstäver och siffror)
        </p>
      )}
    </div>
  )
}
