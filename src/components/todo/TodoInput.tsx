import { useState, useCallback, useRef, type FormEvent, type KeyboardEvent } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { cn } from '@/utils'
import { LIMITS } from '@/utils/constants'

interface TodoInputProps {
  onAdd: (text: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

export function TodoInput({
  onAdd,
  placeholder = 'Lägg till ny uppgift...',
  className,
  autoFocus = false,
}: TodoInputProps) {
  const [text, setText] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const trimmedText = text.trim()
      if (trimmedText) {
        onAdd(trimmedText)
        setText('')
      }
    },
    [text, onAdd]
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        setText('')
        inputRef.current?.blur()
      }
    },
    []
  )

  const isOverLimit = text.length > LIMITS.TODO_TEXT_MAX

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('relative', className)}
      data-testid="todo-input-form"
    >
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg',
          'bg-surface-glass backdrop-blur-md border transition-all duration-200',
          isFocused
            ? 'border-indigo-500/50 ring-2 ring-indigo-500/20'
            : 'border-border-glass',
          isOverLimit && 'border-red-500/50 ring-2 ring-red-500/20'
        )}
      >
        <motion.button
          type="submit"
          disabled={!text.trim() || isOverLimit}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'flex-shrink-0 p-1.5 rounded-lg transition-all duration-200',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50',
            text.trim() && !isOverLimit
              ? 'text-indigo-400 hover:bg-indigo-500/20'
              : 'text-white/30 cursor-not-allowed'
          )}
          aria-label="Lägg till uppgift"
        >
          <Plus className="w-5 h-5" />
        </motion.button>

        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          maxLength={LIMITS.TODO_TEXT_MAX + 50}
          className={cn(
            'flex-1 bg-transparent text-white placeholder-white/40',
            'outline-none min-w-0'
          )}
          aria-label="Ny uppgift"
          data-testid="todo-input"
        />

        {text.length > 400 && (
          <span
            className={cn(
              'text-xs flex-shrink-0 transition-colors duration-200',
              isOverLimit ? 'text-red-400' : text.length > 450 ? 'text-yellow-400' : 'text-white/40'
            )}
          >
            {text.length}/{LIMITS.TODO_TEXT_MAX}
          </span>
        )}
      </div>

      {isOverLimit && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1.5 text-xs text-red-400"
          role="alert"
        >
          Texten är för lång (max {LIMITS.TODO_TEXT_MAX} tecken)
        </motion.p>
      )}
    </form>
  )
}
