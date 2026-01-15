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

/**
 * Result of parsing an overId from dnd-kit
 */
interface ParsedDropTarget {
  type: 'inbox' | 'priority-column' | 'todo' | 'unknown'
  priorityId: string | null
  todoId: string | null
}

/**
 * Parse overId and determine target type and IDs
 * Handles the various ID formats:
 * - 'inbox' -> inbox column
 * - 'priority-{id}' -> priority column droppable
 * - raw '{id}' matching a priority -> priority column sortable
 * - todo id -> another todo item
 */
function parseDropTarget(
  overId: string,
  todos: Todo[],
  priorities: Priority[]
): ParsedDropTarget {
  // Check if dropped on inbox
  if (overId === 'inbox') {
    return {
      type: 'inbox',
      priorityId: null,
      todoId: null,
    }
  }

  // Check if dropped on a priority column droppable (format: priority-{id})
  if (overId.startsWith('priority-')) {
    const priorityId = overId.replace('priority-', '')
    // Validate that this priority exists
    const priorityExists = priorities.some((p) => p.id === priorityId)
    if (priorityExists) {
      return {
        type: 'priority-column',
        priorityId,
        todoId: null,
      }
    }
  }

  // Check if dropped directly on a priority column sortable (just the id)
  const matchingPriority = priorities.find((p) => p.id === overId)
  if (matchingPriority) {
    return {
      type: 'priority-column',
      priorityId: matchingPriority.id,
      todoId: null,
    }
  }

  // Check if dropped on another todo
  const overTodo = todos.find((t) => t.id === overId)
  if (overTodo) {
    return {
      type: 'todo',
      priorityId: overTodo.priorityId,
      todoId: overTodo.id,
    }
  }

  // Unknown target
  return {
    type: 'unknown',
    priorityId: null,
    todoId: null,
  }
}

/**
 * Calculate the target order for a todo being moved
 */
function calculateTargetOrder(
  dropTarget: ParsedDropTarget,
  activeId: string,
  todos: Todo[]
): number {
  // Get todos in the target priority (excluding the one being dragged)
  const todosInTarget = todos
    .filter((t) => t.priorityId === dropTarget.priorityId && t.id !== activeId)
    .sort((a, b) => a.order - b.order)

  // If dropped on a column (inbox or priority), add to end
  if (dropTarget.type === 'inbox' || dropTarget.type === 'priority-column') {
    return todosInTarget.length
  }

  // If dropped on another todo, insert BEFORE that todo
  if (dropTarget.type === 'todo' && dropTarget.todoId) {
    const overTodoIndex = todosInTarget.findIndex((t) => t.id === dropTarget.todoId)
    if (overTodoIndex !== -1) {
      return overTodoIndex
    }
    // Fallback to end if todo not found
    return todosInTarget.length
  }

  // Default to end
  return todosInTarget.length
}

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

        // Parse the drop target to determine where we're dropping
        const dropTarget = parseDropTarget(overId, todos, priorities)

        // Bail out if we couldn't determine a valid target
        if (dropTarget.type === 'unknown') {
          console.warn('DndProvider: Unknown drop target:', overId)
          return
        }

        // Validate that targetPriorityId exists (if not null/inbox)
        if (dropTarget.priorityId !== null) {
          const priorityExists = priorities.some((p) => p.id === dropTarget.priorityId)
          if (!priorityExists) {
            console.warn('DndProvider: Target priority does not exist:', dropTarget.priorityId)
            return
          }
        }

        // Calculate the target order
        const targetOrder = calculateTargetOrder(dropTarget, activeId, todos)

        // Only move if something actually changed
        if (activeTodo.priorityId !== dropTarget.priorityId || activeTodo.order !== targetOrder) {
          try {
            moveTodo(activeId, dropTarget.priorityId, targetOrder)
          } catch (error) {
            console.error('DndProvider: Failed to move todo:', error)
          }
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
