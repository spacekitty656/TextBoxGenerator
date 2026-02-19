const { test, expect } = require('@playwright/test');

test('border mode switching updates control visibility and enabled states', async ({ page }) => {
  await page.goto('/');

  const borderToggle = page.locator('#enable-border');
  const solidMode = page.locator('#border-color-solid');
  const insideOutMode = page.locator('#border-color-inside-out');
  const imagesMode = page.locator('#border-color-images');

  const borderColorInput = page.locator('#border-color-input');
  const insideOutColors = page.locator('#inside-out-colors');
  const insideOutAdd = page.locator('#inside-out-add-color');
  const imageControls = page.locator('#image-border-controls');
  const imageSizing = page.locator('#image-border-sizing-mode');
  const imageRepeat = page.locator('#image-border-repeat-mode');

  await borderToggle.check();

  await solidMode.check();
  await expect(borderColorInput).toBeEnabled();
  await expect(insideOutColors).toHaveClass(/hidden/);
  await expect(imageControls).toHaveClass(/hidden/);

  await insideOutMode.check();
  await expect(borderColorInput).toBeDisabled();
  await expect(insideOutColors).not.toHaveClass(/hidden/);
  await expect(insideOutAdd).toBeEnabled();
  await expect(imageControls).toHaveClass(/hidden/);

  await imagesMode.check();
  await expect(borderColorInput).toBeDisabled();
  await expect(insideOutColors).toHaveClass(/hidden/);
  await expect(imageControls).not.toHaveClass(/hidden/);
  await expect(imageSizing).toBeEnabled();
  await expect(imageRepeat).toBeEnabled();
});
