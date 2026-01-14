import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, KeyRound } from 'lucide-react'
import { Modal, Button } from '@/components/ui'
import { toast } from '@/stores/toastStore'
import { syncService } from '@/services'

const restoreSchema = z.object({
  token: z
    .string()
    .min(1, 'Ange en återställningskod')
    .regex(/^[A-Z2-9]{3}-[A-Z2-9]{3}-[A-Z2-9]{3}$/, 'Ogiltigt format (XXX-XXX-XXX)'),
})

type RestoreForm = z.infer<typeof restoreSchema>

interface RestoreModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function RestoreModal({ isOpen, onClose, onSuccess }: RestoreModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<RestoreForm>({
    resolver: zodResolver(restoreSchema),
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Auto-format: add dashes after every 3 characters
    let value = e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, '')
    if (value.length > 3) {
      value = value.slice(0, 3) + '-' + value.slice(3)
    }
    if (value.length > 7) {
      value = value.slice(0, 7) + '-' + value.slice(7)
    }
    setValue('token', value.slice(0, 11))
  }

  const onSubmit = async (data: RestoreForm) => {
    setIsLoading(true)

    try {
      const success = await syncService.restore(data.token)

      if (success) {
        toast.success('Din lista har återställts!')
        reset()
        onClose()
        onSuccess?.()
      } else {
        toast.error('Ingen data hittades för denna kod')
      }
    } catch {
      toast.error('Kunde inte återställa. Försök igen.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Återställ din lista">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm text-white/70">
            Återställningskod
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
            <input
              {...register('token')}
              onChange={handleInputChange}
              placeholder="XXX-XXX-XXX"
              className="input-base pl-10 font-mono text-lg tracking-widest"
              disabled={isLoading}
              maxLength={11}
            />
          </div>
          {errors.token && (
            <p className="mt-1 text-sm text-red-400">{errors.token.message}</p>
          )}
        </div>

        <p className="text-sm text-white/50">
          Ange din återställningskod för att hämta din sparade lista.
          Koden har formatet XXX-XXX-XXX.
        </p>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Avbryt
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Återställer...
              </>
            ) : (
              'Återställ'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
