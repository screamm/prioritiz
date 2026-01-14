import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pencil, Trash2, X, Check } from 'lucide-react'
import { cn } from '@/utils'

interface TodoActionsProps {
  todoId: string
  isVisible?: boolean
  onEdit: () => void
  onDelete: (id: string) => void
  className?: string
}

export function TodoActions({
  todoId,
  isVisible = false,
  onEdit,
  onDelete,
  className,
}: TodoActionsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleEditClick = useCallback(() => {
    onEdit()
  }, [onEdit])

  const handleDeleteClick = useCallback(() => {
    setShowDeleteConfirm(true)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    onDelete(todoId)
    setShowDeleteConfirm(false)
  }, [onDelete, todoId])

  const handleCancelDelete = useCallback(() => {
    setShowDeleteConfirm(false)
  }, [])

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.15 }}
          className={cn('flex items-center gap-1', className)}
        >
          {showDeleteConfirm ? (
            <>
              <motion.button
                type="button"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={handleConfirmDelete}
                className={cn(
                  'p-1.5 rounded-lg',
                  'bg-red-500/20 text-red-400 hover:bg-red-500/30',
                  'transition-colors duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-red-500/50'
                )}
                aria-label="Confirm delete"
              >
                <Check className="w-4 h-4" />
              </motion.button>
              <motion.button
                type="button"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.05 }}
                onClick={handleCancelDelete}
                className={cn(
                  'p-1.5 rounded-lg',
                  'text-white/50 hover:text-white hover:bg-white/10',
                  'transition-colors duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-white/20'
                )}
                aria-label="Cancel delete"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </>
          ) : (
            <>
              <motion.button
                type="button"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={handleEditClick}
                className={cn(
                  'p-1.5 rounded-lg',
                  'text-white/50 hover:text-white hover:bg-white/10',
                  'transition-colors duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-indigo-500/50'
                )}
                aria-label="Edit todo"
              >
                <Pencil className="w-4 h-4" />
              </motion.button>
              <motion.button
                type="button"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.05 }}
                onClick={handleDeleteClick}
                className={cn(
                  'p-1.5 rounded-lg',
                  'text-white/50 hover:text-red-400 hover:bg-red-500/10',
                  'transition-colors duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-red-500/50'
                )}
                aria-label="Delete todo"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
