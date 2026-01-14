import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Send, Loader2 } from 'lucide-react'
import { Modal, Button, Input } from '@/components/ui'
import { toast } from '@/stores/toastStore'
import { API_URL } from '@/utils/constants'

const emailSchema = z.object({
  email: z.string().email('Ange en giltig e-postadress'),
})

type EmailForm = z.infer<typeof emailSchema>

interface EmailModalProps {
  isOpen: boolean
  onClose: () => void
  token: string
}

export function EmailModal({ isOpen, onClose, token }: EmailModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
  })

  const onSubmit = async (data: EmailForm) => {
    setIsLoading(true)

    try {
      const response = await fetch(`${API_URL}/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          token,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send email')
      }

      toast.success(`Återställningskod skickad till ${data.email}`)
      reset()
      onClose()
    } catch {
      toast.error('Kunde inte skicka e-post. Försök igen.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Skicka återställningskod">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm text-white/70">
            E-postadress
          </label>
          <Input
            type="email"
            placeholder="din@email.se"
            {...register('email')}
            error={errors.email?.message}
            disabled={isLoading}
          />
        </div>

        <p className="text-sm text-white/50">
          Vi skickar din återställningskod <strong className="font-mono">{token}</strong> till
          din e-post så att du kan återställa din lista om du tappar bort den.
        </p>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Avbryt
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Skickar...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Skicka
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
