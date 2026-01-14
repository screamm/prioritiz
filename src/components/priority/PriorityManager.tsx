import { useState, useMemo, useCallback } from 'react'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { usePriorityStore, useTodoStore } from '@/stores'
import { SortablePriorityColumn } from './SortablePriorityColumn'
import { AddPriorityModal } from './AddPriorityModal'
import { EditPriorityModal } from './EditPriorityModal'
import { Button, ConfirmModal } from '@/components/ui'
import { cn } from '@/utils'
import { LIMITS } from '@/utils/constants'
import type { Priority } from '@/types'

interface PriorityManagerProps {
  className?: string
}

export function PriorityManager({ className }: PriorityManagerProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingPriority, setEditingPriority] = useState<Priority | null>(null)
  const [deletingPriority, setDeletingPriority] = useState<Priority | null>(null)

  const { priorities, addPriority, updatePriority, deletePriority, getSortedPriorities } = usePriorityStore()
  const { getTodosByPriority } = useTodoStore()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sortedPriorities = useMemo(() => getSortedPriorities(), [priorities, getSortedPriorities])

  const existingNames = useMemo(
    () => priorities.map((p) => p.name),
    [priorities]
  )

  const canAddMore = priorities.length < LIMITS.MAX_PRIORITIES

  const handleAddPriority = useCallback(
    (name: string, color: string) => {
      addPriority(name, color)
    },
    [addPriority]
  )

  const handleEditPriority = useCallback((priority: Priority) => {
    setEditingPriority(priority)
  }, [])

  const handleSavePriority = useCallback(
    (id: string, name: string, color: string) => {
      updatePriority(id, { name, color })
    },
    [updatePriority]
  )

  const handleDeletePriority = useCallback((priority: Priority) => {
    setDeletingPriority(priority)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (!deletingPriority) return

    // Get todos in this priority
    const todosInPriority = getTodosByPriority(deletingPriority.id)

    if (todosInPriority.length > 0) {
      // Move todos to inbox
      const { moveTodo } = useTodoStore.getState()
      todosInPriority.forEach((todo, index) => {
        moveTodo(todo.id, null, index)
      })
    }

    deletePriority(deletingPriority.id)
    setDeletingPriority(null)
  }, [deletingPriority, deletePriority, getTodosByPriority])

  // Calculate message for delete modal
  const deleteModalMessage = useMemo(() => {
    if (!deletingPriority) return ''
    const todosInPriority = getTodosByPriority(deletingPriority.id)
    if (todosInPriority.length > 0) {
      return `Är du säker på att du vill ta bort "${deletingPriority.name}"? ${todosInPriority.length} uppgift(er) kommer flyttas till Inbox.`
    }
    return `Är du säker på att du vill ta bort "${deletingPriority.name}"?`
  }, [deletingPriority, getTodosByPriority])

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Priority columns - vertically stacked with drag & drop */}
      {/* SortableContext for priority reordering - DndContext is in DndProvider */}
      <SortableContext
        items={sortedPriorities.map((p) => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-4">
          {sortedPriorities.map((priority, index) => (
            <motion.div
              key={priority.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <SortablePriorityColumn
                priority={priority}
                todos={getTodosByPriority(priority.id)}
                onEditPriority={handleEditPriority}
                onDeletePriority={handleDeletePriority}
              />
            </motion.div>
          ))}
        </div>
      </SortableContext>

      {/* Add priority button */}
      {canAddMore && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            variant="ghost"
            onClick={() => setIsAddModalOpen(true)}
            icon={<Plus className="w-5 h-5" />}
            className="w-full justify-center border border-dashed border-border-glass hover:border-indigo-500/50"
          >
            Lägg till prioritering
          </Button>
        </motion.div>
      )}

      {!canAddMore && (
        <p className="text-center text-sm text-white/40">
          Max antal prioriteringar ({LIMITS.MAX_PRIORITIES}) uppnått
        </p>
      )}

      {/* Add priority modal */}
      <AddPriorityModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddPriority}
        existingNames={existingNames}
      />

      {/* Edit priority modal */}
      <EditPriorityModal
        isOpen={editingPriority !== null}
        onClose={() => setEditingPriority(null)}
        onSave={handleSavePriority}
        priority={editingPriority}
        existingNames={existingNames}
      />

      {/* Delete priority confirmation modal */}
      <ConfirmModal
        isOpen={deletingPriority !== null}
        onClose={() => setDeletingPriority(null)}
        onConfirm={handleConfirmDelete}
        title="Ta bort kategori?"
        message={deleteModalMessage}
        confirmText="Ta bort"
        cancelText="Avbryt"
        variant="danger"
      />
    </div>
  )
}
