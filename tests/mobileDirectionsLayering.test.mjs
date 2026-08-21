import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../main/main-function/index.ts', import.meta.url), 'utf8');
const responsiveCss = readFileSync(new URL('../main/css/responsive.css', import.meta.url), 'utf8');
const executableSource = source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:\\])\/\/.*$/gm, '$1');
const uncommentedResponsiveCss = responsiveCss.replace(/\/\*[\s\S]*?\*\//g, '');

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
  const setterBlock = getBalancedBlock(
    executableSource,
    'const setDirectionsInfoPanelVisible = (isVisible: boolean) =>'
  );
  const syncBlock = getBalancedBlock(
    executableSource,
    'const syncDirectionsInfoPanelVisibility = () =>'
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
    setterBlock,
    /document\.getElementById\(["']main-sidebar-left["']\)[\s\S]*?classList\.toggle\(["']directions-info-open["'],\s*isVisible\)/
  );
  assert.match(
    syncBlock,
    /document\.getElementById\(["']wayfinding-summary-container["']\)/
  );
  assert.match(syncBlock, /document\.getElementById\(["']tab-directions["']\)/);
  assert.match(
    syncBlock,
    /setDirectionsInfoPanelVisible\([\s\S]*?summaryContainer\?\.style\.display === ["']block["'][\s\S]*?&&[\s\S]*?directionsTab\?\.classList\.contains\(["']active["']\) === true[\s\S]*?\)/,
    'The sync helper must reflect both actual summary visibility and active Directions tab state'
  );
  assert.equal(
    [...executableSource.matchAll(/setDirectionsInfoPanelVisible\(/g)].length,
    1,
    'Only the centralized DOM sync helper may set directions stacking state'
  );
  assert.match(
    clearNavigationBlock,
    /summaryContainer\.style\.display\s*=\s*["']none["'];[\s}]*syncDirectionsInfoPanelVisibility\(\)/
  );
  assert.match(
    renderRouteNotFoundBlock,
    /summaryContainer\) summaryContainer\.style\.display\s*=\s*["']none["'];[\s\S]*?syncDirectionsInfoPanelVisibility\(\)/
  );
  assert.match(finalEmptyStateBranch, /emptyStateEl\.style\.display\s*=\s*["']flex["']/);
  assert.match(finalEmptyStateBranch, /instructionsContainer\.style\.display\s*=\s*["']none["']/);
  assert.match(
    finalEmptyStateBranch,
    /summaryContainer\.style\.display\s*=\s*["']none["'][\s;]*syncDirectionsInfoPanelVisibility\(\)/
  );
  assert.match(
    successfulSummaryBlock,
    /summaryContainer\.style\.display\s*=\s*["']block["'][\s;]*syncDirectionsInfoPanelVisibility\(\)/,
    'Route success must sync actual DOM visibility immediately after showing the summary'
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

test('tab switches synchronize directions stacking with the visible route summary', () => {
  const switchTabBlock = getBalancedBlock(executableSource, "const switchTab = (tab: 'search' | 'directions') =>");
  const searchBranch = getBalancedBlock(switchTabBlock, "if (tab === 'search')");
  const directionsBranch = getBalancedBlock(
    switchTabBlock,
    'else {',
    switchTabBlock.indexOf(searchBranch) + searchBranch.length
  );

  assert.match(
    searchBranch,
    /tabDirections\?\.classList\.remove\(["']active["']\)[\s\S]*?directionsTabContent\) directionsTabContent\.style\.display = ["']none["'][\s\S]*?syncDirectionsInfoPanelVisibility\(\)/,
    'Search must sync after deactivating and hiding Directions'
  );
  assert.match(
    directionsBranch,
    /tabDirections\?\.classList\.add\(["']active["']\)[\s\S]*?directionsTabContent\) directionsTabContent\.style\.display = ["']block["'][\s\S]*?updateWayfindingUI\(\)[\s;]*syncDirectionsInfoPanelVisibility\(\)/,
    'Directions must sync after activating the tab and updating summary visibility'
  );
});
