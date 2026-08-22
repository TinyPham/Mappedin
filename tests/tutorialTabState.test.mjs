import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  beginTutorialTabSession,
  captureActiveTutorialTab,
  closeTutorialTabSession,
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

test('duplicate begin retains the original mobile Directions entry session', () => {
  const fixture = createTabFixture({ activeTab: 'directions' });
  const originalSession = beginTutorialTabSession(fixture.document, true);

  fixture.search.click();
  const duplicateSession = beginTutorialTabSession(fixture.document, true, originalSession);

  assert.strictEqual(duplicateSession, originalSession);
  assert.deepEqual(duplicateSession, { openedAtMobileWidth: true, entryTab: 'directions' });
});

test('desktop session keeps desktop close behavior after a resize to mobile', () => {
  const fixture = createTabFixture({ activeTab: 'directions' });
  const session = beginTutorialTabSession(fixture.document, false);
  let desktopRestoreCount = 0;
  let releaseCount = 0;

  const restored = closeTutorialTabSession(
    fixture.document,
    session,
    () => { releaseCount += 1; },
    () => {
      desktopRestoreCount += 1;
      fixture.search.click();
    }
  );

  assert.equal(session.openedAtMobileWidth, false);
  assert.equal(desktopRestoreCount, 1);
  assert.equal(fixture.search.classList.contains('active'), true);
  assert.equal(releaseCount, 1);
  assert.equal(restored, true);
});

test('mobile session restores its entry tab after a resize to desktop', () => {
  const fixture = createTabFixture({ activeTab: 'directions', routeSummaryVisible: true });
  const session = beginTutorialTabSession(fixture.document, true);
  let desktopRestoreCount = 0;
  let releaseCount = 0;

  fixture.search.click();
  const restored = closeTutorialTabSession(
    fixture.document,
    session,
    () => { releaseCount += 1; },
    () => { desktopRestoreCount += 1; }
  );

  assert.equal(session.openedAtMobileWidth, true);
  assert.equal(desktopRestoreCount, 0);
  assert.equal(fixture.directions.classList.contains('active'), true);
  assert.equal(fixture.directionsClickObservedGuideOpen, true);
  assert.equal(releaseCount, 1);
  assert.equal(restored, true);
});

test('closing without a session releases exactly once without restoring a tab', () => {
  const fixture = createTabFixture({ activeTab: 'directions' });
  let desktopRestoreCount = 0;
  let releaseCount = 0;

  const restored = closeTutorialTabSession(
    fixture.document,
    null,
    () => { releaseCount += 1; },
    () => { desktopRestoreCount += 1; }
  );

  assert.equal(restored, false);
  assert.equal(desktopRestoreCount, 0);
  assert.equal(fixture.directions.clickCount, 0);
  assert.equal(releaseCount, 1);
});

test('a later mobile session captures fresh tab state after the prior session closes', () => {
  const fixture = createTabFixture({ activeTab: 'directions' });
  const firstSession = beginTutorialTabSession(fixture.document, true);
  closeTutorialTabSession(fixture.document, firstSession, () => {}, () => {});

  fixture.search.click();
  const secondSession = beginTutorialTabSession(fixture.document, true);

  assert.notStrictEqual(secondSession, firstSession);
  assert.equal(firstSession.entryTab, 'directions');
  assert.equal(secondSession.entryTab, 'search');
});

test('mobile tab click failure returns false and still releases exactly once', () => {
  const fixture = createTabFixture({ activeTab: 'directions' });
  const session = beginTutorialTabSession(fixture.document, true);
  let releaseCount = 0;
  fixture.search.click();
  fixture.directions.click = () => { throw new Error('tab click failed'); };

  const restored = closeTutorialTabSession(
    fixture.document,
    session,
    () => { releaseCount += 1; },
    () => assert.fail('Mobile session must not use desktop restoration')
  );

  assert.equal(restored, false);
  assert.equal(releaseCount, 1);
});
