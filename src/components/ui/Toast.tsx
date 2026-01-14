import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { useToastStore } from '@/stores'
import { cn } from '@/utils'
import type { ToastMessage } from '@/types'

type ToastType = ToastMessage['type']

const toastIcons: Record<ToastType, React.ElementType> = {
  success: Check,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
}

const toastStyles: Record<ToastType, string> = {
  success: 'border-green-500/30 bg-green-500/10',
  error: 'border-red-500/30 bg-red-500/10',
  info: 'border-blue-500/30 bg-blue-500/10',
  warning: 'border-yellow-500/30 bg-yellow-500/10',
}

const toastIconStyles: Record<ToastType, string> = {
  success: 'text-green-400',
  error: 'text-red-400',
  info: 'text-blue-400',
  warning: 'text-yellow-400',
}

const toastVariants = {
  initial: {
    opacity: 0,
    x: 100,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    x: 100,
    scale: 0.9,
    transition: {
      duration: 0.2,
    },
  },
}

interface ToastItemProps {
  toast: ToastMessage
  onDismiss: (id: string) => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const Icon = toastIcons[toast.type]

  return (
    <motion.div
      layout
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      role="alert"
      aria-live="polite"
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg',
        'glass border backdrop-blur-md',
        'shadow-lg min-w-[300px] max-w-[400px]',
        toastStyles[toast.type]
      )}
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', toastIconStyles[toast.type])} />
      <p className="flex-1 text-sm text-white/90">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

export interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export function ToastContainer({ position = 'bottom-right' }: ToastContainerProps) {
  const { toasts, removeToast } = useToastStore()

  const positionClasses: Record<typeof position, string> = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  }

  const isTop = position.startsWith('top')

  return (
    <div
      className={cn(
        'fixed z-[100] flex flex-col gap-3 pointer-events-none',
        positionClasses[position]
      )}
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {(isTop ? [...toasts].reverse() : toasts).map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onDismiss={removeToast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default ToastContainer
