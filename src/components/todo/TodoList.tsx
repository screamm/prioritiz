import { useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Todo } from '@/types'
import { useTodoStore } from '@/stores'
import { TodoItem } from './TodoItem'
import { cn } from '@/utils'

interface TodoListProps {
  todos: Todo[]
  className?: string
  emptyMessage?: string
}

export function TodoList({
  todos,
  className,
  emptyMessage = 'Inga uppgifter',
}: TodoListProps) {
  const { toggleTodo, deleteTodo, updateTodo } = useTodoStore()

  const sortedTodos = useMemo(
    () => [...todos].sort((a, b) => a.order - b.order),
    [todos]
  )

  const todoIds = useMemo(() => sortedTodos.map((t) => t.id), [sortedTodos])

  const handleToggle = (id: string) => {
    toggleTodo(id)
  }

  const handleDelete = (id: string) => {
    deleteTodo(id)
  }

  const handleEdit = (id: string, text: string) => {
    updateTodo(id, { text })
  }

  if (sortedTodos.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center py-8 text-white/40 text-sm',
          className
        )}
        data-testid="todo-list-empty"
      >
        {emptyMessage}
      </div>
    )
  }

  return (
    <SortableContext items={todoIds} strategy={verticalListSortingStrategy}>
      <div
        className={cn('flex flex-col gap-2', className)}
        data-testid="todo-list"
        role="list"
        aria-label="Todo lista"
      >
        <AnimatePresence mode="popLayout">
          {sortedTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </AnimatePresence>
      </div>
    </SortableContext>
  )
}
