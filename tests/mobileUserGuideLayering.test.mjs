import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { tutorialSteps } from '../src/tutorial/tutorialSteps.js';

const source = readFileSync(new URL('../main/main-function/index.ts', import.meta.url), 'utf8');
const html = readFileSync(new URL('../main/html/index.html', import.meta.url), 'utf8');
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

function getBalancedHtmlElement(documentHtml, id) {
  const voidElements = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
    'param', 'source', 'track', 'wbr'
  ]);
  const tokenPattern = /<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>|<![^>]*>|<\/?[a-z][^>]*>/gi;
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const idPattern = new RegExp(`(?:^|\\s)id\\s*=\\s*(["'])${escapedId}\\1`, 'i');
  const stack = [];
  let target = null;

  for (const match of documentHtml.matchAll(tokenPattern)) {
    const token = match[0];
    if (/^<!--|^<!|^<script\b|^<style\b/i.test(token)) continue;
    const closingMatch = token.match(/^<\/\s*([a-z][\w:-]*)/i);
    if (closingMatch) {
      const tagName = closingMatch[1].toLowerCase();
      const openIndex = stack.map(entry => entry.tagName).lastIndexOf(tagName);
      assert.notEqual(openIndex, -1, `Unexpected closing tag: ${token}`);
      const closed = stack.splice(openIndex);
      if (closed.includes(target)) return documentHtml.slice(target.start, match.index + token.length);
      continue;
    }
    const openingMatch = token.match(/^<\s*([a-z][\w:-]*)/i);
    if (!openingMatch) continue;
    const tagName = openingMatch[1].toLowerCase();
    const entry = { tagName, start: match.index };
    if (idPattern.test(token)) target = entry;
    if (/\/\s*>$/.test(token) || voidElements.has(tagName)) {
      if (entry === target) return token;
    } else {
      stack.push(entry);
    }
  }
  assert.fail(`Missing balanced HTML element: #${id}`);
}

function normalizeCssText(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function findCssToken(css, token, startIndex, endIndex = css.length) {
  let quote = null;
  for (let index = startIndex; index < endIndex; index += 1) {
    const char = css[index];
    if (quote) {
      if (char === '\\') index += 1;
      else if (char === quote) quote = null;
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === token) {
      return index;
    }
  }
  return -1;
}

function findCssBlockEnd(css, blockStart, endIndex = css.length) {
  let depth = 0;
  let quote = null;
  for (let index = blockStart; index < endIndex; index += 1) {
    const char = css[index];
    if (quote) {
      if (char === '\\') index += 1;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") quote = char;
    else if (char === '{') depth += 1;
    else if (char === '}' && --depth === 0) return index;
  }
  assert.fail('Missing CSS block end');
}

function getCssBlockRange(css, marker, fromIndex = 0) {
  const markerIndex = css.indexOf(marker, fromIndex);
  assert.notEqual(markerIndex, -1, `Missing marker: ${marker}`);
  const blockStart = findCssToken(css, '{', markerIndex);
  assert.notEqual(blockStart, -1, `Missing block start for: ${marker}`);
  const blockEnd = findCssBlockEnd(css, blockStart);
  return { markerIndex, blockStart, contentStart: blockStart + 1, blockEnd };
}

function parseCssRules(css, startIndex = 0, endIndex = css.length, scopes = []) {
  const rules = [];
  let cursor = startIndex;
  while (cursor < endIndex) {
    const blockStart = findCssToken(css, '{', cursor, endIndex);
    if (blockStart === -1) break;
    const blockEnd = findCssBlockEnd(css, blockStart, endIndex);
    const rawPrelude = css.slice(cursor, blockStart);
    const preludeOffset = rawPrelude.lastIndexOf(';') + 1;
    const prelude = normalizeCssText(rawPrelude.slice(preludeOffset));
    const preludeStart = cursor + preludeOffset + rawPrelude.slice(preludeOffset).search(/\S/);

    if (prelude.startsWith('@')) {
      rules.push(...parseCssRules(css, blockStart + 1, blockEnd, [...scopes, prelude]));
    } else if (prelude) {
      rules.push({
        selectors: prelude.split(',').map(normalizeCssText),
        body: css.slice(blockStart + 1, blockEnd),
        start: preludeStart,
        scopes
      });
    }
    cursor = blockEnd + 1;
  }
  return rules;
}

function getCssDeclarations(body, property) {
  const declarations = [];
  const pattern = /(?:^|;)\s*([\w-]+)\s*:\s*([^;{}]+)\s*(?:;|$)/gm;
  for (const match of body.matchAll(pattern)) {
    if (match[1] !== property) continue;
    const important = /\s*!important\s*$/i.test(match[2]);
    declarations.push({ value: match[2].replace(/\s*!important\s*$/i, '').trim(), important });
  }
  return declarations;
}

function getEffectiveCssValue(rules, selector, property) {
  const normalizedSelector = normalizeCssText(selector);
  let effective = null;
  for (const rule of rules) {
    if (!rule.selectors.includes(normalizedSelector)) continue;
    for (const declaration of getCssDeclarations(rule.body, property)) {
      if (!effective || declaration.important || !effective.important) effective = declaration;
    }
  }
  assert.ok(effective, `Missing ${selector} rule with ${property}`);
  return effective.value;
}

function getNumericZIndex(rules, selector) {
  const effectiveValue = getEffectiveCssValue(rules, selector, 'z-index');
  assert.match(effectiveValue, /^\d+$/, `${selector} effective z-index must be numeric`);
  return Number(effectiveValue);
}

test('user guide modal remains nested inside main content', () => {
  const mainContent = getBalancedHtmlElement(html, 'main-content');
  const userGuideModal = getBalancedHtmlElement(mainContent, 'user-guide-modal');
  assert.match(userGuideModal, /^<[^>]+\sid=["']user-guide-modal["']/i);
});

test('user guide setup does not portal the modal to document.body', () => {
  const setup = extractBetween(
    executableSource,
    "const userGuideModal = document.getElementById('user-guide-modal')",
    'const getActiveGuideStep ='
  );
  assert.doesNotMatch(
    setup,
    /document\.body\.appendChild\(\s*userGuideModal\s*\)/,
    'User guide setup must leave the modal under #main-content'
  );
});

test('user guide lifecycle imports the production tutorial tab session helpers', () => {
  assert.match(
    executableSource,
    /import\s*\{[^}]*\bbeginTutorialTabSession\b[^}]*\bcloseTutorialTabSession\b[^}]*\}\s*from\s*["']\.\.\/\.\.\/src\/tutorial\/tutorialTabState\.js["']/,
    'The guide lifecycle must use the shared tutorial tab session helpers'
  );
});

test('renderUserGuideStep synchronizes the mobile floor-language control state before an empty-step return', () => {
  const renderStep = getBalancedBlock(executableSource, 'const renderUserGuideStep =');
  const stepLookupIndex = renderStep.indexOf('const step = getActiveGuideStep()');
  const emptyStepReturnIndex = renderStep.search(/if\s*\(\s*!step\s*\)\s*return/);
  const toggleMatch = renderStep.match(
    /document\.body\.classList\.toggle\(\s*['"]user-guide-controls-step['"]\s*,\s*Boolean\(\s*step\s*&&\s*window\.innerWidth\s*<=\s*768\s*&&\s*step\.id\s*===\s*['"]mobile-floor-language['"]\s*\)\s*\)/
  );
  assert.notEqual(stepLookupIndex, -1, 'renderUserGuideStep must read the active step');
  assert.ok(toggleMatch, 'renderUserGuideStep must toggle the control state only for the active mobile floor-language step');
  assert.notEqual(emptyStepReturnIndex, -1, 'renderUserGuideStep must keep its empty-step guard');
  assert.ok(
    toggleMatch.index > stepLookupIndex && toggleMatch.index < emptyStepReturnIndex,
    'The control state must be synchronized before returning so stale state is cleared'
  );
});

test('closeUserGuide restores a mobile entry tab before releasing and clearing guide session state', () => {
  const closeGuide = getBalancedBlock(executableSource, 'const closeUserGuide =');
  const releaseGuideState = getBalancedBlock(closeGuide, 'const releaseGuideState =');
  assert.match(
    closeGuide,
    /closeTutorialTabSession\(\s*document\s*,\s*guideTabSession\s*,\s*releaseGuideState\s*,\s*restoreDesktopSearch\s*\)/,
    'Closing must consume the captured session through the runtime lifecycle helper'
  );
  assert.match(releaseGuideState, /guideTabSession\s*=\s*null/);
  for (const className of ['user-guide-open', 'user-guide-controls-step']) {
    assert.match(
      releaseGuideState,
      new RegExp(`document\\.body\\.classList\\.remove\\(\\s*['"]${className}['"]\\s*\\)`),
      `The guide release callback must remove ${className}`
    );
  }
});

test('closeUserGuide retains desktop Search cleanup before releasing guide state', () => {
  const closeGuide = getBalancedBlock(executableSource, 'const closeUserGuide =');
  const restoreDesktopSearch = getBalancedBlock(closeGuide, 'const restoreDesktopSearch =');
  assert.match(
    restoreDesktopSearch,
    /getElementById\(\s*['"]tab-search['"]\s*\)[\s\S]*?getElementById\(\s*['"]tab-directions['"]\s*\)[\s\S]*?searchTabEl\.click\(\)/,
    'Desktop session restoration must continue returning an active Directions tab to Search'
  );
  assert.doesNotMatch(closeGuide, /window\.innerWidth/, 'Close behavior must use the session mode captured at open, not close-time width');
});

test('openUserGuide guards empty steps then captures mobile entry state before rendering', () => {
  const openGuide = getBalancedBlock(executableSource, 'const openUserGuide =');
  const visibleModalGuardIndex = openGuide.search(
    /if\s*\(\s*!userGuideModal\s*\|\|\s*!userGuideModal\.classList\.contains\(\s*['"]hidden['"]\s*\)\s*\)\s*return/
  );
  const emptyStepsGuardIndex = openGuide.search(/if\s*\(\s*activeGuideSteps\.length\s*===\s*0\s*\)\s*return/);
  const captureIndex = openGuide.search(
    /guideTabSession\s*=\s*beginTutorialTabSession\(\s*document\s*,\s*window\.innerWidth\s*<=\s*768\s*,\s*guideTabSession\s*\)/
  );
  const revealIndex = openGuide.search(/userGuideModal\.classList\.remove\(\s*['"]hidden['"]\s*\)/);
  const openStateIndex = openGuide.search(/document\.body\.classList\.add\(\s*['"]user-guide-open['"]\s*\)/);
  const renderIndex = openGuide.search(/renderUserGuideStep\(\s*\)/);
  assert.notEqual(visibleModalGuardIndex, -1, 'openUserGuide must ignore repeated opens while the modal is visible');
  assert.notEqual(emptyStepsGuardIndex, -1, 'openUserGuide must guard an empty step list');
  assert.notEqual(captureIndex, -1, 'openUserGuide must begin one session with its open-time device mode');
  assert.notEqual(revealIndex, -1, 'openUserGuide must reveal the modal for non-empty guides');
  assert.notEqual(openStateIndex, -1, 'openUserGuide must add the open body state');
  assert.notEqual(renderIndex, -1, 'openUserGuide must render the first step');
  assert.ok(
    visibleModalGuardIndex < emptyStepsGuardIndex && emptyStepsGuardIndex < captureIndex && captureIndex < revealIndex &&
      revealIndex < openStateIndex && openStateIndex < renderIndex,
    'The visible/empty guards must precede session capture and modal state; capture must happen before the first render can switch tabs'
  );
});

test('every guide completion or dismissal path delegates to closeUserGuide', () => {
  assert.match(executableSource, /userGuideClose\?\.addEventListener\(\s*['"]click['"]\s*,\s*\(\)\s*=>\s*closeUserGuide\(\s*false\s*\)\s*\)/);
  assert.match(executableSource, /userGuideDone\?\.addEventListener\(\s*['"]click['"]\s*,\s*\(\)\s*=>\s*closeUserGuide\(\s*true\s*\)\s*\)/);
  assert.match(executableSource, /if\s*\(\s*event\.target\s*===\s*userGuideModal\s*\)\s*closeUserGuide\(\s*false\s*\)/);
  assert.match(executableSource, /if\s*\(\s*event\.key\s*===\s*['"]Escape['"]\s*\)\s*closeUserGuide\(\s*false\s*\)/);
});

test('mobile guide state disables both controls and reveals them below the modal only for the controls step', () => {
  const guideStylesStart = uncommentedStylesCss.indexOf('body.user-guide-open {');
  assert.notEqual(guideStylesStart, -1, 'Missing user guide body state styles');
  const mobileGuideRange = getCssBlockRange(
    uncommentedStylesCss,
    '@media (max-width: 768px)',
    guideStylesStart
  );
  const allStyleRules = parseCssRules(uncommentedStylesCss);
  const mobileGuideRules = allStyleRules.filter(
    rule => rule.start > mobileGuideRange.blockStart && rule.start < mobileGuideRange.blockEnd
  );
  const mobileApplicableRules = allStyleRules.filter(rule => rule.scopes.every(scope => {
    if (!normalizeCssText(scope).startsWith('@media')) return true;
    return normalizeCssText(scope) === '@media (max-width: 768px)';
  }));
  const guideZIndex = getNumericZIndex(mobileApplicableRules, '.user-guide-modal');
  const controls = ['#custom-floor-wrapper', '#custom-lang-wrapper'];

  for (const control of controls) {
    const contracts = [
      [`body.user-guide-open ${control}`, 'pointer-events', 'none'],
      [`body.user-guide-open:not(.user-guide-controls-step) ${control}`, 'visibility', 'hidden'],
      [`body.user-guide-open.user-guide-controls-step ${control}`, 'visibility', 'visible']
    ];
    for (const [selector, property, expectedValue] of contracts) {
      const stylesheetOccurrences = allStyleRules.filter(rule => rule.selectors.includes(selector));
      const intendedMobileOccurrences = mobileGuideRules.filter(rule => rule.selectors.includes(selector));
      assert.ok(intendedMobileOccurrences.length > 0, `Missing CSS selector in guide mobile block: ${selector}`);
      assert.equal(
        stylesheetOccurrences.length,
        intendedMobileOccurrences.length,
        `${selector} must occur only inside the intended guide mobile block`
      );
      assert.equal(
        getEffectiveCssValue(intendedMobileOccurrences, selector, property),
        expectedValue,
        `${selector} effective ${property} must be ${expectedValue}`
      );
    }
    const visibleSelector = `body.user-guide-open.user-guide-controls-step ${control}`;
    const visibleRules = mobileGuideRules.filter(rule => rule.selectors.includes(visibleSelector));
    const controlZIndex = getNumericZIndex(visibleRules, visibleSelector);
    assert.ok(controlZIndex < guideZIndex, `${control} must remain below the guide modal`);
  }
  assert.equal(guideZIndex, 9000, 'The guide modal effective z-index contract must remain 9000');
});

test('user guide stacks above mobile area and directions sidebar states', () => {
  const styleRules = parseCssRules(uncommentedStylesCss);
  const mobileApplicableStyleRules = styleRules.filter(rule => rule.scopes.every(scope => {
    if (!normalizeCssText(scope).startsWith('@media')) return true;
    return normalizeCssText(scope) === '@media (max-width: 768px)';
  }));
  const guideZIndex = getNumericZIndex(mobileApplicableStyleRules, '.user-guide-modal');
  const mobileRange = getCssBlockRange(uncommentedResponsiveCss, '@media (max-width: 768px)');
  const responsiveRules = parseCssRules(uncommentedResponsiveCss);
  const mobileRules = responsiveRules.filter(
    rule => rule.start > mobileRange.blockStart && rule.start < mobileRange.blockEnd
  );
  const areaInfoZIndex = getNumericZIndex(mobileRules, '#main-sidebar-left.area-info-open');
  const directionsInfoZIndex = getNumericZIndex(mobileRules, '#main-sidebar-left.directions-info-open');
  for (const selector of ['#main-sidebar-left.area-info-open', '#main-sidebar-left.directions-info-open']) {
    assert.equal(
      responsiveRules.filter(rule => rule.selectors.includes(selector)).length,
      mobileRules.filter(rule => rule.selectors.includes(selector)).length,
      `${selector} must remain scoped to the mobile media block`
    );
  }
  assert.ok(guideZIndex > 6500, 'User guide must stack above open control menus');
  assert.ok(guideZIndex > areaInfoZIndex, 'User guide must stack above open area information');
  assert.ok(guideZIndex > directionsInfoZIndex, 'User guide must stack above open directions information');
});

test('mobile floor and language tutorial step retains both control targets', () => {
  const mobileFloorLanguageStep = tutorialSteps.mobile.find(step => step.id === 'mobile-floor-language');
  assert.ok(mobileFloorLanguageStep, 'Missing mobile-floor-language tutorial step');
  assert.deepEqual(mobileFloorLanguageStep.targetSelectors, [
    '#custom-floor-wrapper',
    '#custom-lang-wrapper'
  ]);
});
