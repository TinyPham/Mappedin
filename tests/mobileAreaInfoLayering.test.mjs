import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../main/main-function/index.ts', import.meta.url), 'utf8');
const responsiveCss = readFileSync(new URL('../main/css/responsive.css', import.meta.url), 'utf8');

function getBalancedBlock(text, marker, startIndex = 0) {
  const markerIndex = text.indexOf(marker, startIndex);
  assert.notEqual(markerIndex, -1, `Missing marker: ${marker}`);

  const blockStart = text.indexOf('{', markerIndex);
  assert.notEqual(blockStart, -1, `Missing block start for: ${marker}`);

  let depth = 0;
  for (let index = blockStart; index < text.length; index += 1) {
    if (text[index] === '{') depth += 1;
    if (text[index] === '}') depth -= 1;
    if (depth === 0) return text.slice(blockStart + 1, index);
  }

  assert.fail(`Missing block end for: ${marker}`);
}

test('updateInfo marks the sidebar stacking context while area info is open', () => {
  const updateInfoBlock = getBalancedBlock(source, 'updateInfo = function (space: any)');

  assert.match(
    updateInfoBlock,
    /document\.getElementById\(["']main-sidebar-left["']\)[\s\S]*?classList\.add\(["']area-info-open["']\)/
  );
});

test('hideInfo clears the area info stacking state', () => {
  const hideInfoBlock = getBalancedBlock(source, 'hideInfo = () =>');

  assert.match(
    hideInfoBlock,
    /document\.getElementById\(["']main-sidebar-left["']\)[\s\S]*?classList\.remove\(["']area-info-open["']\)/
  );
});

test('mobile area info state only raises the sidebar above bottom controls', () => {
  const mobileBlock = getBalancedBlock(responsiveCss, '@media (max-width: 768px)');
  const areaInfoRule = getBalancedBlock(mobileBlock, '#main-sidebar-left.area-info-open');
  const declarations = areaInfoRule.replace(/\/\*[\s\S]*?\*\//g, '').trim();
  const zIndexMatch = declarations.match(/^z-index:\s*(\d+)\s*!important;?$/);

  assert.ok(zIndexMatch, 'The mobile open-state rule must contain only a z-index declaration');
  assert.ok(Number(zIndexMatch[1]) > 2000, 'Open area info must stack above the bottom controls');
  assert.equal(
    responsiveCss.slice(0, responsiveCss.indexOf('@media (max-width: 768px)')).includes('#main-sidebar-left.area-info-open'),
    false,
    'The area info stacking override must remain mobile-only'
  );
});
