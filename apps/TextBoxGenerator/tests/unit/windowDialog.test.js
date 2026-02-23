import { describe, expect, it } from 'vitest';

import { openWindowChoiceDialog } from '../../src/ui/windowDialog.js';

describe('window choice dialog', () => {
  it('renders message/buttons and resolves selected value', async () => {
    const promise = openWindowChoiceDialog({
      title: 'Delete Folder',
      message: 'Choose an action.',
      buttons: [
        { label: 'Delete Folder and Children', value: 'delete', variant: 'primary' },
        { label: 'Cancel', value: 'cancel', variant: 'secondary' },
      ],
    });

    const overlay = document.querySelector('.window-choice-overlay');
    expect(overlay).toBeTruthy();
    expect(overlay.querySelector('.window-choice-message')?.textContent).toBe('Choose an action.');

    const deleteButton = Array.from(overlay.querySelectorAll('button')).find((button) => button.textContent === 'Delete Folder and Children');
    deleteButton.click();

    await expect(promise).resolves.toBe('delete');
    expect(document.querySelector('.window-choice-overlay')).toBeNull();
  });

  it('uses default button when none provided', async () => {
    const promise = openWindowChoiceDialog({ title: 'Notice', message: 'Done.' });
    const okButton = document.querySelector('.window-choice-overlay .window-primary-button');
    expect(okButton?.textContent).toBe('OK');
    okButton.click();

    await expect(promise).resolves.toBe('ok');
  });
});
