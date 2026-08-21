import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const source = readFileSync(new URL('../main/main-function/index.ts', import.meta.url), 'utf8');
const responsiveCss = readFileSync(new URL('../main/css/responsive.css', import.meta.url), 'utf8');
const executableSource = source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:\\])\/\/.*$/gm, '$1');
const uncommentedResponsiveCss = responsiveCss.replace(/\/\*[\s\S]*?\*\//g, '');
const requestGenerationModuleUrl = new URL(
  '../src/navigation/wayfindingRequestGeneration.mjs',
  import.meta.url
);

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

test('directions info visibility is centralized with its stacking state', () => {
  const helperBlock = getBalancedBlock(
    executableSource,
    'const setDirectionsInfoPanelVisible = (isVisible: boolean) =>'
  );
  const clearNavigationBlock = getBalancedBlock(executableSource, 'const clearNavigation = () =>');
  const drawNavigationBlock = getBalancedBlock(executableSource, 'const drawNavigation = async () =>');
  const renderRouteNotFoundBlock = getBalancedBlock(
    drawNavigationBlock,
    'const renderRouteNotFoundState ='
  );
  const updateWayfindingUiBlock = getBalancedBlock(
    executableSource,
    'const updateWayfindingUI = () =>'
  );
  const emptyStateBlock = getBalancedBlock(
    updateWayfindingUiBlock,
    'if (emptyStateEl && instructionsContainer)'
  );
  const finalEmptyStateMarker = 'emptyStateEl.style.display = "flex"';
  const finalEmptyStateMarkerIndex = emptyStateBlock.indexOf(finalEmptyStateMarker);
  assert.notEqual(
    finalEmptyStateMarkerIndex,
    -1,
    'The final directions empty-state branch must show the empty state'
  );
  const finalEmptyStateElseIndex = emptyStateBlock.lastIndexOf(
    'else {',
    finalEmptyStateMarkerIndex
  );
  assert.notEqual(
    finalEmptyStateElseIndex,
    -1,
    'The final directions empty state must be handled by its own branch'
  );
  const finalEmptyStateBranch = getBalancedBlock(
    emptyStateBlock,
    'else {',
    finalEmptyStateElseIndex
  );
  const successfulSummaryDeclaration = drawNavigationBlock.lastIndexOf(
    'const summaryContainer = document.getElementById("wayfinding-summary-container")'
  );
  assert.notEqual(
    successfulSummaryDeclaration,
    -1,
    'Successful route rendering must declare its summary container inside drawNavigation'
  );
  const successfulSummaryBlock = getBalancedBlock(
    drawNavigationBlock,
    'if (summaryContainer)',
    successfulSummaryDeclaration
  );

  assert.match(
    helperBlock,
    /document\.getElementById\(["']main-sidebar-left["']\)[\s\S]*?classList\.toggle\(["']directions-info-open["'],\s*isVisible\)/
  );
  assert.match(
    clearNavigationBlock,
    /^\s*(?:try\s*\{\s*)?setDirectionsInfoPanelVisible\(false\)/
  );
  assert.match(renderRouteNotFoundBlock, /setDirectionsInfoPanelVisible\(false\)/);
  assert.match(finalEmptyStateBranch, /emptyStateEl\.style\.display\s*=\s*["']flex["']/);
  assert.match(finalEmptyStateBranch, /instructionsContainer\.style\.display\s*=\s*["']none["']/);
  assert.match(finalEmptyStateBranch, /setDirectionsInfoPanelVisible\(false\)/);
  assert.match(
    successfulSummaryBlock,
    /summaryContainer\.style\.display\s*=\s*["']block["'][\s;]*setDirectionsInfoPanelVisible\(shouldShowDirectionsInfoPanel\([\s\S]*?\)\)/,
    'Route success must account for the active tab before elevating the visible summary'
  );
});

test('mobile directions info state only raises the sidebar above every bottom control layer', () => {
  const mobileBlock = getBalancedBlock(uncommentedResponsiveCss, '@media (max-width: 768px)');
  const directionsInfoRule = getBalancedBlock(
    mobileBlock,
    '#main-sidebar-left.directions-info-open'
  );
  const declarations = directionsInfoRule.trim();
  const zIndexMatch = declarations.match(/^z-index:\s*(\d+)\s*!important;?$/);

  assert.ok(zIndexMatch, 'The mobile open-state rule must contain only a z-index declaration');
  assert.ok(Number(zIndexMatch[1]) > 6500, 'Open directions info must stack above open control menus');
  assert.equal(
    [...uncommentedResponsiveCss.matchAll(/#main-sidebar-left\.directions-info-open/g)].length,
    1,
    'The directions info stacking selector must occur only in its mobile media block'
  );
});

test('wayfinding request generations invalidate older route continuations', async () => {
  assert.ok(
    existsSync(requestGenerationModuleUrl),
    'Wayfinding needs a small independently testable request-generation guard'
  );
  const { createWayfindingRequestGeneration } = await import(requestGenerationModuleUrl.href);
  const requests = createWayfindingRequestGeneration();

  const firstGeneration = requests.invalidate();
  const firstRequest = requests.capture();
  const secondGeneration = requests.invalidate();
  const secondRequest = requests.capture();

  assert.ok(secondGeneration > firstGeneration, 'Generations must increase monotonically');
  assert.equal(requests.isCurrent(firstRequest), false, 'A newer request must stale the older request');
  assert.equal(requests.isCurrent(secondRequest), true, 'The newest request must remain current');

  requests.invalidate();
  assert.equal(requests.isCurrent(secondRequest), false, 'Clear/reset must stale the pending request');
});

test('directions info visibility requires both a visible summary and the active Directions tab', async () => {
  const lifecycle = await import(requestGenerationModuleUrl.href);
  assert.equal(
    typeof lifecycle.shouldShowDirectionsInfoPanel,
    'function',
    'The lifecycle helper must export the shared directions visibility decision'
  );

  assert.equal(
    lifecycle.shouldShowDirectionsInfoPanel(true, false),
    false,
    'A pending route completion must not elevate the sidebar while Search is active'
  );
  assert.equal(lifecycle.shouldShowDirectionsInfoPanel(false, true), false);
  assert.equal(lifecycle.shouldShowDirectionsInfoPanel(false, false), false);
  assert.equal(lifecycle.shouldShowDirectionsInfoPanel(true, true), true);
});

test('drawNavigation guards asynchronous route results with the current generation', () => {
  const clearNavigationBlock = getBalancedBlock(executableSource, 'const clearNavigation = () =>');
  const drawNavigationBlock = getBalancedBlock(executableSource, 'const drawNavigation = async () =>');
  const renderRouteNotFoundBlock = getBalancedBlock(
    drawNavigationBlock,
    'const renderRouteNotFoundState ='
  );
  const drawThenCommitBlock = getBalancedBlock(drawNavigationBlock, 'commit: () =>');
  const delayedCameraBlock = getBalancedBlock(drawNavigationBlock, 'setTimeout(async () =>');
  const previewRequestIndex = drawNavigationBlock.indexOf(
    'const previewDirections = await mapData.getDirections'
  );
  const previewCatchIndex = drawNavigationBlock.indexOf('catch { }', previewRequestIndex);

  assert.match(clearNavigationBlock, /wayfindingRequestGeneration\.invalidate\(\)/);
  assert.match(
    drawNavigationBlock,
    /clearNavigation\(\);\s*const requestGeneration = wayfindingRequestGeneration\.capture\(\);\s*const isCurrentWayfindingRequest = \(\) => wayfindingRequestGeneration\.isCurrent\(requestGeneration\)/,
    'drawNavigation must capture its generation after its initial clear'
  );
  assert.match(
    renderRouteNotFoundBlock,
    /^\s*if \(!isCurrentWayfindingRequest\(\)\) return;/,
    'A stale failure must not clear newer route state'
  );
  assert.match(drawThenCommitBlock, /if \(!isCurrentWayfindingRequest\(\)\) return;/);
  assert.match(delayedCameraBlock, /if \(!isCurrentWayfindingRequest\(\)\) return;/);
  assert.notEqual(previewRequestIndex, -1, 'The optional preview request must be located');
  assert.notEqual(previewCatchIndex, -1, 'The optional preview rejection handler must be located');
  assert.match(
    drawNavigationBlock.slice(previewCatchIndex + 'catch { }'.length),
    /^\s*if \(!isCurrentWayfindingRequest\(\)\) return;/,
    'A rejected stale preview must stop before starting another route request'
  );
  assert.ok(
    [...drawNavigationBlock.matchAll(/if \(!isCurrentWayfindingRequest\(\)\) return;/g)].length >= 6,
    'Every async route-calculation stage and delayed result mutation must reject stale work'
  );
});

test('tab switches synchronize directions stacking with the visible route summary', () => {
  const switchTabBlock = getBalancedBlock(executableSource, "const switchTab = (tab: 'search' | 'directions') =>");
  const searchBranch = getBalancedBlock(switchTabBlock, "if (tab === 'search')");
  const directionsBranch = getBalancedBlock(
    switchTabBlock,
    'else {',
    switchTabBlock.indexOf(searchBranch) + searchBranch.length
  );

  assert.match(searchBranch, /setDirectionsInfoPanelVisible\(false\)/);
  assert.match(
    directionsBranch,
    /updateWayfindingUI\(\)[\s\S]*?wayfinding-summary-container[\s\S]*?setDirectionsInfoPanelVisible\(shouldShowDirectionsInfoPanel\([\s\S]*?\)\)/,
    'Directions may regain elevated stacking only when its route summary is displayed'
  );
});
