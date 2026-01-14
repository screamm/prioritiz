import { useState, useCallback, useRef, useEffect, forwardRef } from 'react'
import { motion } from 'framer-motion'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Check, Trash2, GripVertical, Pencil } from 'lucide-react'
import type { Todo } from '@/types'
import { cn } from '@/utils'

interface TodoItemProps {
  todo: Todo
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, text: string) => void
  isDragging?: boolean
}

export const TodoItem = forwardRef<HTMLDivElement, TodoItemProps>(
  function TodoItem(
    { todo, onToggle, onDelete, onEdit, isDragging: externalDragging },
    ref
  ) {
    const [isEditing, setIsEditing] = useState(false)
    const [editText, setEditText] = useState(todo.text)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging: sortableDragging,
    } = useSortable({ id: todo.id })

    const isDragging = externalDragging || sortableDragging

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

    useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus()
        inputRef.current.select()
      }
    }, [isEditing])

    const handleToggle = useCallback(() => {
      onToggle(todo.id)
    }, [onToggle, todo.id])

    const handleStartEdit = useCallback(() => {
      setIsEditing(true)
      setEditText(todo.text)
    }, [todo.text])

    const handleSaveEdit = useCallback(() => {
      const trimmedText = editText.trim()
      if (trimmedText && trimmedText !== todo.text) {
        onEdit(todo.id, trimmedText)
      } else {
        setEditText(todo.text)
      }
      setIsEditing(false)
    }, [editText, onEdit, todo.id, todo.text])

    const handleCancelEdit = useCallback(() => {
      setEditText(todo.text)
      setIsEditing(false)
    }, [todo.text])

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
          handleSaveEdit()
        } else if (e.key === 'Escape') {
          handleCancelEdit()
        }
      },
      [handleSaveEdit, handleCancelEdit]
    )

    const handleDeleteClick = useCallback(() => {
      if (showDeleteConfirm) {
        onDelete(todo.id)
        setShowDeleteConfirm(false)
      } else {
        setShowDeleteConfirm(true)
        setTimeout(() => setShowDeleteConfirm(false), 3000)
      }
    }, [onDelete, todo.id, showDeleteConfirm])

    return (
      <motion.div
        ref={combinedRef}
        style={style}
        data-testid="todo-item"
        layout
        initial={{ opacity: 0, y: -10 }}
        animate={{
          opacity: isDragging ? 0.5 : 1,
          y: 0,
          scale: isDragging ? 1.02 : 1,
        }}
        exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
        transition={{ duration: 0.2 }}
        className={cn(
          'group flex items-center gap-3 p-3 rounded-lg',
          'bg-surface-glass backdrop-blur-md border border-border-glass',
          'transition-all duration-200',
          isDragging && 'shadow-glow-lg z-50',
          todo.completed && 'opacity-60'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false)
          setShowDeleteConfirm(false)
        }}
      >
        {/* Drag Handle */}
        <button
          type="button"
          className={cn(
            'flex-shrink-0 p-1 rounded cursor-grab active:cursor-grabbing',
            'text-white/30 hover:text-white/60 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500/50'
          )}
          {...attributes}
          {...listeners}
          aria-label="Dra för att ändra ordning"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Checkbox */}
        <button
          type="button"
          onClick={handleToggle}
          className={cn(
            'flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-transparent',
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
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="flex items-center justify-center w-full h-full"
            >
              <Check className="w-3 h-3 text-white" strokeWidth={3} />
            </motion.div>
          )}
        </button>

        {/* Text / Edit Input */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSaveEdit}
              className={cn(
                'w-full bg-surface border border-border-glass rounded px-2 py-1',
                'text-white placeholder-white/40 outline-none',
                'focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20'
              )}
              aria-label="Redigera uppgiftstext"
            />
          ) : (
            <span
              className={cn(
                'block truncate text-white transition-all duration-200',
                todo.completed && 'line-through text-white/50'
              )}
            >
              {todo.text}
            </span>
          )}
        </div>

        {/* Actions */}
        <div
          className={cn(
            'flex items-center gap-1 transition-opacity duration-200',
            isHovered || isEditing ? 'opacity-100' : 'opacity-0'
          )}
        >
          {!isEditing && (
            <>
              <button
                type="button"
                onClick={handleStartEdit}
                className={cn(
                  'p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10',
                  'transition-colors duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-indigo-500/50'
                )}
                aria-label="Redigera uppgift"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleDeleteClick}
                className={cn(
                  'p-1.5 rounded-lg transition-colors duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-red-500/50',
                  showDeleteConfirm
                    ? 'text-red-400 bg-red-500/20 hover:bg-red-500/30'
                    : 'text-white/50 hover:text-red-400 hover:bg-red-500/10'
                )}
                aria-label={showDeleteConfirm ? 'Bekräfta borttagning' : 'Ta bort uppgift'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </motion.div>
    )
  }
)
