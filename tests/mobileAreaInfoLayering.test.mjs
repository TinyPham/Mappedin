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

test('area info visibility is centralized with its stacking state', () => {
  const helperBlock = getBalancedBlock(
    source,
    'const setAreaInfoPanelVisible = (isVisible: boolean) =>'
  );
  const updateInfoBlock = getBalancedBlock(source, 'updateInfo = function (space: any)');
  const hideInfoBlock = getBalancedBlock(source, 'hideInfo = () =>');
  const performSearchBlock = getBalancedBlock(source, 'const performSearch = async (query: string) =>');
  const drawNavigationBlock = getBalancedBlock(source, 'const drawNavigation = async () =>');
  const clearNodeBlock = getBalancedBlock(source, '(window as any).clearNode =');
  const updateWayfindingUiBlock = getBalancedBlock(source, 'const updateWayfindingUI = () =>');
  const executableSource = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  assert.match(
    helperBlock,
    /document\.getElementById\(["']sidebar-info-panel["']\)[\s\S]*?style\.display\s*=\s*isVisible\s*\?\s*["']flex["']\s*:\s*["']none["']/
  );
  assert.match(
    helperBlock,
    /document\.getElementById\(["']main-sidebar-left["']\)[\s\S]*?classList\.toggle\(["']area-info-open["'],\s*isVisible\)/
  );
  assert.match(updateInfoBlock, /setAreaInfoPanelVisible\(true\)/);
  assert.match(hideInfoBlock, /setAreaInfoPanelVisible\(false\)/);
  assert.match(performSearchBlock, /setAreaInfoPanelVisible\(false\)/);
  assert.equal(
    [...drawNavigationBlock.matchAll(/setAreaInfoPanelVisible\(false\)/g)].length,
    2,
    'Both successful and unsuccessful route transitions must clear the area info layer'
  );
  assert.match(clearNodeBlock, /setAreaInfoPanelVisible\(false\)/);
  assert.match(updateWayfindingUiBlock, /setAreaInfoPanelVisible\(false\)/);
  assert.equal(
    [...executableSource.matchAll(/document\.getElementById\(["']sidebar-info-panel["']\)/g)].length,
    1,
    'Every area info show/hide transition must go through the visibility helper'
  );
});

test('mobile area info state only raises the sidebar above every bottom control layer', () => {
  const mobileBlock = getBalancedBlock(responsiveCss, '@media (max-width: 768px)');
  const areaInfoRule = getBalancedBlock(mobileBlock, '#main-sidebar-left.area-info-open');
  const declarations = areaInfoRule.replace(/\/\*[\s\S]*?\*\//g, '').trim();
  const zIndexMatch = declarations.match(/^z-index:\s*(\d+)\s*!important;?$/);

  assert.ok(zIndexMatch, 'The mobile open-state rule must contain only a z-index declaration');
  assert.ok(Number(zIndexMatch[1]) > 6500, 'Open area info must stack above open control menus');
  assert.equal(
    [...responsiveCss.matchAll(/#main-sidebar-left\.area-info-open/g)].length,
    1,
    'The area info stacking selector must occur only in its mobile media block'
  );
});
