import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { tutorialSteps } from '../src/tutorial/tutorialSteps.js';

const source = readFileSync(new URL('../main/main-function/index.ts', import.meta.url), 'utf8');
const stylesCss = readFileSync(new URL('../main/css/styles.css', import.meta.url), 'utf8');
const responsiveCss = readFileSync(new URL('../main/css/responsive.css', import.meta.url), 'utf8');
const executableSource = source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:\\])\/\/.*$/gm, '$1');
const uncommentedStylesCss = stylesCss.replace(/\/\*[\s\S]*?\*\//g, '');
const uncommentedResponsiveCss = responsiveCss.replace(/\/\*[\s\S]*?\*\//g, '');

function extractBetween(text, startMarker, endMarker) {
  const startIndex = text.indexOf(startMarker);
  assert.notEqual(startIndex, -1, `Missing marker: ${startMarker}`);

  const endIndex = text.indexOf(endMarker, startIndex);
  assert.notEqual(endIndex, -1, `Missing marker after ${startMarker}: ${endMarker}`);

  return text.slice(startIndex, endIndex);
}

function getBalancedBlock(text, marker) {
  const markerIndex = text.indexOf(marker);
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

function getCssRuleBodies(css, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rulePattern = new RegExp(`^\\s*${escapedSelector}\\s*\\{([^{}]*)\\}`, 'gm');
  return [...css.matchAll(rulePattern)].map(match => match[1]);
}

function getNumericZIndex(css, selector) {
  const zIndexDeclarations = getCssRuleBodies(css, selector).flatMap(declarations =>
    [...declarations.matchAll(/(?:^|;)\s*z-index\s*:\s*([^;\s]+)\s*(?:!important)?\s*;?/gm)]
  );
  assert.ok(zIndexDeclarations.length > 0, `Missing ${selector} rule with z-index`);

  const effectiveValue = zIndexDeclarations.at(-1)[1];
  assert.match(effectiveValue, /^\d+$/, `${selector} effective z-index must be numeric`);
  return Number(effectiveValue);
}

test('user guide setup portals the existing modal to document.body exactly once', () => {
  const setup = extractBetween(
    executableSource,
    "const userGuideModal = document.getElementById('user-guide-modal')",
    'const getActiveGuideStep ='
  );

  assert.match(
    setup,
    /if\s*\(\s*userGuideModal\s*&&\s*userGuideModal\.parentElement\s*!==\s*document\.body\s*\)\s*\{\s*document\.body\.appendChild\(\s*userGuideModal\s*\);?\s*\}/,
    'User guide setup must append the existing modal to document.body with a null-safe idempotent guard'
  );
  assert.equal(
    [...setup.matchAll(/appendChild\(\s*userGuideModal\s*\)/g)].length,
    1,
    'User guide setup must append the modal exactly once'
  );
  assert.doesNotMatch(setup, /\bcloneNode\s*\(/, 'User guide setup must not clone the modal');
  assert.doesNotMatch(setup, /\bcreateElement\s*\(/, 'User guide setup must not recreate the modal');
  assert.doesNotMatch(setup, /\.innerHTML\s*=/, 'User guide setup must not replace innerHTML');
});

test('user guide stacks above mobile area and directions sidebar states', () => {
  const guideZIndex = getNumericZIndex(uncommentedStylesCss, '.user-guide-modal');
  const mobileBlock = getBalancedBlock(
    uncommentedResponsiveCss,
    '@media (max-width: 768px)'
  );
  const areaInfoZIndex = getNumericZIndex(
    mobileBlock,
    '#main-sidebar-left.area-info-open'
  );
  const directionsInfoZIndex = getNumericZIndex(
    mobileBlock,
    '#main-sidebar-left.directions-info-open'
  );

  for (const selector of [
    '#main-sidebar-left.area-info-open',
    '#main-sidebar-left.directions-info-open'
  ]) {
    assert.equal(
      getCssRuleBodies(uncommentedResponsiveCss, selector).length,
      getCssRuleBodies(mobileBlock, selector).length,
      `${selector} must remain scoped to the mobile media block`
    );
  }

  assert.ok(guideZIndex > 6500, 'User guide must stack above open control menus');
  assert.ok(guideZIndex > areaInfoZIndex, 'User guide must stack above open area information');
  assert.ok(
    guideZIndex > directionsInfoZIndex,
    'User guide must stack above open directions information'
  );
});

test('mobile floor and language tutorial step retains both control targets', () => {
  const mobileFloorLanguageStep = tutorialSteps.mobile.find(
    step => step.id === 'mobile-floor-language'
  );

  assert.ok(mobileFloorLanguageStep, 'Missing mobile-floor-language tutorial step');
  assert.deepEqual(mobileFloorLanguageStep.targetSelectors, [
    '#custom-floor-wrapper',
    '#custom-lang-wrapper'
  ]);
});
