import { useState, useCallback, type ReactNode } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useTodoStore, usePriorityStore } from '@/stores'
import type { Todo, Priority } from '@/types'
import { TodoItem } from '@/components/todo'
import { GripVertical } from 'lucide-react'
import { cn } from '@/utils'

interface DndProviderProps {
  children: ReactNode
}

type DragType = 'todo' | 'priority' | null

export function DndProvider({ children }: DndProviderProps) {
  const [activeItem, setActiveItem] = useState<Todo | Priority | null>(null)
  const [dragType, setDragType] = useState<DragType>(null)

  const { todos, moveTodo } = useTodoStore()
  const { priorities, reorderPriorities, getSortedPriorities } = usePriorityStore()

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

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event
      const activeId = active.id as string

      // Check if it's a todo
      const todo = todos.find((t) => t.id === activeId)
      if (todo) {
        setActiveItem(todo)
        setDragType('todo')
        return
      }

      // Check if it's a priority
      const priority = priorities.find((p) => p.id === activeId)
      if (priority) {
        setActiveItem(priority)
        setDragType('priority')
        return
      }
    },
    [todos, priorities]
  )

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Visual feedback handled by components
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      const currentDragType = dragType

      // Reset state
      setActiveItem(null)
      setDragType(null)

      if (!over) return

      const activeId = active.id as string
      const overId = over.id as string

      // Handle priority reordering
      if (currentDragType === 'priority') {
        if (activeId !== overId) {
          const sortedPriorities = getSortedPriorities()
          const oldIndex = sortedPriorities.findIndex((p) => p.id === activeId)
          const newIndex = sortedPriorities.findIndex((p) => p.id === overId)

          if (oldIndex !== -1 && newIndex !== -1) {
            const newOrder = arrayMove(sortedPriorities, oldIndex, newIndex)
            reorderPriorities(newOrder.map((p) => p.id))
          }
        }
        return
      }

      // Handle todo movement
      if (currentDragType === 'todo') {
        const activeTodo = todos.find((t) => t.id === activeId)
        if (!activeTodo) return

        // Determine target priority
        let targetPriorityId: string | null = null
        let targetOrder = 0

        // Check if dropped on inbox
        if (overId === 'inbox') {
          targetPriorityId = null
        }
        // Check if dropped on a priority column droppable (priority-{id})
        else if (overId.startsWith('priority-')) {
          targetPriorityId = overId.replace('priority-', '')
        }
        // Check if dropped directly on a priority column sortable (just the id)
        else if (priorities.some((p) => p.id === overId)) {
          targetPriorityId = overId
        }
        // Dropped on another todo - get its priority
        else {
          const overTodo = todos.find((t) => t.id === overId)
          if (overTodo) {
            targetPriorityId = overTodo.priorityId
            targetOrder = overTodo.order
          }
        }

        // Calculate target order
        const todosInTarget = todos
          .filter((t) => t.priorityId === targetPriorityId && t.id !== activeId)
          .sort((a, b) => a.order - b.order)

        // Set target order if dropped on column (not on another todo)
        if (overId === 'inbox' || overId.startsWith('priority-') || priorities.some((p) => p.id === overId)) {
          // Dropped on column - add to end
          targetOrder = todosInTarget.length
        }

        // Move the todo
        if (activeTodo.priorityId !== targetPriorityId || activeTodo.order !== targetOrder) {
          moveTodo(activeId, targetPriorityId, targetOrder)
        }
      }
    },
    [todos, moveTodo, dragType, getSortedPriorities, reorderPriorities, priorities]
  )

  // Type guard for Todo
  const isTodo = (item: Todo | Priority): item is Todo => {
    return 'text' in item && 'completed' in item
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          dragType === 'todo' && isTodo(activeItem) ? (
            <div className="opacity-80">
              <TodoItem
                todo={activeItem}
                onToggle={() => {}}
                onDelete={() => {}}
                onEdit={() => {}}
                isDragging
              />
            </div>
          ) : dragType === 'priority' && !isTodo(activeItem) ? (
            <div className="opacity-80">
              <div
                className={cn(
                  'flex items-center gap-2 p-3 rounded-xl',
                  'bg-surface-glass backdrop-blur-md border border-border-glass',
                  'ring-2 ring-indigo-500/30'
                )}
                style={{
                  borderTopColor: activeItem.color,
                  borderTopWidth: '3px',
                }}
              >
                <GripVertical className="w-4 h-4 text-white/50" />
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: activeItem.color }}
                />
                <span className="font-semibold text-white">{activeItem.name}</span>
              </div>
            </div>
          ) : null
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
