import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../../vite.config.ts', import.meta.url), 'utf8');
const mainHtml = await readFile(new URL('../../main/html/index.html', import.meta.url), 'utf8');

test('Vite opens the clean root URL and enables the root-entry rewrite plugin', () => {
  assert.match(source, /createRootEntryRewritePlugin\(\)/);
  assert.match(source, /open:\s*['"]\/['"]/);
});

test('main HTML entry uses root-safe asset URLs when the browser location is slash', () => {
  assert.match(mainHtml, /href=["']\/main\/css\/responsive\.css["']/);
  assert.match(mainHtml, /src=["']\/main\/main-function\/index\.ts["']/);
  assert.doesNotMatch(mainHtml, /(?:href|src)=["']\.\.\//);
});
