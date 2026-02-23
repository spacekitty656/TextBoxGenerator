function createButton(buttonConfig, onResolve) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = buttonConfig.variant === 'primary'
    ? 'window-primary-button'
    : 'window-secondary-button';
  button.textContent = buttonConfig.label;
  button.addEventListener('click', () => onResolve(buttonConfig.value));
  return button;
}

export function openWindowChoiceDialog({
  title = 'Confirm',
  message = '',
  buttons = [],
}) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'color-window-overlay window-choice-overlay';
    overlay.setAttribute('aria-hidden', 'false');

    const dialog = document.createElement('div');
    dialog.className = 'color-window window-choice-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');

    const header = document.createElement('div');
    header.className = 'color-window-header';

    const titleElement = document.createElement('h2');
    titleElement.textContent = title;

    const body = document.createElement('div');
    body.className = 'window-choice-body';

    const messageElement = document.createElement('p');
    messageElement.className = 'window-choice-message';
    messageElement.textContent = message;

    const actions = document.createElement('div');
    actions.className = 'dialog-action-row';

    function closeWith(value) {
      overlay.remove();
      resolve(value);
    }

    const resolvedButtons = buttons.length > 0
      ? buttons
      : [{ label: 'OK', value: 'ok', variant: 'primary' }];

    resolvedButtons.forEach((buttonConfig) => {
      actions.appendChild(createButton(buttonConfig, closeWith));
    });

    body.append(messageElement, actions);
    header.appendChild(titleElement);
    dialog.append(header, body);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
  });
}
