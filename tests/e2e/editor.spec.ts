import { expect, test } from '@playwright/test';

test('editor canvas, controls, background, and save flow behaviors', async ({ page }) => {
  await page.goto('/');

  const editor = page.locator('#editor .ql-editor');
  const canvas = page.locator('#preview-canvas');
  const wrapToggle = page.locator('#wrap-text');
  const borderToggle = page.locator('#enable-border');
  const borderWidth = page.locator('#border-width');
  const borderRadius = page.locator('#border-radius');
  const borderColor = page.locator('#border-color-input');
  const backgroundTransparent = page.locator('#background-color-transparent');
  const backgroundSolid = page.locator('#background-color-solid');
  const backgroundColorInput = page.locator('#background-color-input');

  const getCanvasDimensions = async () => {
    return canvas.evaluate((node) => ({
      width: (node as HTMLCanvasElement).width,
      height: (node as HTMLCanvasElement).height,
    }));
  };

  const getTopLeftPixel = async () => {
    return canvas.evaluate((node) => {
      const canvasNode = node as HTMLCanvasElement;
      const ctx = canvasNode.getContext('2d');

      if (!ctx) {
        return null;
      }

      return Array.from(ctx.getImageData(0, 0, 1, 1).data);
    });
  };

  const getCanvasSignature = async () => {
    return canvas.evaluate((node) => (node as HTMLCanvasElement).toDataURL('image/png'));
  };

  await expect(editor).toBeVisible();
  await editor.click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type(
    'This is a long line of rich text content that should wrap on the canvas when wrapping is enabled. '.repeat(8),
  );

  const wrappedDimensions = await getCanvasDimensions();

  await wrapToggle.uncheck();
  const unwrappedDimensions = await getCanvasDimensions();

  expect(unwrappedDimensions.width).toBeGreaterThan(wrappedDimensions.width);

  await wrapToggle.check();
  const rewrappedDimensions = await getCanvasDimensions();
  expect(rewrappedDimensions.width).toBeLessThan(unwrappedDimensions.width);

  const beforeBorderSignature = await getCanvasSignature();

  await borderToggle.check();
  await borderWidth.fill('12');
  await borderRadius.fill('24');
  await borderColor.fill('#00ff00');

  const afterBorderSignature = await getCanvasSignature();
  expect(afterBorderSignature).not.toBe(beforeBorderSignature);

  await backgroundTransparent.check();
  const transparentPixel = await getTopLeftPixel();
  expect(transparentPixel).toEqual([0, 0, 0, 0]);

  await backgroundSolid.check();
  await expect(backgroundColorInput).toBeEnabled();
  await backgroundColorInput.fill('#112233');

  const solidPixel = await getTopLeftPixel();
  expect(solidPixel).toEqual([17, 34, 51, 255]);

  const imageName = page.locator('#image-name');
  const saveImage = page.locator('#save-image');

  await imageName.fill('Report:Q1/Final');

  const downloadPromise = page.waitForEvent('download');
  await saveImage.click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('Report_Q1_Final.png');
});
