import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../index.ts', import.meta.url), 'utf8');

test('desktop tutorial can render an arrow for each visible target', () => {
  assert.match(source, /const renderUserGuideArrows\s*=\s*\(targetRects:\s*DOMRect\[\]\)/);
  assert.match(source, /data-guide-arrow-extra/);
  assert.match(source, /renderUserGuideArrows\(window\.innerWidth > 768 \? rects : \[rects\[0\]\]\)/);
});

test('desktop flight toolbar arrow starts from the right guide panel midpoint', () => {
  assert.match(source, /isDesktopFlightRightToolbarTarget/);
  assert.match(source, /step\?\.id === 'desktop-flight-info'/);
  assert.match(source, /const arrowStart = getGuidePanelArrowStart\(panelRect, targetX, targetY\)/);
  assert.match(source, /const startX = arrowStart\.x/);
  assert.match(source, /const startY = arrowStart\.y/);
  assert.match(source, /return \{ x: panelRect\.right, y: panelCenterY \}/);
});

test('tutorial arrows always start from the midpoint of one guide panel edge', () => {
  assert.match(source, /const getGuidePanelArrowStart = \(panelRect: DOMRect, targetX: number, targetY: number\)/);
  assert.match(source, /return \{ x: panelCenterX, y: panelRect\.top \}/);
  assert.match(source, /return \{ x: panelCenterX, y: panelRect\.bottom \}/);
  assert.match(source, /return \{ x: panelRect\.right, y: panelCenterY \}/);
  assert.match(source, /return \{ x: panelRect\.left, y: panelCenterY \}/);
});

test('desktop flight toolbar arrow keeps a straight segment at the guide panel origin', () => {
  assert.match(source, /flightToolbarStraightX = startX \+ 150/);
  assert.match(source, /flightToolbarStraightY = startY - 12/);
  assert.match(source, /L \$\{flightToolbarStraightX\} \$\{flightToolbarStraightY\} Q/);
});
