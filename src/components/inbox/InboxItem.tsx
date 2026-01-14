import { memo, forwardRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import { GripVertical, Check, Trash2 } from 'lucide-react'
import type { Todo } from '@/types'
import { cn } from '@/utils'

interface InboxItemProps {
  todo: Todo
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export const InboxItem = memo(
  forwardRef<HTMLDivElement, InboxItemProps>(function InboxItem(
    { todo, onToggle, onDelete },
    ref
  ) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: todo.id })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    }

    const combinedRef = (node: HTMLDivElement | null) => {
      setNodeRef(node)
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    }

    return (
      <motion.div
        ref={combinedRef}
      style={style}
      data-testid="inbox-item"
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{
        opacity: isDragging ? 0.5 : 1,
        x: 0,
        scale: isDragging ? 1.02 : 1,
      }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      className={cn(
        'group flex items-center gap-2 p-2.5 rounded-lg',
        'bg-white/5 border border-transparent',
        'hover:bg-white/10 hover:border-border-glass',
        'transition-all duration-200',
        isDragging && 'shadow-glow z-50',
        todo.completed && 'opacity-60'
      )}
    >
      {/* Drag Handle */}
      <button
        type="button"
        className={cn(
          'flex-shrink-0 p-0.5 rounded cursor-grab active:cursor-grabbing',
          'text-white/20 hover:text-white/50 transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50'
        )}
        {...attributes}
        {...listeners}
        aria-label="Dra för att flytta"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>

      {/* Checkbox */}
      <button
        type="button"
        onClick={() => onToggle(todo.id)}
        className={cn(
          'flex-shrink-0 w-4 h-4 rounded-full border-2 transition-all duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50',
          todo.completed
            ? 'bg-indigo-500 border-indigo-500'
            : 'border-white/30 hover:border-indigo-400'
        )}
        aria-label={todo.completed ? 'Markera som ofullständig' : 'Markera som klar'}
        aria-pressed={todo.completed}
      >
        {todo.completed && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center justify-center w-full h-full"
          >
            <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
          </motion.div>
        )}
      </button>

      {/* Text */}
      <span
        className={cn(
          'flex-1 min-w-0 truncate text-sm text-white/90',
          todo.completed && 'line-through text-white/50'
        )}
        title={todo.text}
      >
        {todo.text}
      </span>

      {/* Delete button */}
      <button
        type="button"
        onClick={() => onDelete(todo.id)}
        className={cn(
          'flex-shrink-0 p-1 rounded opacity-0 group-hover:opacity-100',
          'text-white/40 hover:text-red-400 hover:bg-red-500/10',
          'transition-all duration-200',
          'focus:outline-none focus:opacity-100 focus-visible:ring-2 focus-visible:ring-red-500/50'
        )}
        aria-label="Ta bort uppgift"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  )
  })
)
