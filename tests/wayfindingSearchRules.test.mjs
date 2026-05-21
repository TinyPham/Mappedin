import test from 'node:test';
import assert from 'node:assert/strict';

import {
  matchesWayfindingSearch,
  rankWayfindingSearchResults
} from '../wayfindingSearchRules.js';

const coord = (latitude, longitude, floorId = 'floor-1') => ({ latitude, longitude, floorId });

test('matches check-in synonyms against Vietnamese procedure counters', () => {
  const counter = { id: 'checkin-01', name: 'Quầy thủ tục 01' };

  for (const query of ['Quầy làm thủ tục', 'thủ tục check-in 01', 'check-in', 'checkin', 'check in']) {
    assert.equal(matchesWayfindingSearch(query, counter.name, counter), true, query);
  }
});

test('matches searchable description but not unrelated parent metadata', () => {
  const objects = [
    {
      id: 'gate-18',
      name: 'C\u1eeda ra t\u00e0u bay 18',
      description: 'G\u1ea7n b\u0103ng chuy\u1ec1n h\u00e0nh l\u00fd'
    },
    {
      id: 'gate-19',
      name: 'C\u1eeda ra t\u00e0u bay 19',
      description: 'G\u1ea7n b\u0103ng khu nh\u1eadn h\u00e0nh l\u00fd'
    },
    {
      id: 'domestic-arrival',
      name: 'Khu ga \u0111\u1ebfn qu\u1ed1c n\u1ed9i',
      parentLocation: { name: 'B\u0103ng chuy\u1ec1n h\u00e0nh l\u00fd' }
    },
    {
      id: 'carousel-1',
      name: 'B\u0103ng chuy\u1ec1n h\u00e0nh l\u00fd 1'
    }
  ];

  const results = rankWayfindingSearchResults({
    query: 'b\u0103ng chuy\u1ec1n',
    objects,
    nodeType: 'destination',
    getName: (obj) => obj.name
  });

  assert.deepEqual(results.map((result) => result.primaryObject.id), ['carousel-1', 'gate-18']);
});

test('does not match description on a single keyword without an adjacent query phrase', () => {
  const objects = [
    {
      id: 'gate-18',
      name: 'C\u1eeda ra t\u00e0u bay 18',
      description: 'G\u1ea7n b\u0103ng chuy\u1ec1n h\u00e0nh l\u00fd'
    }
  ];

  const results = rankWayfindingSearchResults({
    query: 'b\u0103ng',
    objects,
    nodeType: 'destination',
    getName: (obj) => obj.name
  });

  assert.deepEqual(results.map((result) => result.primaryObject.id), []);
});

test('ranks visible name matches before description-only matches', () => {
  const objects = [
    {
      id: 'description-only',
      name: 'Khu ga \u0111\u1ebfn qu\u1ed1c n\u1ed9i',
      description: 'G\u1ea7n c\u1eeda ra s\u1ea3nh c\u00f4ng c\u1ed9ng'
    },
    {
      id: 'name-match',
      name: 'C\u1eeda ra s\u1ea3nh c\u00f4ng c\u1ed9ng A'
    }
  ];

  const results = rankWayfindingSearchResults({
    query: 'c\u1eeda ra',
    objects,
    nodeType: 'destination',
    getName: (obj) => obj.name
  });

  assert.deepEqual(results.map((result) => result.primaryObject.id), ['name-match', 'description-only']);
});

test('prioritizes adjacent phrase and richer token matches for visible names', () => {
  const objects = [
    { id: 'fashion', name: 'C\u1eeda h\u00e0ng th\u1eddi trang' },
    { id: 'retail', name: 'C\u1eeda h\u00e0ng b\u00e1n l\u1ebb' },
    { id: 'public-exit-b', name: 'C\u1eeda ra s\u1ea3nh c\u00f4ng c\u1ed9ng B' },
    { id: 'gate-20', name: 'C\u1eeda ra t\u00e0u bay 20' },
    { id: 'gate-21', name: 'C\u1eeda ra t\u00e0u bay 21' }
  ];

  const search = (query) => rankWayfindingSearchResults({
    query,
    objects,
    nodeType: 'destination',
    getName: (obj) => obj.name
  }).map((result) => result.primaryObject.id);

  const singleWordResults = search('C\u1eeda');
  assert.deepEqual(new Set(singleWordResults.slice(0, 2)), new Set(['fashion', 'retail']));
  assert.equal(singleWordResults.indexOf('public-exit-b') > singleWordResults.indexOf('retail'), true);
  assert.deepEqual(search('C\u1eeda ra').slice(0, 3), ['public-exit-b', 'gate-20', 'gate-21']);
  assert.deepEqual(search('C\u1eeda ra c\u00f4ng c\u1ed9ng').slice(0, 1), ['public-exit-b']);
  assert.deepEqual(search('C\u1eeda t\u00e0u bay').slice(0, 2), ['gate-20', 'gate-21']);
});

test('prioritizes baggage claim islands for baggage-related multilingual searches', () => {
  const objects = [
    { id: 'checkin-c', name: '\u0110\u1ea3o l\u00e0m th\u1ee7 t\u1ee5c C' },
    { id: 'baggage-1', name: '\u0110\u1ea3o nh\u1eadn h\u00e0nh l\u00fd 1' },
    { id: 'baggage-2', name: '\u0110\u1ea3o nh\u1eadn h\u00e0nh l\u00fd 2' }
  ];

  const search = (query) => rankWayfindingSearchResults({
    query,
    objects,
    nodeType: 'destination',
    getName: (obj) => obj.name
  }).map((result) => result.primaryObject.id);

  for (const query of [
    'b\u0103ng chuy\u1ec1n',
    'h\u00e0nh l\u00fd',
    'l\u1ea5y h\u00e0nh l\u00fd',
    'baggage claim',
    'luggage pickup',
    '\u884c\u674e\u63d0\u53d6',
    '\u8377\u7269\u53d7\u53d6',
    '\uc218\ud558\ubb3c \ucc3e\uae30'
  ]) {
    assert.deepEqual(search(query).slice(0, 2), ['baggage-1', 'baggage-2'], query);
  }
});

test('returns every matching search result when no explicit limit is provided', () => {
  const objects = Array.from({ length: 40 }, (_, index) => ({
    id: `restroom-${index + 1}`,
    name: 'Nh\u00e0 v\u1ec7 sinh (WC - Toilet)',
    floorId: index < 20 ? 'floor-1' : 'floor-2'
  }));

  const results = rankWayfindingSearchResults({
    query: 'nh\u00e0 v\u1ec7 sinh',
    objects,
    nodeType: 'destination',
    getName: (obj) => obj.name
  });

  assert.equal(results.length, 40);
});

test('prioritizes current floor when no explicit floor is requested', () => {
  const objects = [
    { id: 'food-gf', name: 'Qu\u1ea7y b\u00e1n \u0111\u1ed3 \u0103n', floorId: 'floor-gf' },
    { id: 'food-f1', name: 'Qu\u1ea7y b\u00e1n \u0111\u1ed3 \u0103n', floorId: 'floor-1' },
    { id: 'food-f2', name: 'Qu\u1ea7y b\u00e1n \u0111\u1ed3 \u0103n', floorId: 'floor-2' }
  ];

  const results = rankWayfindingSearchResults({
    query: 'qu\u1ea7y b\u00e1n \u0111\u1ed3 \u0103n',
    objects,
    nodeType: 'destination',
    currentFloorId: 'floor-2',
    getName: (obj) => obj.name
  });

  assert.equal(results[0].primaryObject.id, 'food-f2');
});

test('orders other floor results by configured floor order after current floor', () => {
  const objects = [
    { id: 'restroom-f3', name: 'Nh\u00e0 v\u1ec7 sinh (WC - Toilet)', floorId: 'floor-3' },
    { id: 'restroom-f1', name: 'Nh\u00e0 v\u1ec7 sinh (WC - Toilet)', floorId: 'floor-1' },
    { id: 'restroom-f2', name: 'Nh\u00e0 v\u1ec7 sinh (WC - Toilet)', floorId: 'floor-2' },
    { id: 'restroom-gf', name: 'Nh\u00e0 v\u1ec7 sinh (WC - Toilet)', floorId: 'floor-gf' }
  ];
  const floorOrder = new Map([
    ['floor-gf', 0],
    ['floor-1', 1],
    ['floor-2', 2],
    ['floor-3', 3]
  ]);

  const results = rankWayfindingSearchResults({
    query: 'nh\u00e0 v\u1ec7 sinh',
    objects,
    nodeType: 'destination',
    currentFloorId: 'floor-2',
    getName: (obj) => obj.name,
    getFloorSortRank: (obj) => floorOrder.get(obj.floorId)
  });

  assert.deepEqual(results.map((result) => result.primaryObject.id), [
    'restroom-f2',
    'restroom-gf',
    'restroom-f1',
    'restroom-f3'
  ]);
});

test('floor sort order does not depend on floor keywords in the query', () => {
  const objects = [
    { id: 'restroom-f3', name: 'Nh\u00e0 v\u1ec7 sinh (WC - Toilet)', floorId: 'floor-3' },
    { id: 'restroom-f2', name: 'Nh\u00e0 v\u1ec7 sinh (WC - Toilet)', floorId: 'floor-2' },
    { id: 'restroom-gf', name: 'Nh\u00e0 v\u1ec7 sinh (WC - Toilet)', floorId: 'floor-gf' },
    { id: 'restroom-f1', name: 'Nh\u00e0 v\u1ec7 sinh (WC - Toilet)', floorId: 'floor-1' }
  ];
  const floorOrder = new Map([
    ['floor-gf', 0],
    ['floor-1', 1],
    ['floor-2', 2],
    ['floor-3', 3]
  ]);

  const results = rankWayfindingSearchResults({
    query: 'nh\u00e0 v\u1ec7 sinh',
    objects,
    nodeType: 'destination',
    currentFloorId: 'floor-2',
    getName: (obj) => obj.name,
    getFloorSortRank: (obj) => floorOrder.get(obj.floorId)
  });

  assert.deepEqual(results.map((result) => result.primaryObject.id), [
    'restroom-f2',
    'restroom-gf',
    'restroom-f1',
    'restroom-f3'
  ]);
});

test('excludes public and restricted area placeholders from search results', () => {
  const objects = [
    { id: 'public-area', name: 'Khu v\u1ef1c c\u00f4ng c\u1ed9ng', floorId: 'floor-gf' },
    { id: 'restricted-area', name: 'Khu v\u1ef1c h\u1ea1n ch\u1ebf', floorId: 'floor-gf' },
    { id: 'public-exit', name: 'C\u1eeda ra s\u1ea3nh c\u00f4ng c\u1ed9ng A', floorId: 'floor-1' },
    { id: 'atm', name: 'ATM', floorId: 'floor-gf' }
  ];

  const suggestions = rankWayfindingSearchResults({
    query: '',
    objects,
    nodeType: 'origin',
    getName: (obj) => obj.name
  });

  assert.deepEqual(suggestions.map((result) => result.primaryObject.id), ['atm', 'public-exit']);

  const searchResults = rankWayfindingSearchResults({
    query: 'c\u00f4ng c\u1ed9ng',
    objects,
    nodeType: 'destination',
    getName: (obj) => obj.name
  });

  assert.deepEqual(searchResults.map((result) => result.primaryObject.id), ['public-exit']);
});

test('excludes English public and restricted area placeholders from search results', () => {
  const objects = [
    { id: 'public-area', name: 'Public area', floorId: 'floor-gf' },
    { id: 'restricted-area', name: 'Restricted area', floorId: 'floor-gf' },
    { id: 'gate', name: 'Public gate 1', floorId: 'floor-gf' }
  ];

  const results = rankWayfindingSearchResults({
    query: 'public',
    objects,
    nodeType: 'destination',
    getName: (obj) => obj.name
  });

  assert.deepEqual(results.map((result) => result.primaryObject.id), ['gate']);
});

test('excludes places outside the allowed searchable floors', () => {
  const objects = [
    { id: 'gf', name: 'ATM', floorId: 'm_dae8f26a40f6017f' },
    { id: 'f1', name: 'ATM', floorId: 'm_41a38d6d0411d397' },
    { id: 'f2', name: 'ATM', floorId: 'm_d4b5674c0b15e099' },
    { id: 'f3', name: 'ATM', floorId: 'm_1523f7dcde647c40' },
    { id: 'transit', name: 'ATM', floorId: 'm_public_transit' },
    { id: 'overview', name: 'ATM', floorId: 'm_overview' }
  ];

  const results = rankWayfindingSearchResults({
    query: 'atm',
    objects,
    nodeType: 'destination',
    allowedFloorIds: new Set([
      'm_dae8f26a40f6017f',
      'm_41a38d6d0411d397',
      'm_d4b5674c0b15e099',
      'm_1523f7dcde647c40'
    ]),
    getName: (obj) => obj.name
  });

  assert.deepEqual(results.map((result) => result.primaryObject.id), ['gf', 'f1', 'f2', 'f3']);
});

test('excludes places outside allowed floors when floor id is nested on the floor object', () => {
  const allowedFloorIds = new Set([
    'm_dae8f26a40f6017f',
    'm_41a38d6d0411d397',
    'm_d4b5674c0b15e099',
    'm_1523f7dcde647c40'
  ]);
  const objects = [
    { id: 'valid', name: 'ATM', floor: { mappedinId: 'm_dae8f26a40f6017f', name: 'Tang tret' } },
    { id: 'public-transit', name: 'ATM', floor: { mappedinId: 'm_gf_public_transit', name: 'GF - Public-Transit' } },
    { id: 'coordinate-floor', name: 'ATM', coordinate: { latitude: 10, longitude: 107, floor: { mappedinId: 'm_public_transit' } } }
  ];

  const results = rankWayfindingSearchResults({
    query: '',
    objects,
    nodeType: 'origin',
    allowedFloorIds,
    getName: (obj) => obj.name
  });

  assert.deepEqual(results.map((result) => result.primaryObject.id), ['valid']);
});

test('matches gate synonyms against Vietnamese gate names', () => {
  const gate = { id: 'gate-40', name: 'Cửa ra tàu bay 40' };

  assert.equal(matchesWayfindingSearch('Gate 40', gate.name, gate), true);
  assert.equal(matchesWayfindingSearch('gate', gate.name, gate), true);
});

test('typed destination search keeps duplicate names without nearest distance labels', () => {
  const origin = { id: 'origin', center: coord(10, 107) };
  const objects = [
    { id: 'toilet-far', name: 'Nhà vệ sinh (WC - Toilet)', subCategoryId: 'restroom', floorId: 'floor-1', center: coord(10.0007, 107) },
    { id: 'toilet-near', name: 'Nhà vệ sinh (WC - Toilet)', subCategoryId: 'restroom', floorId: 'floor-1', center: coord(10.0001, 107) },
    { id: 'toilet-mid', name: 'Nhà vệ sinh (WC - Toilet)', subCategoryId: 'restroom', floorId: 'floor-1', center: coord(10.0004, 107) }
  ];

  const results = rankWayfindingSearchResults({
    query: 'nhà vệ sinh',
    objects,
    origin,
    nodeType: 'destination',
    limit: 15,
    getName: (obj) => obj.name
  });

  assert.equal(results.length, 3);
  assert.deepEqual(results.map((result) => result.primaryObject.id), ['toilet-far', 'toilet-near', 'toilet-mid']);
  assert.equal(results.some((result) => result.isNearest), false);
  assert.equal(results.some((result) => result.showDistance), false);
});

test('limits empty destination suggestions to places within 100m on the origin floor', () => {
  const origin = { id: 'origin', name: 'Khu ẩm thực', center: coord(10, 107, 'floor-1') };
  const objects = [
    origin,
    { id: 'near-same-floor', name: 'Quầy cà phê và bánh ngọt', floorId: 'floor-1', center: coord(10.0002, 107) },
    { id: 'nearer-same-floor', name: 'Nhà vệ sinh (WC - Toilet)', floorId: 'floor-1', center: coord(10.0001, 107) },
    { id: 'far-same-floor', name: 'Cửa ra tàu bay 40', floorId: 'floor-1', center: coord(10.002, 107) },
    { id: 'near-other-floor', name: 'Nhà vệ sinh (WC - Toilet)', floorId: 'floor-2', center: coord(10.0001, 107) }
  ];

  const results = rankWayfindingSearchResults({
    query: '',
    objects,
    origin,
    nodeType: 'destination',
    excludeObjects: [origin],
    getName: (obj) => obj.name
  });

  assert.deepEqual(results.map((result) => result.primaryObject.id), ['nearer-same-floor', 'near-same-floor']);
  assert.equal(results[0].isNearest, true);
  assert.equal(results.every((result) => result.showDistance === true), true);
});

test('typed destination search with an origin searches all floors and all distances', () => {
  const origin = { id: 'origin', center: coord(10, 107, 'floor-1') };
  const objects = [
    { id: 'near-same-floor', name: 'Nhà vệ sinh (WC - Toilet)', floorId: 'floor-1', center: coord(10.0002, 107) },
    { id: 'near-other-floor', name: 'Nhà vệ sinh (WC - Toilet)', floorId: 'floor-2', center: coord(10.0001, 107) },
    { id: 'far-same-floor', name: 'Nhà vệ sinh (WC - Toilet)', floorId: 'floor-1', center: coord(10.002, 107) }
  ];

  const results = rankWayfindingSearchResults({
    query: 'nhà vệ sinh',
    objects,
    origin,
    nodeType: 'destination',
    getName: (obj) => obj.name
  });

  assert.deepEqual(results.map((result) => result.primaryObject.id), ['near-same-floor', 'near-other-floor', 'far-same-floor']);
  assert.equal(results.some((result) => result.isNearest), false);
  assert.equal(results.some((result) => result.showDistance), false);
});

test('typed destination search does not mark cross-floor planar distance as nearest', () => {
  const origin = { id: 'origin', center: coord(10, 107, 'floor-1') };
  const objects = [
    { id: 'checkin-upstairs', name: 'Quầy thủ tục 15 - Đảo H', floorId: 'floor-3', center: coord(10.00001, 107) },
    { id: 'checkin-upstairs-2', name: 'Quầy thủ tục 16 - Đảo H', floorId: 'floor-3', center: coord(10.00002, 107) }
  ];

  const results = rankWayfindingSearchResults({
    query: 'check',
    objects,
    origin,
    nodeType: 'destination',
    getName: (obj) => obj.name
  });

  assert.equal(results.length, 2);
  assert.equal(results.some((result) => result.isNearest), false);
  assert.equal(results.some((result) => result.showDistance), false);
});

test('partial restroom search does not match unrelated check-in counters', () => {
  const objects = [
    { id: 'checkin', name: 'Đảo làm thủ tục H', floorId: 'floor-3', center: coord(10, 107) },
    { id: 'restroom', name: 'Nhà vệ sinh (WC - Toilet)', floorId: 'floor-1', center: coord(10, 107.001) }
  ];

  const results = rankWayfindingSearchResults({
    query: 'nhà vệ',
    objects,
    nodeType: 'destination',
    getName: (obj) => obj.name
  });

  assert.deepEqual(results.map((result) => result.primaryObject.id), ['restroom']);
});

test('typed destination search ranks richer check-in keyword matches ahead of weaker matches', () => {
  const objects = [
    { id: 'checkin-01', name: 'Quầy thủ tục 01', floorId: 'floor-1', center: coord(10, 107) },
    { id: 'counter-01', name: 'Quầy dịch vụ 01', floorId: 'floor-1', center: coord(10, 107.001) }
  ];

  const results = rankWayfindingSearchResults({
    query: 'quầy check-in 01',
    objects,
    nodeType: 'destination',
    getName: (obj) => obj.name
  });

  assert.equal(results[0].primaryObject.id, 'checkin-01');
});

test('supports multilingual check-in and gate search terms', () => {
  const counter = { id: 'checkin-01', name: 'Quầy thủ tục 01' };
  const gate = { id: 'gate-40', name: 'Cửa ra tàu bay 40' };

  for (const query of ['值机 01', 'チェックイン 01', '체크인 01']) {
    assert.equal(matchesWayfindingSearch(query, counter.name, counter), true, query);
  }

  for (const query of ['登机口 40', '搭乗口 40', '탑승구 40']) {
    assert.equal(matchesWayfindingSearch(query, gate.name, gate), true, query);
  }
});
