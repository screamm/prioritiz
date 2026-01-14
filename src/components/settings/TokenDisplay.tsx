import { useState } from 'react'
import { Copy, Check, Mail, QrCode, RefreshCw } from 'lucide-react'
import { useSettingsStore } from '@/stores'
import { toast } from '@/stores/toastStore'
import { copyToClipboard } from '@/utils'
import { Button } from '@/components/ui'
import { QRCodeModal } from './QRCodeModal'
import { EmailModal } from './EmailModal'

export function TokenDisplay() {
  const { token, generateNewToken } = useSettingsStore()
  const [copied, setCopied] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [emailModalOpen, setEmailModalOpen] = useState(false)

  const handleCopy = async () => {
    if (token) {
      const success = await copyToClipboard(token)
      if (success) {
        setCopied(true)
        toast.success('Token kopierad till urklipp!')
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }

  const handleGenerateNew = () => {
    if (confirm('Generera ny token? Din gamla token kommer sluta fungera.')) {
      const newToken = generateNewToken()
      toast.success(`Ny token genererad: ${newToken}`)
    }
  }

  if (!token) {
    return (
      <div className="rounded-lg bg-surface p-4 text-center">
        <p className="mb-3 text-sm text-white/60">
          Din återställningskod skapas när du lägger till din första todo.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Token Display */}
        <div className="flex items-center gap-3 rounded-lg bg-surface p-4">
          <div className="flex-1">
            <p className="mb-1 text-xs text-white/50">Din återställningskod</p>
            <p className="font-mono text-2xl tracking-wider text-white">{token}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            title="Kopiera"
          >
            {copied ? (
              <Check className="h-5 w-5 text-green-400" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => setQrModalOpen(true)}>
            <QrCode className="mr-2 h-4 w-4" />
            Visa QR-kod
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setEmailModalOpen(true)}>
            <Mail className="mr-2 h-4 w-4" />
            Skicka via e-post
          </Button>
          <Button variant="ghost" size="sm" onClick={handleGenerateNew}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Generera ny
          </Button>
        </div>

        {/* Info */}
        <p className="text-xs text-white/40">
          Spara denna kod för att kunna återställa din lista om du rensar webbläsardata.
        </p>
      </div>

      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        token={token}
      />
      <EmailModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        token={token}
      />
    </>
  )
}
