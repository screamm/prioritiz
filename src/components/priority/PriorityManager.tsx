import { useState, useMemo, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { usePriorityStore, useTodoStore } from '@/stores'
import { SortablePriorityColumn } from './SortablePriorityColumn'
import { AddPriorityModal } from './AddPriorityModal'
import { EditPriorityModal } from './EditPriorityModal'
import { Button } from '@/components/ui'
import { cn } from '@/utils'
import { LIMITS } from '@/utils/constants'
import type { Priority } from '@/types'

interface PriorityManagerProps {
  className?: string
}

export function PriorityManager({ className }: PriorityManagerProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingPriority, setEditingPriority] = useState<Priority | null>(null)

  const { priorities, addPriority, updatePriority, deletePriority, reorderPriorities, getSortedPriorities } = usePriorityStore()
  const { getTodosByPriority } = useTodoStore()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sortedPriorities = useMemo(() => getSortedPriorities(), [priorities, getSortedPriorities])

  const existingNames = useMemo(
    () => priorities.map((p) => p.name),
    [priorities]
  )

  const canAddMore = priorities.length < LIMITS.MAX_PRIORITIES

  // DnD sensors for priority reordering
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      if (over && active.id !== over.id) {
        const oldIndex = sortedPriorities.findIndex((p) => p.id === active.id)
        const newIndex = sortedPriorities.findIndex((p) => p.id === over.id)

        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(sortedPriorities, oldIndex, newIndex)
          reorderPriorities(newOrder.map((p) => p.id))
        }
      }
    },
    [sortedPriorities, reorderPriorities]
  )

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

  const handleDeletePriority = useCallback(
    (priority: Priority) => {
      // Get todos in this priority
      const todosInPriority = getTodosByPriority(priority.id)

      if (todosInPriority.length > 0) {
        // Confirm deletion if there are todos
        const confirmed = window.confirm(
          `Är du säker på att du vill ta bort "${priority.name}"? ${todosInPriority.length} uppgift(er) kommer flyttas till Inbox.`
        )
        if (!confirmed) {
          return
        }

        // Move todos to inbox
        const { moveTodo } = useTodoStore.getState()
        todosInPriority.forEach((todo, index) => {
          moveTodo(todo.id, null, index)
        })
      } else {
        // Confirm deletion even without todos
        const confirmed = window.confirm(
          `Är du säker på att du vill ta bort "${priority.name}"?`
        )
        if (!confirmed) {
          return
        }
      }

      deletePriority(priority.id)
    },
    [deletePriority, getTodosByPriority]
  )

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Priority columns - vertically stacked with drag & drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
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
      </DndContext>

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
    </div>
  )
}
