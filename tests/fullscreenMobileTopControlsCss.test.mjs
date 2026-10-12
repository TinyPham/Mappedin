import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cssDeclarations, parseCssRules } from './helpers/cssRules.mjs';

const rules = parseCssRules(readFileSync(new URL('../main/css/styles.css', import.meta.url), 'utf8'));

for (const fullscreen of [':fullscreen', ':-webkit-full-screen']) {
  test(fullscreen + ' mobile settings keep theme and brightness stacked below the search header', () => {
    for (const width of [320, 390, 768]) {
      const viewport = { width, height: 844 };
      const panel = cssDeclarations(rules, ['#desktop-map-settings-panel', '#desktop-map-settings-panel.open',
        fullscreen + ' #desktop-map-settings-panel',
        '#main-sidebar-left.sidebar-collapsed ~ #main-content #desktop-map-settings-panel'
      ], viewport);
      assert.equal(panel.position, 'fixed');
      assert.equal(panel.top, 'calc(126px + env(safe-area-inset-top, 0px))');
      assert.equal(panel.left, '8px');
      assert.equal(panel.right, '8px');
      assert.equal(panel['flex-direction'], 'column');
      assert.equal(panel.gap, '8px');
      assert.equal(panel.visibility, 'visible');
      assert.equal(panel.transform, 'none');
      for (const control of ['brightness', 'theme']) {
        const wrapper = cssDeclarations(rules, ['.' + control + '-selector-wrapper', '#' + control + '-selector-wrapper',
          fullscreen + ' #' + control + '-selector-wrapper', fullscreen + ' .' + control + '-selector-wrapper',
          '#desktop-map-settings-panel .' + control + '-selector-wrapper'
        ], viewport);
        assert.equal(wrapper.position, 'static', control + ' remains in the settings panel');
        assert.equal(wrapper.top, 'auto', control + ' must not inherit the obsolete fullscreen offset');
        assert.equal(wrapper.bottom, 'auto');
        assert.equal(wrapper.left, 'auto');
        assert.equal(wrapper.width, '100%');
      }
      const menu = cssDeclarations(rules, ['.theme-selector-menu',
        '#desktop-map-settings-panel .theme-selector-menu', fullscreen + ' .theme-selector-menu'
      ], viewport);
      assert.equal(menu.position, 'fixed');
      assert.equal(menu.top, 'calc(190px + env(safe-area-inset-top, 0px))');
      assert.equal(menu['max-height'], 'calc(100dvh - 205px)');
    }
  });
}
