const { test, expect } = require('@playwright/test');

async function selectControlById(page, id) {
  const input = page.locator(`#${id}`);
  if (await input.isChecked()) {
    return;
  }

  await page.locator(`label[for="${id}"]`).click();
  await expect(input).toBeChecked();
}

test('smoke: editor interactions update preview and save action is triggered', async ({ page }) => {
  await page.goto('/');

  const canvas = page.locator('#preview-canvas');
  const editor = page.locator('#editor .ql-editor');

  await expect(canvas).toBeVisible();
  await expect(editor).toBeVisible();

  const beforeDataUrl = await canvas.evaluate((node) => node.toDataURL('image/png'));

  await editor.click();
  await editor.fill('Smoke test text content for preview updates.');

  await page.locator('#wrap-text').uncheck();
  await page.locator('#wrap-text').check();

  await page.locator('#enable-border').check();

  await selectControlById(page, 'background-color-solid');
  const backgroundColorInput = page.locator('#background-color-input');
  await expect(backgroundColorInput).toBeEnabled();
  await backgroundColorInput.fill('#ffcc00');

  await expect
    .poll(async () => canvas.evaluate((node) => node.toDataURL('image/png')), {
      message: 'expected preview canvas image data to change after smoke interactions',
    })
    .not.toBe(beforeDataUrl);

  await page.evaluate(() => {
    window.__toDataURLCount = 0;
    const original = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function patchedToDataURL(...args) {
      window.__toDataURLCount += 1;
      return original.apply(this, args);
    };
  });

  await page.locator('#save-image').click();

  await expect
    .poll(async () => page.evaluate(() => window.__toDataURLCount), {
      message: 'expected save action to read preview canvas image data',
    })
    .toBeGreaterThan(0);
});
