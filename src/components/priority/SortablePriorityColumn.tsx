import { memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDroppable } from '@dnd-kit/core'
import { GripVertical, Settings, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Priority, Todo } from '@/types'
import { TodoList } from '@/components/todo'
import { cn } from '@/utils'

interface SortablePriorityColumnProps {
  priority: Priority
  todos: Todo[]
  onEditPriority?: (priority: Priority) => void
  onDeletePriority?: (priority: Priority) => void
}

export const SortablePriorityColumn = memo(function SortablePriorityColumn({
  priority,
  todos,
  onEditPriority,
  onDeletePriority,
}: SortablePriorityColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: priority.id })

  // Separate droppable for todos
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `priority-${priority.id}`,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setSortableRef}
      style={style}
      className={cn(
        isDragging && 'opacity-50 z-50'
      )}
    >
      <motion.div
        ref={setDroppableRef}
        data-testid={`priority-${priority.id}`}
        className={cn(
          'flex flex-col min-h-[200px] p-4 rounded-xl',
          'bg-surface-glass backdrop-blur-md border transition-all duration-200',
          isOver
            ? 'border-indigo-500/50 ring-2 ring-indigo-500/20 bg-indigo-500/5'
            : 'border-border-glass',
          isDragging && 'ring-2 ring-white/30'
        )}
        style={{
          borderTopColor: priority.color,
          borderTopWidth: '3px',
        }}
      >
        {/* Header with drag handle */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {/* Drag handle */}
            <button
              type="button"
              className={cn(
                'p-1 rounded cursor-grab active:cursor-grabbing',
                'text-white/30 hover:text-white/60 hover:bg-white/10',
                'transition-colors duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50'
              )}
              aria-label="Dra för att ändra ordning"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-4 h-4" />
            </button>

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
              key={todos.length}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                'bg-white/10 text-white/70'
              )}
            >
              {todos.length}
            </motion.span>
          </div>

          {/* Actions - available for all priorities */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {onEditPriority && (
              <button
                type="button"
                onClick={() => onEditPriority(priority)}
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
            {onDeletePriority && (
              <button
                type="button"
                onClick={() => onDeletePriority(priority)}
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

        {/* Todo list */}
        <div className="flex-1 overflow-y-auto">
          <TodoList
            todos={todos}
            emptyMessage="Dra uppgifter hit"
          />
        </div>
      </motion.div>
    </div>
  )
})
