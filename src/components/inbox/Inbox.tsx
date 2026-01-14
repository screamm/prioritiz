import { useMemo, useCallback } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { AnimatePresence, motion } from 'framer-motion'
import { Inbox as InboxIcon } from 'lucide-react'
import { useTodoStore } from '@/stores'
import { TodoInput } from '@/components/todo'
import { InboxItem } from './InboxItem'
import { cn } from '@/utils'

interface InboxProps {
  className?: string
}

export function Inbox({ className }: InboxProps) {
  const { todos, addTodo, toggleTodo, deleteTodo, getInboxTodos } = useTodoStore()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const inboxTodos = useMemo(() => getInboxTodos(), [todos, getInboxTodos])
  const todoIds = useMemo(() => inboxTodos.map((t) => t.id), [inboxTodos])

  const { setNodeRef, isOver } = useDroppable({
    id: 'inbox',
  })

  const handleAddTodo = useCallback(
    (text: string) => {
      addTodo(text)
    },
    [addTodo]
  )

  const handleToggle = useCallback(
    (id: string) => {
      toggleTodo(id)
    },
    [toggleTodo]
  )

  const handleDelete = useCallback(
    (id: string) => {
      deleteTodo(id)
    },
    [deleteTodo]
  )

  return (
    <motion.aside
      ref={setNodeRef}
      data-testid="inbox"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex flex-col h-full w-80 p-4 rounded-xl',
        'bg-surface-glass backdrop-blur-md border transition-all duration-200',
        isOver
          ? 'border-indigo-500/50 ring-2 ring-indigo-500/20 bg-indigo-500/5'
          : 'border-border-glass',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border-glass">
        <div className="p-2 rounded-lg bg-indigo-500/20">
          <InboxIcon className="w-5 h-5 text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-white">Inbox</h2>
          <p className="text-xs text-white/50">
            {inboxTodos.length} uppgift{inboxTodos.length !== 1 ? 'er' : ''}
          </p>
        </div>
      </div>

      {/* Todo input */}
      <TodoInput
        onAdd={handleAddTodo}
        placeholder="Ny uppgift..."
        className="mb-4"
      />

      {/* Todo list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <SortableContext items={todoIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1.5" role="list" aria-label="Inbox uppgifter">
            <AnimatePresence mode="popLayout">
              {inboxTodos.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-8 text-center"
                >
                  <InboxIcon className="w-12 h-12 text-white/20 mb-3" />
                  <p className="text-sm text-white/40">
                    Inga uppgifter i inbox
                  </p>
                  <p className="text-xs text-white/30 mt-1">
                    Lägg till nya uppgifter ovan
                  </p>
                </motion.div>
              ) : (
                inboxTodos.map((todo) => (
                  <InboxItem
                    key={todo.id}
                    todo={todo}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </SortableContext>
      </div>

      {/* Drop hint when dragging over */}
      <AnimatePresence>
        {isOver && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-4 p-3 rounded-lg border-2 border-dashed border-indigo-500/50 bg-indigo-500/10"
          >
            <p className="text-sm text-indigo-300 text-center">
              Släpp för att flytta till Inbox
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  )
}
