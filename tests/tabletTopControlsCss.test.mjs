import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cssDeclarations, cssRule, parseCssRules } from './helpers/cssRules.mjs';

const rules = parseCssRules(readFileSync(new URL('../main/css/styles.css', import.meta.url), 'utf8'));

for (const [label, widths, right, gap, floorHeight, themePadding, themeFont, themeGap] of [
  ['wide', [993, 1024, 1199], '12px', '10px', '44px', '0 12px', '13px', '6px'],
  ['upper boundary', [1200], '12px', '10px', '40px', '0 12px', '13px', '6px'],
  ['narrow', [901, 992], '8px', '6px', '44px', '0 9px', '12px', '4px'],
  ['iPad Air', [769, 820, 900], '6px', '4px', '32px', '0 7px', '10px', '3px']
]) {
  test(label + ' tablet controls retain compact top controls and stacked settings', () => {
    for (const width of widths) {
      const viewport = { width, height: 900 };
      const panel = cssDeclarations(rules, ['#desktop-map-settings-panel'], viewport);
      assert.equal(panel.left, '340px');
      assert.equal(panel['flex-direction'], 'column');
      assert.equal(panel.width, '310px');
      for (const control of ['theme', 'brightness']) {
        const wrapper = cssDeclarations(rules, ['.' + control + '-selector-wrapper',
          '#desktop-map-settings-panel .' + control + '-selector-wrapper'
        ], viewport);
        assert.equal(wrapper.position, 'static');
        assert.equal(wrapper.left, 'auto');
        assert.equal(wrapper.top, 'auto');
        assert.equal(wrapper.width, '100%');
        const toggleSelector = control === 'theme' ? '.theme-selector-toggle' : '.brightness-toggle';
        const toggle = cssDeclarations(rules, [toggleSelector, '#desktop-map-settings-panel ' + toggleSelector], viewport);
        assert.equal(toggle.height, '40px');
        assert.equal(toggle['min-height'], '40px');
        assert.equal(toggle['box-sizing'], 'border-box');
        assert.equal(toggle.padding, control === 'theme' ? themePadding : '0 10px');
        assert.equal(toggle.gap, control === 'theme' ? themeGap : '6px');
        if (control === 'theme') assert.equal(toggle['font-size'], themeFont);
      }
      const topControls = cssDeclarations(rules, ['#map-top-controls'], viewport);
      assert.equal(topControls.top, '20px');
      assert.equal(topControls.right, right);
      assert.equal(topControls.gap, gap);
      const dropdown = cssDeclarations(rules, ['.pro-dropdown-toggle'], viewport);
      assert.equal(dropdown.height, floorHeight);
      assert.equal(dropdown['min-height'], floorHeight);
      const slider = cssDeclarations(rules, ['#brightness-slider', '#desktop-map-settings-panel #brightness-slider'], viewport);
      assert.equal(slider.flex, '1');
      assert.equal(slider['min-width'], '80px');
      assert.equal(slider.width, '58px', 'The compact basis remains below the panel minimum width');
    }
  });
}

test('iPad Air category labels retain readable compact typography', () => {
  const label = cssRule(rules, '.category-label-box', ['(min-width: 769px) and (max-width: 900px)']);
  assert.ok(label.includes('font-size: 12px !important;'));
  assert.ok(label.includes('padding: 7px 9px !important;'));
});
