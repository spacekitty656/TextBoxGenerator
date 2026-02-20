import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
const appSource = fs.readFileSync(path.join(process.cwd(), 'src/app.js'), 'utf8');

describe('version badge wiring', () => {
  test('APP_VERSION matches package version', () => {
    const match = appSource.match(/const APP_VERSION = '([^']+)'/);
    expect(match?.[1]).toBe(packageJson.version);
  });

  test('version badge is bound to APP_VERSION', () => {
    expect(appSource).toMatch(/appVersionBadge\.textContent\s*=\s*APP_VERSION/);
  });
});
