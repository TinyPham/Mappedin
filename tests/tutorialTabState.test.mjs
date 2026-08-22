import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  captureActiveTutorialTab,
  restoreTutorialTabBeforeGuideRelease
} from '../src/tutorial/tutorialTabState.js';

function createClassList(initialClasses = []) {
  const classes = new Set(initialClasses);

  return {
    add(...classNames) {
      classNames.forEach((className) => classes.add(className));
    },
    contains(className) {
      return classes.has(className);
    },
    remove(...classNames) {
      classNames.forEach((className) => classes.delete(className));
    },
    toggle(className, force) {
      const shouldAdd = force === undefined ? !classes.has(className) : force;
      if (shouldAdd) classes.add(className);
      else classes.delete(className);
      return shouldAdd;
    }
  };
}

function createTabFixture({ activeTab = null, routeSummaryVisible = false } = {}) {
  const body = { classList: createClassList(['user-guide-open']) };
  const sidebar = { classList: createClassList() };
  let directionsClickObservedGuideOpen = false;

  const search = {
    classList: createClassList(activeTab === 'search' ? ['active'] : []),
    clickCount: 0,
    click() {
      this.clickCount += 1;
      this.classList.add('active');
      directions.classList.remove('active');
      sidebar.classList.remove('directions-info-open');
    }
  };
  const directions = {
    classList: createClassList(activeTab === 'directions' ? ['active'] : []),
    clickCount: 0,
    click() {
      this.clickCount += 1;
      directionsClickObservedGuideOpen = body.classList.contains('user-guide-open');
      this.classList.add('active');
      search.classList.remove('active');
      sidebar.classList.toggle('directions-info-open', routeSummaryVisible);
    }
  };
  const elements = {
    'tab-directions': directions,
    'tab-search': search
  };

  return {
    body,
    directions,
    document: {
      body,
      getElementById(id) {
        return elements[id] ?? null;
      }
    },
    get directionsClickObservedGuideOpen() {
      return directionsClickObservedGuideOpen;
    },
    search,
    sidebar
  };
}

test('restores Directions and route stacking before guide state is released', () => {
  const fixture = createTabFixture({ activeTab: 'directions', routeSummaryVisible: true });
  const captured = captureActiveTutorialTab(fixture.document);

  fixture.search.click();
  assert.equal(fixture.sidebar.classList.contains('directions-info-open'), false);

  restoreTutorialTabBeforeGuideRelease(fixture.document, captured, () => {
    fixture.body.classList.remove('user-guide-open');
  });

  assert.equal(fixture.directions.classList.contains('active'), true);
  assert.equal(fixture.sidebar.classList.contains('directions-info-open'), true);
  assert.equal(fixture.directionsClickObservedGuideOpen, true);
  assert.equal(fixture.body.classList.contains('user-guide-open'), false);
});

test('captures and restores Search', () => {
  const fixture = createTabFixture({ activeTab: 'search' });
  const captured = captureActiveTutorialTab(fixture.document);

  fixture.directions.click();
  restoreTutorialTabBeforeGuideRelease(fixture.document, captured, () => {
    fixture.body.classList.remove('user-guide-open');
  });

  assert.equal(captured, 'search');
  assert.equal(fixture.search.classList.contains('active'), true);
  assert.equal(fixture.search.clickCount, 1);
  assert.equal(fixture.body.classList.contains('user-guide-open'), false);
});

test('captures null and releases guide state without clicking a tab', () => {
  const fixture = createTabFixture();
  const captured = captureActiveTutorialTab(fixture.document);
  let releaseCount = 0;

  restoreTutorialTabBeforeGuideRelease(fixture.document, captured, () => {
    releaseCount += 1;
  });

  assert.equal(captured, null);
  assert.equal(fixture.search.clickCount, 0);
  assert.equal(fixture.directions.clickCount, 0);
  assert.equal(releaseCount, 1);
});
