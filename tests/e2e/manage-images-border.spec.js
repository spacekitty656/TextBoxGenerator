const { test, expect } = require('@playwright/test');

async function selectControlById(page, id) {
  const input = page.locator(`#${id}`);
  if (await input.isChecked()) {
    return;
  }

  await input.evaluate((element) => {
    element.checked = true;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });

  await expect(input).toBeChecked();
}

async function enableImageBorderMode(page) {
  await page.goto('/');
  await page.locator('#enable-border').check();

  const borderColorAccordion = page.locator('details[aria-label="Border color options"]');
  await borderColorAccordion.evaluate((element) => {
    if (!element.open) {
      element.open = true;
    }
  });

  await selectControlById(page, 'border-color-images');
  await expect(page.locator('#image-border-controls')).not.toHaveClass(/hidden/);
}

async function openManageImagesForSlot(page, slotId) {
  const slotButton = page.locator(`#${slotId}`);
  await expect(slotButton).toBeEnabled();
  await slotButton.dispatchEvent('click');
  await expect(page.locator('#manage-images-overlay')).toBeVisible();
}

async function importImage(page, name = 'imported.png') {
  const pngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO8N6hQAAAAASUVORK5CYII=',
    'base64',
  );
  await page.setInputFiles('#manage-images-input', {
    name,
    mimeType: 'image/png',
    buffer: pngBuffer,
  });
}

test('opens Manage Images from piece dropdown and supports import/create/rename/delete', async ({ page }) => {
  await enableImageBorderMode(page);

  await openManageImagesForSlot(page, 'image-border-corner-top-left');

  await importImage(page, 'folder-test.png');
  await expect(page.locator('#manage-images-tree')).toContainText('folder-test.png');

  await page.locator('#manage-images-create-folder').click();
  const newFolderInput = page.locator('.manage-tree-rename-input');
  await newFolderInput.fill('My Folder');
  await newFolderInput.press('Enter');

  const folderRow = page.locator('.manage-tree-row', { hasText: 'My Folder' });
  await folderRow.click();
  await page.locator('#manage-images-rename').click();
  const renameInput = page.locator('.manage-tree-rename-input');
  await renameInput.fill('Renamed Folder');
  await renameInput.press('Enter');
  await expect(page.locator('#manage-images-tree')).toContainText('Renamed Folder');

  await page.locator('.manage-tree-row', { hasText: 'Renamed Folder' }).click();
  await page.locator('#manage-images-delete').click();
  await page.getByRole('button', { name: /Delete Folder/ }).first().click();
  await expect(page.locator('#manage-images-tree')).not.toContainText('Renamed Folder');

  await page.locator('#manage-images-cancel').click();
  await expect(page.locator('#manage-images-overlay')).toBeHidden();
});

test('supports assignment via double-click, Enter, OK and preserves prior assignment on Cancel', async ({ page }) => {
  await enableImageBorderMode(page);

  await openManageImagesForSlot(page, 'image-border-corner-top-left');
  await importImage(page, 'assign-a.png');
  const firstImageRow = page.locator('.manage-tree-row[data-entity-key^="image:"]', { hasText: 'assign-a.png' });
  await firstImageRow.dblclick();
  await expect(page.locator('#manage-images-overlay')).toBeHidden();
  await expect(page.locator('#image-border-corner-top-left')).toContainText('assign-a');

  await openManageImagesForSlot(page, 'image-border-corner-top-left');
  await importImage(page, 'assign-b.png');
  const secondImageRow = page.locator('.manage-tree-row[data-entity-key^="image:"]', { hasText: 'assign-b.png' });
  await secondImageRow.click();
  await page.keyboard.press('Enter');
  await expect(page.locator('#manage-images-overlay')).toBeHidden();
  await expect(page.locator('#image-border-corner-top-left')).toContainText('assign-b');

  await openManageImagesForSlot(page, 'image-border-corner-top-left');
  await firstImageRow.click();
  await page.locator('#manage-images-ok').click();
  await expect(page.locator('#image-border-corner-top-left')).toContainText('assign-a');

  await openManageImagesForSlot(page, 'image-border-corner-top-left');
  await secondImageRow.click();
  await page.locator('#manage-images-cancel').click();
  await expect(page.locator('#image-border-corner-top-left')).toContainText('assign-a');
});

test('supports rotation/flip/clear controls and shows broken-reference warning after deletion', async ({ page }) => {
  await enableImageBorderMode(page);

  await openManageImagesForSlot(page, 'image-border-corner-top-left');
  await importImage(page, 'warn-me.png');
  await page.locator('.manage-tree-row[data-entity-key^="image:"]', { hasText: 'warn-me.png' }).dblclick();

  await page.selectOption('#image-border-corner-top-left-rotation', '90');
  await page.locator('#image-border-corner-top-left-flip-x').check();
  await page.locator('#image-border-corner-top-left-flip-y').check();
  await expect(page.locator('#image-border-corner-top-left-rotation')).toHaveValue('90');
  await expect(page.locator('#image-border-corner-top-left-flip-x')).toBeChecked();
  await expect(page.locator('#image-border-corner-top-left-flip-y')).toBeChecked();

  await page.locator('#image-border-corner-top-left-clear').click();
  await expect(page.locator('#image-border-corner-top-left')).toContainText('No image');

  await openManageImagesForSlot(page, 'image-border-corner-top-left');
  await page.locator('.manage-tree-row[data-entity-key^="image:"]', { hasText: 'warn-me.png' }).click();
  await page.locator('#manage-images-ok').click();

  await openManageImagesForSlot(page, 'image-border-corner-top-right');
  await page.locator('.manage-tree-row[data-entity-key^="image:"]', { hasText: 'warn-me.png' }).click();
  await page.locator('#manage-images-delete').click();
  await page.getByRole('button', { name: 'Delete Image(s)' }).click();
  await page.locator('#manage-images-cancel').click();

  await expect(page.locator('#image-border-corner-top-left')).toContainText('⚠ Missing image');
});

test('supports multiselect mouse/keyboard behavior and context menus', async ({ page }) => {
  await enableImageBorderMode(page);

  await openManageImagesForSlot(page, 'image-border-side-top');
  await importImage(page, 'multi-a.png');
  await importImage(page, 'multi-b.png');

  const rowA = page.locator('.manage-tree-row[data-entity-key^="image:"]', { hasText: 'multi-a.png' });
  const rowB = page.locator('.manage-tree-row[data-entity-key^="image:"]', { hasText: 'multi-b.png' });

  await rowA.click();
  await rowB.click({ modifiers: ['Control'] });
  await expect(page.locator('.manage-tree-row.active')).toHaveCount(2);

  await rowA.click({ button: 'right' });
  await expect(page.locator('#manage-images-context-menu')).toBeVisible();
  await expect(page.locator('#manage-images-context-menu')).toContainText('Delete');

  await page.keyboard.press('Delete');
  await page.getByRole('button', { name: 'Delete Image(s)' }).click();
  await expect(page.locator('#manage-images-tree')).not.toContainText('multi-a.png');
  await expect(page.locator('#manage-images-tree')).not.toContainText('multi-b.png');
});
