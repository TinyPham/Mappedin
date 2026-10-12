import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCssRules, cssDeclarations, cssRule } from './cssRules.mjs';

test('CSS contracts ignore comments, select exact grouped selectors and accept CRLF or LF', () => {
  for (const newline of ['\n', '\r\n']) {
    const rules = parseCssRules([
      '/* .toggle { height: 99px; } */',
      '.toggle.open { height: 60px; }',
      '@media (max-width: 768px) {',
      '  .toggle, .other { height: 40px; }',
      '}',
      '.toggle span { height: 10px; }'
    ].join(newline));
    assert.equal(cssRule(rules, '.toggle', ['(max-width: 768px)']), 'height: 40px;');
    assert.equal(cssDeclarations(rules, ['.toggle'], { width: 390, height: 844 }).height, '40px');
    assert.throws(() => cssRule(rules, '.missing'), /Missing exact CSS rule/);
    assert.throws(() => cssRule(rules, '.toggle'), /Missing exact CSS rule/);
  }
});

test('CSS contracts honor importance, specificity and later declarations', () => {
  const rules = parseCssRules(`
    #panel .toggle { height: 40px !important; width: 100%; gap: 6px; }
    .toggle { height: 32px !important; width: 50% !important; }
    #panel .toggle { gap: 8px; }
  `);
  assert.deepEqual(cssDeclarations(rules, ['.toggle', '#panel .toggle']), {
    height: '40px', width: '50%', gap: '8px'
  });
});

test('CSS contracts evaluate nested media and inclusive width and height boundaries', () => {
  const rules = parseCssRules(`
    .toggle { height: 44px; }
    @media (min-width: 769px) {
      @media (max-width: 1200px) and (max-height: 650px) {
        .toggle { height: 32px; }
      }
    }
  `);
  for (const [width, height, expected] of [[768, 650, '44px'], [769, 650, '32px'],
    [1200, 650, '32px'], [1201, 650, '44px'], [769, 651, '44px']]) {
    assert.equal(cssDeclarations(rules, ['.toggle'], { width, height }).height, expected);
  }
});
