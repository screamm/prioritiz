import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Close welcome modal
    const modal = page.locator('[data-testid="welcome-modal"]')
    if (await modal.isVisible()) {
      await page.locator('[data-testid="welcome-close"]').click()
    }
  })

  test('should have no accessibility violations on main page', async ({
    page,
  }) => {
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should have no critical accessibility violations', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    const criticalViolations = accessibilityScanResults.violations.filter(
      (violation) =>
        violation.impact === 'critical' || violation.impact === 'serious'
    )

    expect(criticalViolations).toEqual([])
  })

  test('should have accessible settings modal', async ({ page }) => {
    await page.locator('[data-testid="settings-button"]').click()

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="settings-modal"]')
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should have accessible priority columns', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid^="priority-column-"]')
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })
})

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const modal = page.locator('[data-testid="welcome-modal"]')
    if (await modal.isVisible()) {
      await page.locator('[data-testid="welcome-close"]').click()
    }
  })

  test('should be fully keyboard navigable', async ({ page }) => {
    // Tab through interactive elements
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Should be able to focus todo input
    const todoInput = page.locator('[data-testid="todo-input"]')
    await expect(todoInput).toBeFocused()

    // Type and submit with keyboard
    await page.keyboard.type('Keyboard todo')
    await page.keyboard.press('Enter')

    await expect(page.locator('text=Keyboard todo')).toBeVisible()
  })

  test('should navigate todos with arrow keys', async ({ page }) => {
    // Add multiple todos
    const todoInput = page.locator('[data-testid="todo-input"]')
    await todoInput.fill('Todo 1')
    await todoInput.press('Enter')
    await todoInput.fill('Todo 2')
    await todoInput.press('Enter')
    await todoInput.fill('Todo 3')
    await todoInput.press('Enter')

    // Tab to first todo
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Navigate with arrow keys
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')

    // Third todo should be focused
    const thirdTodo = page.locator('[data-testid="todo-item"]').nth(2)
    await expect(thirdTodo).toBeFocused()
  })

  test('should toggle todo with Space key', async ({ page }) => {
    // Add a todo
    const todoInput = page.locator('[data-testid="todo-input"]')
    await todoInput.fill('Space toggle test')
    await todoInput.press('Enter')

    // Navigate to checkbox
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Toggle with Space
    await page.keyboard.press('Space')

    const checkbox = page.locator('[data-testid="todo-checkbox"]').first()
    await expect(checkbox).toBeChecked()
  })

  test('should delete todo with Delete key', async ({ page }) => {
    // Add a todo
    const todoInput = page.locator('[data-testid="todo-input"]')
    await todoInput.fill('Delete key test')
    await todoInput.press('Enter')

    await expect(page.locator('text=Delete key test')).toBeVisible()

    // Focus the todo item
    const todo = page.locator('[data-testid="todo-item"]').first()
    await todo.focus()

    // Delete with Delete key
    await page.keyboard.press('Delete')

    await expect(page.locator('text=Delete key test')).not.toBeVisible()
  })

  test('should edit todo with Enter key', async ({ page }) => {
    // Add a todo
    const todoInput = page.locator('[data-testid="todo-input"]')
    await todoInput.fill('Edit with enter')
    await todoInput.press('Enter')

    // Focus the todo item
    const todo = page.locator('[data-testid="todo-item"]').first()
    await todo.focus()

    // Enter edit mode
    await page.keyboard.press('Enter')

    const editInput = page.locator('[data-testid="todo-edit-input"]')
    await expect(editInput).toBeVisible()
    await expect(editInput).toBeFocused()

    // Edit and save
    await page.keyboard.type(' - edited')
    await page.keyboard.press('Enter')

    await expect(page.locator('text=Edit with enter - edited')).toBeVisible()
  })

  test('should cancel edit with Escape key', async ({ page }) => {
    // Add a todo
    const todoInput = page.locator('[data-testid="todo-input"]')
    await todoInput.fill('Escape test')
    await todoInput.press('Enter')

    // Enter edit mode by double-clicking
    await page.locator('text=Escape test').dblclick()

    const editInput = page.locator('[data-testid="todo-edit-input"]')
    await expect(editInput).toBeFocused()

    // Change text
    await editInput.fill('Changed text')

    // Cancel with Escape
    await page.keyboard.press('Escape')

    // Original text should remain
    await expect(page.locator('text=Escape test')).toBeVisible()
    await expect(page.locator('text=Changed text')).not.toBeVisible()
  })

  test('should trap focus in modal dialogs', async ({ page }) => {
    await page.locator('[data-testid="settings-button"]').click()

    // Tab through all focusable elements in modal
    const focusableElements = await page
      .locator('[data-testid="settings-modal"] button, [data-testid="settings-modal"] input')
      .count()

    // Tab through all elements
    for (let i = 0; i < focusableElements + 1; i++) {
      await page.keyboard.press('Tab')
    }

    // Focus should wrap back to first element in modal, not escape to page behind
    const modalElement = page.locator('[data-testid="settings-modal"]')
    const focusedElement = page.locator(':focus')

    // The focused element should be within the modal
    await expect(focusedElement).toBeVisible()
    const focusedBox = await focusedElement.boundingBox()
    const modalBox = await modalElement.boundingBox()

    if (focusedBox && modalBox) {
      expect(focusedBox.x).toBeGreaterThanOrEqual(modalBox.x)
      expect(focusedBox.y).toBeGreaterThanOrEqual(modalBox.y)
    }
  })

  test('should close modal with Escape key', async ({ page }) => {
    await page.locator('[data-testid="settings-button"]').click()

    const modal = page.locator('[data-testid="settings-modal"]')
    await expect(modal).toBeVisible()

    await page.keyboard.press('Escape')

    await expect(modal).not.toBeVisible()
  })
})

test.describe('Screen Reader Support', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const modal = page.locator('[data-testid="welcome-modal"]')
    if (await modal.isVisible()) {
      await page.locator('[data-testid="welcome-close"]').click()
    }
  })

  test('should have proper ARIA labels on interactive elements', async ({
    page,
  }) => {
    // Check todo input has label
    const todoInput = page.locator('[data-testid="todo-input"]')
    const inputLabel =
      (await todoInput.getAttribute('aria-label')) ||
      (await todoInput.getAttribute('aria-labelledby'))
    expect(inputLabel).toBeTruthy()

    // Check settings button has label
    const settingsButton = page.locator('[data-testid="settings-button"]')
    const settingsLabel =
      (await settingsButton.getAttribute('aria-label')) ||
      (await settingsButton.textContent())
    expect(settingsLabel).toBeTruthy()
  })

  test('should have proper roles on priority columns', async ({ page }) => {
    const columns = page.locator('[data-testid^="priority-column-"]')
    const count = await columns.count()

    for (let i = 0; i < count; i++) {
      const column = columns.nth(i)
      const role = await column.getAttribute('role')
      // Columns should have a semantic role
      expect(['region', 'list', 'group', 'listbox']).toContain(role)
    }
  })

  test('should announce todo actions to screen readers', async ({ page }) => {
    // Add a todo
    const todoInput = page.locator('[data-testid="todo-input"]')
    await todoInput.fill('Announcement test')
    await todoInput.press('Enter')

    // Check for live region
    const liveRegion = page.locator('[aria-live]')
    await expect(liveRegion).toBeVisible()
  })

  test('should have proper heading structure', async ({ page }) => {
    // Check for h1
    const h1 = page.locator('h1')
    await expect(h1).toHaveCount(1)

    // Check heading hierarchy
    const headings = await page.evaluate(() => {
      const hs = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
      return Array.from(hs).map((h) => ({
        level: parseInt(h.tagName[1]),
        text: h.textContent,
      }))
    })

    // Verify no skipped heading levels
    for (let i = 1; i < headings.length; i++) {
      const diff = headings[i].level - headings[i - 1].level
      expect(diff).toBeLessThanOrEqual(1) // Can go down any level, but only up by 1
    }
  })

  test('should have visible focus indicators', async ({ page }) => {
    const todoInput = page.locator('[data-testid="todo-input"]')
    await todoInput.focus()

    // Get computed styles to check for focus indicator
    const focusStyles = await todoInput.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        boxShadow: styles.boxShadow,
        borderColor: styles.borderColor,
      }
    })

    // Should have some form of visible focus indicator
    const hasVisibleFocus =
      focusStyles.outline !== 'none' ||
      focusStyles.outlineWidth !== '0px' ||
      focusStyles.boxShadow !== 'none' ||
      focusStyles.borderColor !== 'rgb(0, 0, 0)'

    expect(hasVisibleFocus).toBe(true)
  })
})

test.describe('Color Contrast', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const modal = page.locator('[data-testid="welcome-modal"]')
    if (await modal.isVisible()) {
      await page.locator('[data-testid="welcome-close"]').click()
    }
  })

  test('should pass color contrast requirements', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .options({ runOnly: ['color-contrast'] })
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should maintain contrast in all themes', async ({ page }) => {
    const themes = ['starfall', 'starwars', 'summer', 'aurora', 'ocean']

    for (const theme of themes) {
      await page.locator('[data-testid="theme-selector"]').click()
      await page.locator(`[data-testid="theme-${theme}"]`).click()

      const results = await new AxeBuilder({ page })
        .options({ runOnly: ['color-contrast'] })
        .analyze()

      const criticalContrastIssues = results.violations.filter(
        (v) => v.id === 'color-contrast' && v.impact === 'serious'
      )

      expect(criticalContrastIssues).toEqual([])
    }
  })
})

test.describe('Reduced Motion', () => {
  test('should respect prefers-reduced-motion', async ({ page }) => {
    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    const modal = page.locator('[data-testid="welcome-modal"]')
    if (await modal.isVisible()) {
      await page.locator('[data-testid="welcome-close"]').click()
    }

    // Add a todo and check that animations are disabled or simplified
    const todoInput = page.locator('[data-testid="todo-input"]')
    await todoInput.fill('Reduced motion test')
    await todoInput.press('Enter')

    // Check that particles/animations are disabled
    const particles = page.locator('[data-testid="background-particles"]')
    const particlesVisible = await particles.isVisible()

    // Either particles should be hidden, or they should have reduced animation
    if (particlesVisible) {
      const animationStyle = await particles.evaluate((el) => {
        return window.getComputedStyle(el).animationDuration
      })
      // Animation should be 0 or very short
      expect(['0s', '0ms', 'none']).toContain(animationStyle)
    }
  })
})

test.describe('Welcome Modal Accessibility', () => {
  test('should have accessible welcome modal', async ({ page }) => {
    await page.goto('/')

    const modal = page.locator('[data-testid="welcome-modal"]')
    if (await modal.isVisible()) {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('[data-testid="welcome-modal"]')
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    }
  })

  test('should focus close button when modal opens', async ({ page }) => {
    await page.goto('/')

    const modal = page.locator('[data-testid="welcome-modal"]')
    if (await modal.isVisible()) {
      // First focusable element in modal should be focused
      const closeButton = page.locator('[data-testid="welcome-close"]')
      await expect(closeButton).toBeFocused()
    }
  })
})
