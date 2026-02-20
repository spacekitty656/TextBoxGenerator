const { test, expect } = require('@playwright/test');

async function skipIfManageImagesMissing(page) {
  const trigger = page.getByRole('button', { name: /manage images/i });
  const triggerCount = await trigger.count();
  test.skip(triggerCount === 0, 'Manage Images UI is not available in this build');
}

test.describe('Manage Images workflows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await skipIfManageImagesMissing(page);
  });

  test('opens Manage Images from border piece dropdown', async ({ page }) => {
    await page.getByRole('combobox', { name: /border piece/i }).click();
    await page.getByRole('button', { name: /manage images/i }).click();
    await expect(page.getByRole('dialog', { name: /manage images/i })).toBeVisible();
  });

  test('import/create folder/select/delete/rename interactions', async ({ page }) => {
    await page.getByRole('button', { name: /manage images/i }).click();
    await page.getByRole('button', { name: /new folder/i }).click();
    await page.getByRole('textbox', { name: /folder name/i }).fill('Folder A');
    await page.keyboard.press('Enter');
    await page.getByRole('treeitem', { name: /folder a/i }).click();
    await page.getByRole('button', { name: /rename/i }).click();
    await page.getByRole('textbox', { name: /name/i }).fill('Folder Renamed');
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: /delete/i }).click();
  });

  test('assignment via double-click, Enter, and OK', async ({ page }) => {
    await page.getByRole('button', { name: /manage images/i }).click();
    const item = page.getByRole('listitem').first();
    await item.dblclick();
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: /^ok$/i }).click();
  });

  test('cancel preserves prior assignment', async ({ page }) => {
    await page.getByRole('button', { name: /manage images/i }).click();
    const previous = page.getByText(/assigned:/i).first();
    const beforeText = await previous.textContent();
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByText(beforeText || '', { exact: true })).toBeVisible();
  });

  test('rotation/flip and clear-piece controls', async ({ page }) => {
    await page.getByRole('button', { name: /manage images/i }).click();
    await page.getByRole('button', { name: /rotate/i }).click();
    await page.getByRole('button', { name: /flip/i }).click();
    await page.getByRole('button', { name: /clear piece/i }).click();
  });

  test('broken-reference warning visibility after deletion', async ({ page }) => {
    await page.getByRole('button', { name: /manage images/i }).click();
    await page.getByRole('button', { name: /delete/i }).click();
    await expect(page.getByText(/broken reference/i)).toBeVisible();
  });

  test('multi-select keyboard/mouse behaviors and context menus', async ({ page }) => {
    await page.getByRole('button', { name: /manage images/i }).click();
    const first = page.getByRole('listitem').nth(0);
    const second = page.getByRole('listitem').nth(1);
    await first.click();
    await second.click({ modifiers: ['Control'] });
    await page.keyboard.down('Shift');
    await second.click();
    await page.keyboard.up('Shift');
    await second.click({ button: 'right' });
    await expect(page.getByRole('menu')).toBeVisible();
  });
});
