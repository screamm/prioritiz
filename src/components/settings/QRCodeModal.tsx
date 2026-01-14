import { QRCodeSVG } from 'qrcode.react'
import { Download } from 'lucide-react'
import { Modal, Button } from '@/components/ui'

interface QRCodeModalProps {
  isOpen: boolean
  onClose: () => void
  token: string
}

export function QRCodeModal({ isOpen, onClose, token }: QRCodeModalProps) {
  const restoreUrl = `${window.location.origin}/restore/${token}`

  const handleDownload = () => {
    const svg = document.getElementById('qr-code-svg')
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx?.drawImage(img, 0, 0)
        const pngFile = canvas.toDataURL('image/png')
        const downloadLink = document.createElement('a')
        downloadLink.download = `prioritiz-token-${token}.png`
        downloadLink.href = pngFile
        downloadLink.click()
      }
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="QR-kod för återställning">
      <div className="flex flex-col items-center space-y-6">
        {/* QR Code */}
        <div className="rounded-2xl bg-white p-6">
          <QRCodeSVG
            id="qr-code-svg"
            value={restoreUrl}
            size={200}
            level="H"
            includeMargin={false}
          />
        </div>

        {/* Token Display */}
        <div className="text-center">
          <p className="mb-1 text-sm text-white/50">Din återställningskod</p>
          <p className="font-mono text-3xl tracking-widest text-white">{token}</p>
        </div>

        {/* Instructions */}
        <p className="text-center text-sm text-white/60">
          Skanna QR-koden med din telefon för att öppna återställningslänken,
          eller ange koden manuellt.
        </p>

        {/* Download Button */}
        <Button variant="secondary" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Ladda ner QR-kod
        </Button>
      </div>
    </Modal>
  )
}
