import assert from 'node:assert/strict';
import postcss from 'postcss';

// Parse exact selectors and their enclosing media queries, independent of line endings.
export function parseCssRules(css) {
  const rules = [];
  postcss.parse(css).walkRules(rule => {
    const media = [];
    for (let parent = rule.parent; parent; parent = parent.parent) {
      if (parent.type === 'atrule' && parent.name === 'media') media.push(parent.params);
    }
    rules.push({
      selectors: rule.selectors,
      media,
      declarations: rule.nodes.filter(node => node.type === 'decl').map(node => ({
        property: node.prop, value: node.value, important: Boolean(node.important)
      }))
    });
  });
  return rules;
}

function matchesMedia(query, viewport) {
  return query.split(',').some(branch => branch.split(/\s+and\s+/).every(feature => {
    const match = feature.trim().match(/^\((min|max)-(width|height):\s*(\d+)px\)$/);
    assert.ok(match, `Unsupported media query in CSS contract: ${feature}`);
    const [, bound, dimension, pixels] = match;
    return bound === 'min' ? viewport[dimension] >= Number(pixels) : viewport[dimension] <= Number(pixels);
  }));
}

function specificity(selector) {
  // Contract callers supply matching simple selectors explicitly. This is not a DOM matcher.
  assert.doesNotMatch(selector, /:(?:has|is|not|where)\(/, 'Functional selectors require browser verification');
  return [
    (selector.match(/#[\w-]+/g) || []).length,
    (selector.match(/\.[\w-]+|(?<!:):(?!:)[\w-]+|\[[^\]]+\]/g) || []).length,
    (selector.match(/(?:^|[\s>+~])(?:[a-z][\w-]*)|::[\w-]+/gi) || []).length
  ];
}

// Resolve longhand declarations for an explicit set of selectors known to match
// one fixture element. Honor media, specificity, !important and source order.
// Shorthand expansion, inherited values and DOM matching are left to the browser.
export function cssDeclarations(rules, matchingSelectors, viewport = { width: 1440, height: 900 }) {
  const values = {};
  const priorities = {};
  for (const rule of rules) {
    for (const selector of rule.selectors.filter(value => matchingSelectors.includes(value))) {
      if (!rule.media.every(query => matchesMedia(query, viewport))) continue;
      const weight = specificity(selector);
      for (const declaration of rule.declarations) {
        const priority = [Number(declaration.important), ...weight];
        const previous = priorities[declaration.property];
        const difference = previous && priority.findIndex((value, index) => value !== previous[index]);
        if (previous && difference !== -1 && priority[difference] < previous[difference]) continue;
        priorities[declaration.property] = priority;
        values[declaration.property] = declaration.value;
      }
    }
  }
  return values;
}

export function cssRule(rules, selector, media = []) {
  const matches = rules.filter(rule => rule.selectors.includes(selector) &&
    rule.media.length === media.length && rule.media.every((query, index) => query === media[index]));
  assert.ok(matches.length, `Missing exact CSS rule: ${selector} within ${media.join(' / ') || 'global scope'}`);
  return matches.at(-1).declarations.map(({ property, value, important }) =>
    `${property}: ${value}${important ? ' !important' : ''};`).join('\n');
}
