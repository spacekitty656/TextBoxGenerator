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

test('border mode switching updates control visibility and enabled states', async ({ page }) => {
  await page.goto('/');

  const borderToggle = page.locator('#enable-border');

  const borderColorInput = page.locator('#border-color-input');
  const insideOutColors = page.locator('#inside-out-colors');
  const insideOutAdd = page.locator('#inside-out-add-color');
  const imageControls = page.locator('#image-border-controls');
  const imageSizing = page.locator('#image-border-sizing-mode');
  const imageRepeat = page.locator('#image-border-repeat-mode');

  await borderToggle.check();

  await selectControlById(page, 'border-color-solid');
  await expect(borderColorInput).toBeEnabled();
  await expect(insideOutColors).toHaveClass(/hidden/);
  await expect(imageControls).toHaveClass(/hidden/);

  await selectControlById(page, 'border-color-inside-out');
  await expect(borderColorInput).toBeDisabled();
  await expect(insideOutColors).not.toHaveClass(/hidden/);
  await expect(insideOutAdd).toBeEnabled();
  await expect(imageControls).toHaveClass(/hidden/);

  await selectControlById(page, 'border-color-images');
  await expect(borderColorInput).toBeDisabled();
  await expect(insideOutColors).toHaveClass(/hidden/);
  await expect(imageControls).not.toHaveClass(/hidden/);
  await expect(imageSizing).toBeEnabled();
  await expect(imageRepeat).toBeEnabled();
});
