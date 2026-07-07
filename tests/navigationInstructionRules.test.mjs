import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  createInstructionFormatter,
  findNearbyLandmark,
  getRouteDisplayDistanceMeters,
  getInstructionDisplayDistance,
  ensureMinimumRouteInstructions,
  shouldRenderNavigationInstruction,
  simplifyNavigationInstructions
} from '../src/navigation/navigationInstructionRules.js';

const floors = [
  { id: 'floor-1', name: 'Tang 1 [Ga den]', elevation: 0 },
  { id: 'floor-2', name: 'Tang 2 [Ga di]', elevation: 1 }
];

const elevator = {
  id: 'elevator-a',
  name: 'Thang may',
  type: 'elevator'
};

const escalator = {
  id: 'escalator-a',
  type: 'escalator'
};

const t = (_key, fallback) => fallback;
const getFloorName = (floorId) => floors.find((floor) => floor.id === floorId)?.name || '';

test('keeps walking step before elevator, removes empty takeconnection, and merges exit with next turn', () => {
  const simplified = simplifyNavigationInstructions([
    {
      action: { type: 'continue' },
      coordinate: { floorId: 'floor-1', latitude: 10, longitude: 10 },
      distance: 177
    },
    {
      action: { type: 'takeconnection' },
      coordinate: { floorId: 'floor-1', latitude: 10.001, longitude: 10 },
      distance: 2
    },
    {
      action: { type: 'takeconnection', connection: elevator },
      coordinate: { floorId: 'floor-1', latitude: 10.002, longitude: 10 },
      distance: 3
    },
    {
      action: { type: 'exitconnection', connection: elevator },
      coordinate: { floorId: 'floor-2', latitude: 10.003, longitude: 10 },
      distance: 0
    },
    {
      action: { type: 'turn', bearing: 'left' },
      coordinate: { floorId: 'floor-2', latitude: 10.004, longitude: 10 },
      distance: 8
    },
    {
      action: { type: 'arrival' },
      coordinate: { floorId: 'floor-2', latitude: 10.005, longitude: 10 },
      distance: 0
    }
  ]);

  assert.deepEqual(simplified.map((step) => step.action.type), [
    'continue',
    'takeconnection',
    'exitconnection',
    'arrival'
  ]);
  assert.equal(simplified[0].action.type, 'continue');
  assert.equal(simplified[0].distance, 3);
  assert.equal(simplified[1].distance, 3);
  assert.equal(simplified[2]._mergedNextAction.type, 'turn');
  assert.equal(simplified[2].distance, 8);
});

test('formats elevator transition with actual floor direction and exit turn', () => {
  const simplified = simplifyNavigationInstructions([
    {
      action: { type: 'continue' },
      coordinate: { floorId: 'floor-1', latitude: 10, longitude: 10 },
      distance: 177
    },
    {
      action: { type: 'takeconnection' },
      coordinate: { floorId: 'floor-1', latitude: 10.001, longitude: 10 },
      distance: 2
    },
    {
      action: { type: 'takeconnection', connection: elevator },
      coordinate: { floorId: 'floor-1', latitude: 10.002, longitude: 10 },
      distance: 3
    },
    {
      action: { type: 'exitconnection', connection: elevator },
      coordinate: { floorId: 'floor-2', latitude: 10.003, longitude: 10 },
      distance: 0
    },
    {
      action: { type: 'turn', bearing: 'left' },
      coordinate: { floorId: 'floor-2', latitude: 10.004, longitude: 10 },
      distance: 8
    }
  ]);
  const formatter = createInstructionFormatter({
    floors,
    mapObjects: [],
    t,
    getFloorName,
    getName: (obj) => obj?.name
  });

  assert.equal(formatter.format(simplified[0], simplified, 0), 'Di thang');
  assert.equal(formatter.format(simplified[1], simplified, 1), 'Vao thang may len Tang 2 [Ga di]');
  assert.equal(formatter.format(simplified[2], simplified, 2), 'Ra thang may tai Tang 2 [Ga di] va di thang');
});

test('does not add nearby landmark to go straight instructions', () => {
  const formatter = createInstructionFormatter({
    floors,
    mapObjects: [
      {
        name: 'Cua hang ban le',
        floor: { id: 'floor-2' },
        anchor: { floorId: 'floor-2', latitude: 10, longitude: 10 }
      }
    ],
    t,
    getFloorName,
    getName: (obj) => obj?.name
  });

  assert.equal(formatter.format({
    action: { type: 'continue' },
    coordinate: { floorId: 'floor-2', latitude: 10, longitude: 10 },
    distance: 100
  }, [], 0), 'Di thang');
});

test('splits elevator exit at the first strong turn and keeps the short turn step', () => {
  const pathCoordinates = [
    { floorId: 'floor-2', latitude: 10, longitude: 10 },
    { floorId: 'floor-2', latitude: 10, longitude: 10.0005 },
    { floorId: 'floor-2', latitude: 10.0005, longitude: 10.0005 },
    { floorId: 'floor-2', latitude: 10.00055, longitude: 10.00052 }
  ];
  const simplified = simplifyNavigationInstructions([
    {
      action: { type: 'takeconnection', connection: elevator },
      coordinate: { floorId: 'floor-1', latitude: 10, longitude: 10 },
      distance: 3
    },
    {
      action: { type: 'exitconnection', connection: elevator },
      coordinate: pathCoordinates[0],
      distance: 0
    },
    {
      action: { type: 'turn', bearing: 'left' },
      coordinate: pathCoordinates[2],
      distance: 291
    },
    {
      action: { type: 'turn', bearing: 'left' },
      coordinate: pathCoordinates[3],
      distance: 8
    },
    {
      action: { type: 'arrival' },
      coordinate: pathCoordinates[3],
      distance: 0
    }
  ], { pathCoordinates });

  assert.deepEqual(simplified.map((step) => step.action.type), [
    'takeconnection',
    'exitconnection',
    'turn',
    'arrival'
  ]);
  assert.equal(getInstructionDisplayDistance(simplified[1]) > 0, true);
  assert.equal(getInstructionDisplayDistance(simplified[2]) > 0, true);
  assert.deepEqual(simplified[2].coordinate, pathCoordinates[1]);
});

test('removes zero-distance walking turn immediately before entering a connection', () => {
  const simplified = simplifyNavigationInstructions([
    {
      action: { type: 'turn', bearing: 'right' },
      coordinate: { floorId: 'floor-1', latitude: 10, longitude: 10 },
      distance: 0
    },
    {
      action: { type: 'takeconnection', connection: elevator },
      coordinate: { floorId: 'floor-1', latitude: 10.001, longitude: 10 },
      distance: 3
    },
    {
      action: { type: 'exitconnection', connection: elevator },
      coordinate: { floorId: 'floor-2', latitude: 10.002, longitude: 10 },
      distance: 0
    }
  ]);

  assert.deepEqual(simplified.map((step) => step.action.type), [
    'takeconnection',
    'exitconnection'
  ]);
});

test('merges consecutive same-direction corridor turns when instruction geometry stays on one axis', () => {
  const pathCoordinates = [
    { floorId: 'floor-1', latitude: 10, longitude: 10 },
    { floorId: 'floor-1', latitude: 10, longitude: 10.0001 },
    { floorId: 'floor-1', latitude: 10, longitude: 10.0003 },
    { floorId: 'floor-1', latitude: 9.9999, longitude: 10.0003 },
    { floorId: 'floor-1', latitude: 9.9997, longitude: 10.0003 },
    { floorId: 'floor-1', latitude: 9.9994, longitude: 10.0003 }
  ];

  const simplified = simplifyNavigationInstructions([
    {
      action: { type: 'departure' },
      coordinate: pathCoordinates[0],
      distance: 6
    },
    {
      action: { type: 'turn', bearing: 'right' },
      coordinate: pathCoordinates[1],
      distance: 22
    },
    {
      action: { type: 'turn', bearing: 'left' },
      coordinate: pathCoordinates[2],
      distance: 15
    },
    {
      action: { type: 'turn', bearing: 'left' },
      coordinate: pathCoordinates[3],
      distance: 21
    },
    {
      action: { type: 'turn', bearing: 'left' },
      coordinate: pathCoordinates[4],
      distance: 11
    },
    {
      action: { type: 'arrival' },
      coordinate: pathCoordinates[5],
      distance: 0
    }
  ], { pathCoordinates });

  assert.deepEqual(simplified.map((step) => step.action.type), [
    'departure',
    'turn',
    'turn',
    'arrival'
  ]);
  assert.equal(simplified[1].action.bearing, 'right');
  assert.equal(simplified[2].action.bearing, 'left');
  assert.equal(getInstructionDisplayDistance(simplified[2]), 47);
});

test('keeps consecutive same-direction turns when geometry is not corridor-aligned', () => {
  const simplified = simplifyNavigationInstructions([
    {
      action: { type: 'turn', bearing: 'left' },
      coordinate: { floorId: 'floor-1', latitude: 10, longitude: 10 },
      distance: 20
    },
    {
      action: { type: 'turn', bearing: 'left' },
      coordinate: { floorId: 'floor-1', latitude: 10.0002, longitude: 10 },
      distance: 20
    },
    {
      action: { type: 'turn', bearing: 'left' },
      coordinate: { floorId: 'floor-1', latitude: 10.0002, longitude: 10.0002 },
      distance: 20
    },
    {
      action: { type: 'arrival' },
      coordinate: { floorId: 'floor-1', latitude: 10.0004, longitude: 10.0002 },
      distance: 0
    }
  ]);

  assert.deepEqual(simplified.map((step) => step.action.type), [
    'turn',
    'turn',
    'turn',
    'arrival'
  ]);
});

test('uses explicit translation keys for merged exit phrases', () => {
  const calls = [];
  const formatter = createInstructionFormatter({
    floors,
    mapObjects: [],
    t: (key, fallback) => {
      calls.push(key);
      return fallback;
    },
    getFloorName,
    getName: (obj) => obj?.name
  });
  const instruction = {
    action: { type: 'exitconnection', connection: elevator },
    _mergedNextAction: { type: 'turn', bearing: 'left' },
    coordinate: { floorId: 'floor-2', latitude: 10, longitude: 10 }
  };

  formatter.format(instruction, [instruction], 0);

  assert.equal(calls.includes('direction_connector_and'), true);
  assert.equal(calls.includes('action_go_straight_lower'), true);
  assert.equal(calls.includes('action_turn_left_lower'), false);
});

test('detects up/down direction from translated floor names when floor objects have no names', () => {
  const simplified = simplifyNavigationInstructions([
    {
      action: { type: 'takeconnection', connection: elevator },
      coordinate: { floorId: 'floor-1', latitude: 10, longitude: 10 },
      distance: 3
    },
    {
      action: { type: 'exitconnection', connection: elevator },
      coordinate: { floorId: 'floor-2', latitude: 10.001, longitude: 10 },
      distance: 0
    }
  ]);
  const formatter = createInstructionFormatter({
    floors: [{ id: 'floor-1' }, { id: 'floor-2' }],
    mapObjects: [],
    t,
    getFloorName,
    getName: (obj) => obj?.name
  });

  assert.equal(formatter.format(simplified[0], simplified, 0), 'Vao thang may len Tang 2 [Ga di]');
});

test('prefers translated floor names over non-numeric SDK floor names for connection direction', () => {
  const instructions = [
    {
      action: { type: 'takeconnection', connection: elevator },
      coordinate: { floorId: 'floor-1', latitude: 10, longitude: 10 },
      distance: 3
    },
    {
      action: { type: 'exitconnection', connection: elevator },
      coordinate: { floorId: 'floor-2', latitude: 10.001, longitude: 10 },
      distance: 0
    }
  ];
  const formatter = createInstructionFormatter({
    floors: [
      { id: 'floor-2', name: 'Ga di' },
      { id: 'floor-1', name: 'Ga den' }
    ],
    mapObjects: [],
    t,
    getFloorName,
    getName: (obj) => obj?.name
  });

  assert.equal(formatter.format(instructions[0], instructions, 0), 'Vao thang may len Tang 2 [Ga di]');
});

test('uses configured floor id rank before names, elevation, or array order', () => {
  const instructions = [
    {
      action: { type: 'takeconnection', connection: elevator },
      coordinate: { floorId: 'm_41a38d6d0411d397', latitude: 10, longitude: 10 },
      distance: 3
    },
    {
      action: { type: 'exitconnection', connection: elevator },
      coordinate: { floorId: 'm_d4b5674c0b15e099', latitude: 10.001, longitude: 10 },
      distance: 0
    }
  ];
  const formatter = createInstructionFormatter({
    floors: [
      { id: 'm_d4b5674c0b15e099', name: 'Renamed lower-looking floor', elevation: 0 },
      { id: 'm_41a38d6d0411d397', name: 'Renamed higher-looking floor', elevation: 10 }
    ],
    mapObjects: [],
    t,
    getFloorName: (floorId) => floorId,
    getName: (obj) => obj?.name
  });

  assert.equal(formatter.format(instructions[0], instructions, 0), 'Vao thang may len m_d4b5674c0b15e099');
});

test('uses previous route floor as current floor when enter connection coordinate is already on target floor', () => {
  const instructions = [
    {
      action: { type: 'turn', bearing: 'right' },
      coordinate: { floorId: 'm_41a38d6d0411d397', latitude: 10, longitude: 10 },
      distance: 28
    },
    {
      action: { type: 'takeconnection', connection: elevator },
      coordinate: { floorId: 'm_d4b5674c0b15e099', latitude: 10.001, longitude: 10 },
      distance: 3
    },
    {
      action: { type: 'exitconnection', connection: elevator },
      coordinate: { floorId: 'm_d4b5674c0b15e099', latitude: 10.002, longitude: 10 },
      distance: 0
    }
  ];
  const formatter = createInstructionFormatter({
    floors: [],
    mapObjects: [],
    t,
    getFloorName: (floorId) => floorId === 'm_d4b5674c0b15e099' ? 'Tang 2 [Ga di]' : 'Tang 1 [Ga den]',
    getName: (obj) => obj?.name
  });

  assert.equal(formatter.format(instructions[1], instructions, 1), 'Vao thang may len Tang 2 [Ga di]');
});

test('floor number direction wins over inverted elevation metadata', () => {
  const simplified = simplifyNavigationInstructions([
    {
      action: { type: 'takeconnection', connection: elevator },
      coordinate: { floorId: 'floor-1', latitude: 10, longitude: 10 },
      distance: 3
    },
    {
      action: { type: 'exitconnection', connection: elevator },
      coordinate: { floorId: 'floor-2', latitude: 10.001, longitude: 10 },
      distance: 0
    }
  ]);
  const formatter = createInstructionFormatter({
    floors: [
      { id: 'floor-1', name: 'Tang 1 [Ga den]', elevation: 10 },
      { id: 'floor-2', name: 'Tang 2 [Ga di]', elevation: 0 }
    ],
    mapObjects: [],
    t,
    getFloorName,
    getName: (obj) => obj?.name
  });

  assert.equal(formatter.format(simplified[0], simplified, 0), 'Vao thang may len Tang 2 [Ga di]');
});

test('uses connection direction words for elevator down and escalator up', () => {
  const downInstructions = [
    {
      action: { type: 'takeconnection', connection: elevator },
      coordinate: { floorId: 'floor-2', latitude: 10, longitude: 10 },
      distance: 3
    },
    {
      action: { type: 'exitconnection', connection: elevator },
      coordinate: { floorId: 'floor-1', latitude: 10.001, longitude: 10 },
      distance: 0
    }
  ];
  const upInstructions = [
    {
      action: { type: 'takeconnection', connection: escalator },
      coordinate: { floorId: 'floor-1', latitude: 10, longitude: 10 },
      distance: 6
    },
    {
      action: { type: 'exitconnection', connection: escalator },
      coordinate: { floorId: 'floor-2', latitude: 10.001, longitude: 10 },
      distance: 0
    }
  ];
  const formatter = createInstructionFormatter({
    floors,
    mapObjects: [],
    t,
    getFloorName,
    getName: (obj) => obj?.name
  });

  assert.equal(formatter.format(downInstructions[0], downInstructions, 0), 'Vao thang may xuong Tang 1 [Ga den]');
  assert.equal(formatter.format(upInstructions[0], upInstructions, 0), 'Di thang cuon len Tang 2 [Ga di]');
});

test('falls back to SDK floor height metadata when floor names are not numeric', () => {
  const instructions = [
    {
      action: { type: 'takeconnection', connection: elevator },
      coordinate: { floorId: 'mezzanine', latitude: 10, longitude: 10 },
      distance: 3
    },
    {
      action: { type: 'exitconnection', connection: elevator },
      coordinate: { floorId: 'upper', latitude: 10.001, longitude: 10 },
      distance: 0
    }
  ];
  const formatter = createInstructionFormatter({
    floors: [
      { id: 'mezzanine', name: 'Mezzanine', elevation: 4 },
      { id: 'upper', name: 'Upper Departures', elevation: 12 }
    ],
    mapObjects: [],
    t,
    getFloorName: (floorId) => floorId === 'upper' ? 'Upper Departures' : 'Mezzanine',
    getName: (obj) => obj?.name
  });

  assert.equal(formatter.format(instructions[0], instructions, 0), 'Vao thang may len Upper Departures');
});

test('removes walking turn immediately before entering a connection even when raw distance is present', () => {
  const simplified = simplifyNavigationInstructions([
    {
      action: { type: 'turn', bearing: 'right' },
      coordinate: { floorId: 'floor-1', latitude: 10, longitude: 10 },
      distance: 4
    },
    {
      action: { type: 'takeconnection', connection: elevator },
      coordinate: { floorId: 'floor-1', latitude: 10.001, longitude: 10 },
      distance: 0
    },
    {
      action: { type: 'exitconnection', connection: elevator },
      coordinate: { floorId: 'floor-2', latitude: 10.002, longitude: 10 },
      distance: 0
    }
  ]);

  assert.deepEqual(simplified.map((step) => step.action.type), [
    'takeconnection',
    'exitconnection'
  ]);
});

test('nearby landmark is constrained to turn steps on the current floor and emitted once', () => {
  const objects = [
    {
      name: 'Quay ca phe va banh ngot',
      floor: { id: 'floor-2' },
      anchor: { floorId: 'floor-2', latitude: 10, longitude: 10 }
    },
    {
      name: 'Cua ra tau bay 40',
      floor: { id: 'floor-1' },
      anchor: { floorId: 'floor-1', latitude: 10, longitude: 10 }
    }
  ];

  assert.equal(
    findNearbyLandmark({ floorId: 'floor-2', latitude: 10, longitude: 10 }, 'floor-2', objects, { maxDist: 15, getName: (obj) => obj.name }),
    'Quay ca phe va banh ngot'
  );

  const formatter = createInstructionFormatter({
    floors,
    mapObjects: objects,
    t,
    getFloorName,
    getName: (obj) => obj?.name
  });
  const instructions = [
    {
      action: { type: 'turn', bearing: 'left' },
      coordinate: { floorId: 'floor-2', latitude: 10, longitude: 10 },
      distance: 5
    },
    {
      action: { type: 'turn', bearing: 'right' },
      coordinate: { floorId: 'floor-2', latitude: 10, longitude: 10 },
      distance: 5
    },
    {
      action: { type: 'continue' },
      coordinate: { floorId: 'floor-2', latitude: 10, longitude: 10 },
      distance: 5
    }
  ];

  assert.equal(formatter.format(instructions[0], instructions, 0), 'Re trai gan Quay ca phe va banh ngot');
  assert.equal(formatter.format(instructions[1], instructions, 1), 'Re phai');
  assert.equal(formatter.format(instructions[2], instructions, 2), 'Di thang');
});

test('nearby landmark excludes route origin and destination objects', () => {
  const origin = {
    id: 'origin-toilet',
    name: 'Nha ve sinh (WC - Toilet)',
    floor: { id: 'floor-2' },
    anchor: { floorId: 'floor-2', latitude: 10, longitude: 10 }
  };
  const destination = {
    id: 'gate-40',
    name: 'Cua ra tau bay 40',
    floor: { id: 'floor-2' },
    anchor: { floorId: 'floor-2', latitude: 10.00001, longitude: 10 }
  };
  const realLandmark = {
    id: 'coffee',
    name: 'Quay ca phe va banh ngot',
    floor: { id: 'floor-2' },
    anchor: { floorId: 'floor-2', latitude: 10.00002, longitude: 10 }
  };
  const formatter = createInstructionFormatter({
    floors,
    mapObjects: [origin, destination, realLandmark],
    landmarkExcludeObjects: [origin, destination],
    t,
    getFloorName,
    getName: (obj) => obj?.name
  });
  const instruction = {
    action: { type: 'turn', bearing: 'right' },
    coordinate: { floorId: 'floor-2', latitude: 10, longitude: 10 },
    distance: 12
  };

  assert.equal(formatter.format(instruction, [instruction], 0), 'Re phai gan Quay ca phe va banh ngot');
});

test('render filter removes non-arrival steps without display distance', () => {
  const turnWithoutDistance = {
    action: { type: 'turn', bearing: 'right' },
    coordinate: { floorId: 'floor-1' },
    distance: 0
  };
  const arrival = {
    action: { type: 'arrival' },
    coordinate: { floorId: 'floor-2' },
    distance: 0
  };

  assert.equal(getInstructionDisplayDistance(turnWithoutDistance), 0);
  assert.equal(shouldRenderNavigationInstruction(turnWithoutDistance), false);
  assert.equal(shouldRenderNavigationInstruction(arrival), true);
});

test('adds departure and arrival display steps for very short found routes', () => {
  const coordinates = [
    { floorId: 'floor-2', latitude: 10, longitude: 107 },
    { floorId: 'floor-2', latitude: 10.00003, longitude: 107.00003 }
  ];
  const displaySteps = ensureMinimumRouteInstructions([
    {
      action: { type: 'arrival' },
      coordinate: coordinates[1],
      distance: 0
    }
  ], {
    coordinates,
    distance: 5
  });

  assert.equal(displaySteps.length, 2);
  assert.equal(displaySteps[0].action.type, 'departure');
  assert.equal(displaySteps[0].distance, 5);
  assert.equal(displaySteps[1].action.type, 'arrival');
});

test('uses route distance when instruction display distance collapses to zero', () => {
  const displayDistance = getRouteDisplayDistanceMeters([
    {
      action: { type: 'arrival' },
      distance: 0
    }
  ], {
    distance: 7
  });

  assert.equal(displayDistance, 7);
});

test('index normalizes short-route instructions and clears loading UI on route failure', () => {
  const source = readFileSync(new URL('../main/main-function/index.ts', import.meta.url), 'utf8');

  assert.match(source, /ensureMinimumRouteInstructions\(simplifiedInstructions,/);
  assert.match(source, /getRouteDisplayDistanceMeters\(simplifiedInstructions,/);
  assert.match(source, /const\s+renderRouteNotFoundState\s*=/);
  assert.match(source, /instructionsListEl\.innerHTML\s*=/);
  assert.match(source, /const\s+popup\s*=\s*document\.getElementById\("sidebar-info-panel"\)/);
  assert.match(source, /popup\.style\.display\s*=\s*"none"/);
  assert.match(source, /min-height:\s*260px/);
  assert.match(source, /justify-content:\s*center/);
  assert.match(source, /previewBar\.style\.display\s*=\s*"none"/);
});

test('index uses the same simplified instructions for route state and sidebar rendering', () => {
  const source = readFileSync(new URL('../main/main-function/index.ts', import.meta.url), 'utf8');

  assert.match(source, /const\s+displayDirections\s*=\s*\{/);
  assert.match(source, /rawInstructions:\s*directions\.instructions\s*\|\|\s*\[\]/);
  assert.match(source, /instructions:\s*simplifiedInstructions/);
  assert.match(source, /wayfindingDirections\s*=\s*displayDirections/);
  assert.match(source, /mapView\.Navigation\.draw\(directions,\s*navigationOptions\)/);
  assert.match(source, /landmarkExcludeObjects:\s*waypoints/);
});
