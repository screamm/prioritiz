import { memo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import type { Priority, Todo } from '@/types'
import { TodoList } from '@/components/todo'
import { PriorityHeader } from './PriorityHeader'
import { cn } from '@/utils'

interface PriorityColumnProps {
  priority: Priority
  todos: Todo[]
  isOver?: boolean
  onEditPriority?: (priority: Priority) => void
  onDeletePriority?: (priority: Priority) => void
}

export const PriorityColumn = memo(function PriorityColumn({
  priority,
  todos,
  isOver: externalIsOver,
  onEditPriority,
  onDeletePriority,
}: PriorityColumnProps) {
  const { setNodeRef, isOver: droppableIsOver } = useDroppable({
    id: `priority-${priority.id}`,
  })

  const isOver = externalIsOver ?? droppableIsOver

  return (
    <motion.div
      ref={setNodeRef}
      data-testid={`priority-${priority.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex flex-col min-h-[200px] p-4 rounded-xl',
        'bg-surface-glass backdrop-blur-md border transition-all duration-200',
        isOver
          ? 'border-indigo-500/50 ring-2 ring-indigo-500/20 bg-indigo-500/5'
          : 'border-border-glass'
      )}
      style={{
        borderTopColor: priority.color,
        borderTopWidth: '3px',
      }}
    >
      <PriorityHeader
        priority={priority}
        count={todos.length}
        onEdit={onEditPriority}
        onDelete={onDeletePriority}
      />

      <div className="flex-1 overflow-y-auto">
        <TodoList
          todos={todos}
          emptyMessage="Dra uppgifter hit"
        />
      </div>
    </motion.div>
  )
})
