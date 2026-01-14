import { useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { cn } from '@/utils'
import { Button } from './Button'

export interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning'
  isLoading?: boolean
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: {
      duration: 0.15,
    },
  },
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Ta bort',
  cancelText = 'Avbryt',
  variant = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  const handleEscapeKey = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) {
        onClose()
      }
    },
    [onClose, isLoading]
  )

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget && !isLoading) {
        onClose()
      }
    },
    [onClose, isLoading]
  )

  const handleConfirm = useCallback(() => {
    onConfirm()
  }, [onConfirm])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey)
      document.body.style.overflow = 'hidden'
      // Focus the cancel button for safety (user must actively choose delete)
      setTimeout(() => {
        confirmButtonRef.current?.focus()
      }, 100)
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleEscapeKey])

  const Icon = variant === 'danger' ? Trash2 : AlertTriangle
  const iconBgColor = variant === 'danger' ? 'bg-red-500/20' : 'bg-amber-500/20'
  const iconColor = variant === 'danger' ? 'text-red-400' : 'text-amber-400'

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            variants={backdropVariants}
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Modal Content */}
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            aria-describedby="confirm-modal-message"
            variants={modalVariants}
            className={cn(
              'relative w-full max-w-sm',
              'bg-surface-glass backdrop-blur-xl rounded-2xl shadow-2xl',
              'border border-border-glass overflow-hidden'
            )}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className={cn(
                'absolute top-3 right-3 p-1.5 rounded-lg z-10',
                'text-white/40 hover:text-white hover:bg-white/10',
                'transition-colors duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
                isLoading && 'opacity-50 cursor-not-allowed'
              )}
              aria-label="Stäng"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="p-6 pt-8 flex flex-col items-center text-center">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                className={cn(
                  'w-14 h-14 rounded-full flex items-center justify-center mb-4',
                  iconBgColor
                )}
              >
                <Icon className={cn('w-7 h-7', iconColor)} />
              </motion.div>

              {/* Title */}
              <h3
                id="confirm-modal-title"
                className="text-lg font-semibold text-white mb-2"
              >
                {title}
              </h3>

              {/* Message */}
              <p
                id="confirm-modal-message"
                className="text-sm text-white/60 leading-relaxed"
              >
                {message}
              </p>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1"
              >
                {cancelText}
              </Button>
              <Button
                ref={confirmButtonRef}
                variant="danger"
                onClick={handleConfirm}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Tar bort...' : confirmText}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ConfirmModal
