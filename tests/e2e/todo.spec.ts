import { test, expect } from '@playwright/test'

test.describe('Todo Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Close welcome modal if present
    const modal = page.locator('[data-testid="welcome-modal"]')
    if (await modal.isVisible()) {
      await page.locator('[data-testid="welcome-close"]').click()
    }
  })

  test('should add a new todo', async ({ page }) => {
    const todoInput = page.locator('[data-testid="todo-input"]')
    await todoInput.fill('Buy groceries')
    await todoInput.press('Enter')

    await expect(page.locator('text=Buy groceries')).toBeVisible()
  })

  test('should toggle todo completion', async ({ page }) => {
    // Add a todo first
    const todoInput = page.locator('[data-testid="todo-input"]')
    await todoInput.fill('Test todo')
    await todoInput.press('Enter')

    // Toggle completion
    const todoCheckbox = page.locator('[data-testid="todo-checkbox"]').first()
    await todoCheckbox.click()

    await expect(todoCheckbox).toBeChecked()
  })

  test('should delete a todo', async ({ page }) => {
    // Add a todo
    const todoInput = page.locator('[data-testid="todo-input"]')
    await todoInput.fill('Delete me')
    await todoInput.press('Enter')

    await expect(page.locator('text=Delete me')).toBeVisible()

    // Delete the todo
    const deleteButton = page.locator('[data-testid="todo-delete"]').first()
    await deleteButton.click()

    await expect(page.locator('text=Delete me')).not.toBeVisible()
  })

  test('should edit a todo', async ({ page }) => {
    // Add a todo
    const todoInput = page.locator('[data-testid="todo-input"]')
    await todoInput.fill('Original text')
    await todoInput.press('Enter')

    // Double-click to edit
    await page.locator('text=Original text').dblclick()

    const editInput = page.locator('[data-testid="todo-edit-input"]')
    await editInput.fill('Edited text')
    await editInput.press('Enter')

    await expect(page.locator('text=Edited text')).toBeVisible()
    await expect(page.locator('text=Original text')).not.toBeVisible()
  })

  test('should persist todos in localStorage', async ({ page }) => {
    // Add a todo
    const todoInput = page.locator('[data-testid="todo-input"]')
    await todoInput.fill('Persistent todo')
    await todoInput.press('Enter')

    await expect(page.locator('text=Persistent todo')).toBeVisible()

    // Reload the page
    await page.reload()

    // Close welcome modal if it appears again
    const modal = page.locator('[data-testid="welcome-modal"]')
    if (await modal.isVisible()) {
      await page.locator('[data-testid="welcome-close"]').click()
    }

    // Todo should still be visible
    await expect(page.locator('text=Persistent todo')).toBeVisible()
  })

  test('should handle empty todo input', async ({ page }) => {
    const todoInput = page.locator('[data-testid="todo-input"]')
    await todoInput.press('Enter')

    // Should not create an empty todo - count should remain 0
    const todoItems = page.locator('[data-testid="todo-item"]')
    await expect(todoItems).toHaveCount(0)
  })

  test('should trim whitespace from todo text', async ({ page }) => {
    const todoInput = page.locator('[data-testid="todo-input"]')
    await todoInput.fill('   Trimmed todo   ')
    await todoInput.press('Enter')

    // Should display trimmed text
    await expect(page.locator('text=Trimmed todo')).toBeVisible()
  })
})

test.describe('Priority Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const modal = page.locator('[data-testid="welcome-modal"]')
    if (await modal.isVisible()) {
      await page.locator('[data-testid="welcome-close"]').click()
    }
  })

  test('should display default priorities', async ({ page }) => {
    await expect(page.locator('text=Must do asap')).toBeVisible()
    await expect(page.locator('text=Todo')).toBeVisible()
    await expect(page.locator('text=Only do in spare time')).toBeVisible()
  })

  test('should display priorities in vertical layout', async ({ page }) => {
    const priorityColumns = page.locator('[data-testid^="priority-column-"]')
    await expect(priorityColumns).toHaveCount(3)

    // Check vertical ordering (first column should be "Must do asap")
    const firstColumn = priorityColumns.first()
    await expect(firstColumn.locator('text=Must do asap')).toBeVisible()
  })

  test('should add a new priority', async ({ page }) => {
    await page.locator('[data-testid="add-priority"]').click()

    const nameInput = page.locator('[data-testid="priority-name-input"]')
    await nameInput.fill('Urgent')

    await page.locator('[data-testid="priority-save"]').click()

    await expect(page.locator('text=Urgent')).toBeVisible()
  })

  test('should edit an existing priority', async ({ page }) => {
    // Click edit button on first priority
    const editButton = page.locator('[data-testid="priority-edit"]').first()
    await editButton.click()

    const nameInput = page.locator('[data-testid="priority-name-input"]')
    await nameInput.clear()
    await nameInput.fill('Critical Tasks')

    await page.locator('[data-testid="priority-save"]').click()

    await expect(page.locator('text=Critical Tasks')).toBeVisible()
  })

  test('should delete a priority', async ({ page }) => {
    // First add a new priority to delete
    await page.locator('[data-testid="add-priority"]').click()
    const nameInput = page.locator('[data-testid="priority-name-input"]')
    await nameInput.fill('To Delete')
    await page.locator('[data-testid="priority-save"]').click()

    await expect(page.locator('text=To Delete')).toBeVisible()

    // Delete the priority
    const deleteButton = page
      .locator('[data-testid="priority-column-3"]')
      .locator('[data-testid="priority-delete"]')
    await deleteButton.click()

    // Confirm deletion if there's a confirmation dialog
    const confirmButton = page.locator('[data-testid="confirm-delete"]')
    if (await confirmButton.isVisible()) {
      await confirmButton.click()
    }

    await expect(page.locator('text=To Delete')).not.toBeVisible()
  })

  test('should assign todo to specific priority', async ({ page }) => {
    // Click on the second priority column to select it
    const secondColumn = page.locator('[data-testid="priority-column-1"]')
    await secondColumn.click()

    // Add a todo
    const todoInput = page.locator('[data-testid="todo-input"]')
    await todoInput.fill('Priority specific todo')
    await todoInput.press('Enter')

    // Verify todo is in the correct column
    await expect(
      secondColumn.locator('text=Priority specific todo')
    ).toBeVisible()
  })
})

test.describe('Theme Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const modal = page.locator('[data-testid="welcome-modal"]')
    if (await modal.isVisible()) {
      await page.locator('[data-testid="welcome-close"]').click()
    }
  })

  test('should display theme selector', async ({ page }) => {
    const themeSelector = page.locator('[data-testid="theme-selector"]')
    await expect(themeSelector).toBeVisible()
  })

  test('should switch to starfall theme', async ({ page }) => {
    await page.locator('[data-testid="theme-selector"]').click()
    await page.locator('[data-testid="theme-starfall"]').click()

    await expect(page.locator('[data-testid="background-starfall"]')).toBeVisible()
  })

  test('should switch to star wars theme', async ({ page }) => {
    await page.locator('[data-testid="theme-selector"]').click()
    await page.locator('[data-testid="theme-starwars"]').click()

    await expect(page.locator('[data-testid="background-starwars"]')).toBeVisible()
  })

  test('should switch to summer theme', async ({ page }) => {
    await page.locator('[data-testid="theme-selector"]').click()
    await page.locator('[data-testid="theme-summer"]').click()

    await expect(page.locator('[data-testid="background-summer"]')).toBeVisible()
  })

  test('should switch to aurora theme', async ({ page }) => {
    await page.locator('[data-testid="theme-selector"]').click()
    await page.locator('[data-testid="theme-aurora"]').click()

    await expect(page.locator('[data-testid="background-aurora"]')).toBeVisible()
  })

  test('should switch to ocean theme', async ({ page }) => {
    await page.locator('[data-testid="theme-selector"]').click()
    await page.locator('[data-testid="theme-ocean"]').click()

    await expect(page.locator('[data-testid="background-ocean"]')).toBeVisible()
  })

  test('should persist theme preference', async ({ page }) => {
    // Select aurora theme
    await page.locator('[data-testid="theme-selector"]').click()
    await page.locator('[data-testid="theme-aurora"]').click()

    // Reload page
    await page.reload()

    // Close welcome modal if needed
    const modal = page.locator('[data-testid="welcome-modal"]')
    if (await modal.isVisible()) {
      await page.locator('[data-testid="welcome-close"]').click()
    }

    // Theme should persist
    await expect(page.locator('[data-testid="background-aurora"]')).toBeVisible()
  })
})

test.describe('Token & Restore', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const modal = page.locator('[data-testid="welcome-modal"]')
    if (await modal.isVisible()) {
      await page.locator('[data-testid="welcome-close"]').click()
    }
  })

  test('should display user token in settings', async ({ page }) => {
    await page.locator('[data-testid="settings-button"]').click()

    const tokenDisplay = page.locator('[data-testid="token-display"]')
    await expect(tokenDisplay).toBeVisible()
    await expect(tokenDisplay).toHaveText(/[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{3}/)
  })

  test('should display QR code for token', async ({ page }) => {
    await page.locator('[data-testid="settings-button"]').click()

    const qrCode = page.locator('[data-testid="token-qrcode"]')
    await expect(qrCode).toBeVisible()
  })

  test('should copy token to clipboard', async ({ page }) => {
    await page.locator('[data-testid="settings-button"]').click()

    const copyButton = page.locator('[data-testid="copy-token"]')
    await copyButton.click()

    // Check for success feedback
    const successMessage = page.locator('text=Kopierad')
    await expect(successMessage).toBeVisible()
  })

  test('should navigate to restore page with token', async ({ page }) => {
    await page.goto('/restore/ABC-DEF-GHI')

    await expect(page.locator('[data-testid="restore-page"]')).toBeVisible()
    await expect(page.locator('text=Aterstall')).toBeVisible()
  })

  test('should show error for invalid token format', async ({ page }) => {
    await page.goto('/restore/invalid-token')

    await expect(page.locator('[data-testid="token-error"]')).toBeVisible()
  })

  test('should allow manual token entry', async ({ page }) => {
    await page.goto('/restore')

    const tokenInput = page.locator('[data-testid="token-input"]')
    await tokenInput.fill('ABC-DEF-GHI')

    const restoreButton = page.locator('[data-testid="restore-button"]')
    await restoreButton.click()

    // Should attempt restore (may show error if token doesn't exist in backend)
    await expect(
      page.locator('[data-testid="restore-loading"], [data-testid="restore-error"], [data-testid="restore-success"]')
    ).toBeVisible()
  })
})

test.describe('Drag and Drop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const modal = page.locator('[data-testid="welcome-modal"]')
    if (await modal.isVisible()) {
      await page.locator('[data-testid="welcome-close"]').click()
    }
  })

  test('should drag todo between priorities', async ({ page }) => {
    // Add a todo to first priority
    const todoInput = page.locator('[data-testid="todo-input"]')
    await todoInput.fill('Drag me')
    await todoInput.press('Enter')

    // Get the todo and target priority column
    const todo = page.locator('[data-testid="todo-item"]').filter({ hasText: 'Drag me' })
    const targetColumn = page.locator('[data-testid="priority-column-1"]')

    // Perform drag and drop
    await todo.dragTo(targetColumn)

    // Verify todo moved to new column
    await expect(targetColumn.locator('text=Drag me')).toBeVisible()
  })

  test('should reorder todos within same priority', async ({ page }) => {
    // Add multiple todos
    const todoInput = page.locator('[data-testid="todo-input"]')

    await todoInput.fill('First todo')
    await todoInput.press('Enter')

    await todoInput.fill('Second todo')
    await todoInput.press('Enter')

    await todoInput.fill('Third todo')
    await todoInput.press('Enter')

    // Drag third todo to first position
    const thirdTodo = page.locator('[data-testid="todo-item"]').filter({ hasText: 'Third todo' })
    const firstTodo = page.locator('[data-testid="todo-item"]').filter({ hasText: 'First todo' })

    await thirdTodo.dragTo(firstTodo)

    // Verify new order
    const todos = page.locator('[data-testid="todo-item"]')
    await expect(todos.first()).toContainText('Third todo')
  })

  test('should show visual feedback during drag', async ({ page }) => {
    // Add a todo
    const todoInput = page.locator('[data-testid="todo-input"]')
    await todoInput.fill('Draggable todo')
    await todoInput.press('Enter')

    const todo = page.locator('[data-testid="todo-item"]').first()

    // Start dragging
    await todo.hover()
    await page.mouse.down()

    // Check for drag feedback class or element
    await expect(page.locator('[data-testid="drag-overlay"]')).toBeVisible()

    await page.mouse.up()
  })

  test('should preserve todo data after drag', async ({ page }) => {
    // Add a completed todo
    const todoInput = page.locator('[data-testid="todo-input"]')
    await todoInput.fill('Completed draggable')
    await todoInput.press('Enter')

    // Mark as complete
    const checkbox = page.locator('[data-testid="todo-checkbox"]').first()
    await checkbox.click()

    // Drag to another column
    const todo = page.locator('[data-testid="todo-item"]').first()
    const targetColumn = page.locator('[data-testid="priority-column-2"]')
    await todo.dragTo(targetColumn)

    // Verify completion status preserved
    const movedCheckbox = targetColumn.locator('[data-testid="todo-checkbox"]').first()
    await expect(movedCheckbox).toBeChecked()
  })
})

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should display properly on mobile', async ({ page }) => {
    await page.goto('/')

    const modal = page.locator('[data-testid="welcome-modal"]')
    if (await modal.isVisible()) {
      await page.locator('[data-testid="welcome-close"]').click()
    }

    // Main elements should be visible
    await expect(page.locator('[data-testid="todo-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="priority-column-0"]')).toBeVisible()
  })

  test('should have touch-friendly controls', async ({ page }) => {
    await page.goto('/')

    const modal = page.locator('[data-testid="welcome-modal"]')
    if (await modal.isVisible()) {
      await page.locator('[data-testid="welcome-close"]').click()
    }

    // Check that interactive elements have sufficient touch targets
    const todoInput = page.locator('[data-testid="todo-input"]')
    const box = await todoInput.boundingBox()

    // Minimum touch target should be 44x44 pixels
    expect(box?.height).toBeGreaterThanOrEqual(44)
  })
})
