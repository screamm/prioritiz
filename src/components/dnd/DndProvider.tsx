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
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useTodoStore } from '@/stores'
import type { Todo } from '@/types'
import { TodoItem } from '@/components/todo'

interface DndProviderProps {
  children: ReactNode
}

export function DndProvider({ children }: DndProviderProps) {
  const [activeItem, setActiveItem] = useState<Todo | null>(null)
  const { todos, moveTodo } = useTodoStore()

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
      const todo = todos.find((t) => t.id === active.id)
      if (todo) {
        setActiveItem(todo)
      }
    },
    [todos]
  )

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Visual feedback handled by components
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveItem(null)

      if (!over) return

      const activeId = active.id as string
      const overId = over.id as string

      // Find the active todo
      const activeTodo = todos.find((t) => t.id === activeId)
      if (!activeTodo) return

      // Determine target priority
      let targetPriorityId: string | null = null
      let targetOrder = 0

      // Check if dropped on a priority column
      if (overId === 'inbox') {
        targetPriorityId = null
      } else if (overId.startsWith('priority-')) {
        targetPriorityId = overId.replace('priority-', '')
      } else {
        // Dropped on another todo - get its priority
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

      if (overId === 'inbox' || overId.startsWith('priority-')) {
        // Dropped on column - add to end
        targetOrder = todosInTarget.length
      }

      // Move the todo
      if (activeTodo.priorityId !== targetPriorityId || activeTodo.order !== targetOrder) {
        moveTodo(activeId, targetPriorityId, targetOrder)
      }
    },
    [todos, moveTodo]
  )

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
          <div className="opacity-80">
            <TodoItem
              todo={activeItem}
              onToggle={() => {}}
              onDelete={() => {}}
              onEdit={() => {}}
              isDragging
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
