import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Modal, Button, Input } from '@/components/ui'
import { cn } from '@/utils'
import { LIMITS } from '@/utils/constants'
import type { Priority } from '@/types'

const PRESET_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#f43f5e', // Rose
]

interface EditPriorityModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (id: string, name: string, color: string) => void
  priority: Priority | null
  existingNames?: string[]
}

export function EditPriorityModal({
  isOpen,
  onClose,
  onSave,
  priority,
  existingNames = [],
}: EditPriorityModalProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#ef4444')
  const [customColor, setCustomColor] = useState('')
  const [useCustomColor, setUseCustomColor] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize form when modal opens with priority data
  useEffect(() => {
    if (isOpen && priority) {
      setName(priority.name)
      setColor(priority.color)
      // Check if color is a preset
      if (!PRESET_COLORS.includes(priority.color)) {
        setCustomColor(priority.color)
        setUseCustomColor(true)
      } else {
        setCustomColor('')
        setUseCustomColor(false)
      }
      setError(null)
    }
  }, [isOpen, priority])

  const validateName = useCallback(
    (value: string): string | null => {
      const trimmed = value.trim()
      if (!trimmed) {
        return 'Namn krävs'
      }
      if (trimmed.length > LIMITS.PRIORITY_NAME_MAX) {
        return `Max ${LIMITS.PRIORITY_NAME_MAX} tecken`
      }
      // Only check for duplicates if name changed
      if (priority && trimmed.toLowerCase() !== priority.name.toLowerCase()) {
        if (existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
          return 'En prioritering med detta namn finns redan'
        }
      }
      return null
    },
    [existingNames, priority]
  )

  const validateColor = useCallback((value: string): boolean => {
    return /^#[0-9A-Fa-f]{6}$/.test(value)
  }, [])

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setName(value)
    setError(null)
  }

  const handleColorSelect = (selectedColor: string) => {
    setColor(selectedColor)
    setUseCustomColor(false)
    setCustomColor('')
  }

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    // Add # if not present
    if (value && !value.startsWith('#')) {
      value = '#' + value
    }
    setCustomColor(value)
    setUseCustomColor(true)
    if (validateColor(value)) {
      setColor(value)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!priority) return

    const nameError = validateName(name)
    if (nameError) {
      setError(nameError)
      return
    }

    const finalColor = useCustomColor ? customColor : color
    if (!finalColor || !validateColor(finalColor)) {
      setError('Ogiltig färgkod (använd format #RRGGBB)')
      return
    }

    onSave(priority.id, name.trim(), finalColor)
    onClose()
  }

  if (!priority) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Redigera prioritering"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name input */}
        <div>
          <label
            htmlFor="edit-priority-name"
            className="block text-sm font-medium text-white/80 mb-2"
          >
            Namn
          </label>
          <Input
            id="edit-priority-name"
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="T.ex. Viktigt"
            maxLength={LIMITS.PRIORITY_NAME_MAX + 10}
            error={error || undefined}
            autoFocus
          />
          <p className="mt-1 text-xs text-white/40">
            {name.length}/{LIMITS.PRIORITY_NAME_MAX} tecken
          </p>
        </div>

        {/* Color picker */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Färg
          </label>

          {/* Preset colors */}
          <div className="grid grid-cols-6 gap-2 mb-4">
            {PRESET_COLORS.map((presetColor) => (
              <button
                key={presetColor}
                type="button"
                onClick={() => handleColorSelect(presetColor)}
                className={cn(
                  'w-10 h-10 rounded-lg transition-all duration-200',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50',
                  color === presetColor && !useCustomColor
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-black/50 scale-110'
                    : 'hover:scale-105'
                )}
                style={{ backgroundColor: presetColor }}
                aria-label={`Välj färg ${presetColor}`}
                aria-pressed={color === presetColor && !useCustomColor}
              />
            ))}
          </div>

          {/* Custom color input */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg border border-border-glass flex-shrink-0"
              style={{
                backgroundColor: useCustomColor && validateColor(customColor)
                  ? customColor
                  : color,
              }}
            />
            <Input
              type="text"
              value={customColor}
              onChange={handleCustomColorChange}
              placeholder="#RRGGBB"
              className="flex-1"
              aria-label="Anpassad färgkod"
            />
          </div>
          {useCustomColor && customColor && !validateColor(customColor) && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-xs text-red-400"
            >
              Ogiltig färgkod (använd format #RRGGBB)
            </motion.p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            Avbryt
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!name.trim() || (useCustomColor && !validateColor(customColor))}
          >
            Spara
          </Button>
        </div>
      </form>
    </Modal>
  )
}
