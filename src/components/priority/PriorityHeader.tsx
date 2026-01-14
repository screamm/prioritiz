import { memo } from 'react'
import { motion } from 'framer-motion'
import { Settings, Trash2 } from 'lucide-react'
import type { Priority } from '@/types'
import { cn } from '@/utils'

interface PriorityHeaderProps {
  priority: Priority
  count: number
  onEdit?: (priority: Priority) => void
  onDelete?: (priority: Priority) => void
}

export const PriorityHeader = memo(function PriorityHeader({
  priority,
  count,
  onEdit,
  onDelete,
}: PriorityHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3 min-w-0">
        {/* Color indicator */}
        <div
          className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white/10"
          style={{ backgroundColor: priority.color }}
          aria-hidden="true"
        />

        {/* Priority name */}
        <h3
          className="text-base font-semibold text-white truncate"
          title={priority.name}
        >
          {priority.name}
        </h3>

        {/* Count badge */}
        <motion.span
          key={count}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            'px-2 py-0.5 rounded-full text-xs font-medium',
            'bg-white/10 text-white/70'
          )}
        >
          {count}
        </motion.span>
      </div>

      {/* Actions - available for all priorities */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(priority)}
            className={cn(
              'p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10',
              'transition-colors duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50'
            )}
            aria-label={`Redigera ${priority.name}`}
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(priority)}
            className={cn(
              'p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10',
              'transition-colors duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50'
            )}
            aria-label={`Ta bort ${priority.name}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
})
