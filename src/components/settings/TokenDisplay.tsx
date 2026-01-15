import { useState } from 'react'
import { Copy, Check, Mail, QrCode, RefreshCw, AlertTriangle, Clock, CloudOff } from 'lucide-react'
import { useSettingsStore } from '@/stores'
import { toast } from '@/stores/toastStore'
import { copyToClipboard } from '@/utils'
import { Button } from '@/components/ui'
import { QRCodeModal } from './QRCodeModal'
import { EmailModal } from './EmailModal'
import { TOKEN_EXPIRATION_DAYS } from '@/types'

export function TokenDisplay() {
  const {
    token,
    lastSyncAt,
    regenerateToken,
    getTokenStatus,
    getDaysRemaining,
  } = useSettingsStore()
  const [copied, setCopied] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [emailModalOpen, setEmailModalOpen] = useState(false)

  const tokenStatus = getTokenStatus()
  const daysRemaining = getDaysRemaining()

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

  const handleRegenerateToken = () => {
    const message = tokenStatus === 'expired'
      ? 'Din token har gatt ut. Vill du generera en ny token?'
      : 'Generera ny token? Din gamla token kommer sluta fungera.'

    if (confirm(message)) {
      const newToken = regenerateToken()
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

  // Determine status display info
  const getStatusInfo = () => {
    switch (tokenStatus) {
      case 'expired':
        return {
          color: 'text-red-400',
          bgColor: 'bg-red-500/10 border-red-500/30',
          icon: AlertTriangle,
          text: 'Token har gatt ut',
          subtext: 'Generera en ny token for att kunna aterstalla din data.',
          showBanner: true,
        }
      case 'expiring':
        return {
          color: 'text-amber-400',
          bgColor: 'bg-amber-500/10 border-amber-500/30',
          icon: AlertTriangle,
          text: `Token gar ut om ${daysRemaining} ${daysRemaining === 1 ? 'dag' : 'dagar'}`,
          subtext: 'Synka for att forlanga giltigheten med 90 dagar.',
          showBanner: true,
        }
      case 'never-synced':
        return {
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10 border-blue-500/30',
          icon: CloudOff,
          text: 'Ej synkad an',
          subtext: `Synka for att sakra din data. Token giltig i ${daysRemaining} ${daysRemaining === 1 ? 'dag' : 'dagar'}.`,
          showBanner: true,
        }
      default:
        return {
          color: 'text-white/60',
          bgColor: '',
          icon: Clock,
          text: daysRemaining !== null ? `Giltig i ${daysRemaining} dagar` : '',
          subtext: 'Synka for att forlanga',
          showBanner: false,
        }
    }
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon

  // Format last sync date for display
  const formatLastSync = () => {
    if (!lastSyncAt) return null
    const date = new Date(lastSyncAt)
    return date.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <>
      <div className="space-y-4">
        {/* Status Banner */}
        {statusInfo.showBanner && (
          <div className={`flex items-start gap-3 rounded-lg border p-3 ${statusInfo.bgColor}`}>
            <StatusIcon className={`h-5 w-5 flex-shrink-0 ${statusInfo.color}`} />
            <div className="flex-1">
              <p className={`text-sm font-medium ${statusInfo.color}`}>
                {statusInfo.text}
              </p>
              <p className="mt-0.5 text-xs text-white/50">
                {statusInfo.subtext}
              </p>
            </div>
          </div>
        )}

        {/* Token Display */}
        <div className="flex items-center gap-3 rounded-lg bg-surface p-4">
          <div className="flex-1">
            <p className="mb-1 text-xs text-white/50">Din aterstallningskod</p>
            <p className={`font-mono text-2xl tracking-wider ${tokenStatus === 'expired' ? 'text-white/40 line-through' : 'text-white'}`}>
              {token}
            </p>
            {/* Expiration info for valid/synced tokens */}
            {tokenStatus === 'valid' && daysRemaining !== null && (
              <div className="mt-1 space-y-0.5">
                <p className="flex items-center gap-1 text-xs text-white/40">
                  <Clock className="h-3 w-3" />
                  Giltig i {daysRemaining} {daysRemaining === 1 ? 'dag' : 'dagar'} - Synka for att forlanga
                </p>
                {lastSyncAt && (
                  <p className="text-xs text-white/30">
                    Senast synkad: {formatLastSync()}
                  </p>
                )}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            title="Kopiera"
            disabled={tokenStatus === 'expired'}
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
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setQrModalOpen(true)}
            disabled={tokenStatus === 'expired'}
          >
            <QrCode className="mr-2 h-4 w-4" />
            Visa QR-kod
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEmailModalOpen(true)}
            disabled={tokenStatus === 'expired'}
          >
            <Mail className="mr-2 h-4 w-4" />
            Skicka via e-post
          </Button>
          <Button
            variant={tokenStatus === 'expired' || tokenStatus === 'expiring' ? 'primary' : 'ghost'}
            size="sm"
            onClick={handleRegenerateToken}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {tokenStatus === 'expired' ? 'Generera ny token' : 'Fornya token'}
          </Button>
        </div>

        {/* Info */}
        <p className="text-xs text-white/40">
          Spara denna kod for att kunna aterstalla din lista om du rensar webblasardata.
          Varje synkning forlangar giltigheten med {TOKEN_EXPIRATION_DAYS} dagar.
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
