import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

import {
  aggregateNavigationLegs,
  createInstructionFormatter,
  findNearbyLandmark,
  getRouteDisplayDistanceMeters,
  getInstructionDisplayDistance,
  ensureMinimumRouteInstructions,
  prepareNavigationLeg,
  shouldRenderNavigationInstruction,
  simplifyNavigationInstructions,
  validateNavigationInstructionsAgainstPath
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

test('index post-aggregation filtering preserves zero-distance structural actions', () => {
  const source = readFileSync(new URL('../main/main-function/index.ts', import.meta.url), 'utf8');
  const start = source.indexOf('function shouldKeepAggregatedNavigationInstruction(');
  assert.notEqual(start, -1, 'missing structural instruction predicate');
  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  let end = -1;
  for (let index = bodyStart; index < source.length; index++) {
    if (source[index] === '{') depth++;
    if (source[index] === '}') depth--;
    if (depth === 0) {
      end = index + 1;
      break;
    }
  }
  assert.ok(end > bodyStart, 'unterminated structural instruction predicate');
  const predicateSource = source.slice(start, end);
  const executableSource = ts.transpileModule(predicateSource, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const predicate = Function(
    `"use strict"; ${executableSource}; return shouldKeepAggregatedNavigationInstruction;`
  )();
  const renderByDistance = (instruction) => Number(instruction.distance || 0) > 0;

  for (const type of [
    'departure',
    'start',
    'stopover',
    'arrival',
    'arrive',
    'takeconnection',
    'enter',
    'exitconnection',
    'exit'
  ]) {
    assert.equal(
      predicate({ action: { type }, distance: 0 }, renderByDistance),
      true,
      `${type} should survive zero-distance filtering`
    );
  }
  assert.equal(
    predicate({ action: { type: 'continue' }, distance: 0 }, renderByDistance),
    false
  );
  assert.equal(
    predicate({ action: { type: 'continue' }, distance: 5 }, renderByDistance),
    true
  );
});

test('index prepares each leg and clears loading UI on route failure', () => {
  const source = readFileSync(new URL('../main/main-function/index.ts', import.meta.url), 'utf8');
  const executableSource = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  const routeFailureStart = executableSource.indexOf('const renderRouteNotFoundState =');
  const routeFailureEnd = executableSource.indexOf('\n    try {', routeFailureStart);
  assert.notEqual(routeFailureStart, -1, 'Missing route failure renderer');
  assert.notEqual(routeFailureEnd, -1, 'Missing end of route failure renderer');
  const routeFailureBlock = executableSource.slice(routeFailureStart, routeFailureEnd);

  assert.match(
    source,
    /prepareNavigationLeg\(dir,\s*\{\s*legIndex:\s*i,\s*routeDistance:\s*dir\.distance,\s*pathCoordinates:\s*dir\.coordinates\s*\}\)/
  );
  assert.match(source, /aggregateNavigationLegs\(preparedLegs,\s*\{/);
  assert.match(source, /getRouteDisplayDistanceMeters\(simplifiedInstructions,/);
  assert.match(source, /const\s+renderRouteNotFoundState\s*=/);
  assert.match(source, /instructionsListEl\.innerHTML\s*=/);
  assert.match(routeFailureBlock, /setAreaInfoPanelVisible\(false\)/);
  assert.doesNotMatch(routeFailureBlock, /document\.getElementById\("sidebar-info-panel"\)/);
  assert.match(source, /min-height:\s*260px/);
  assert.match(source, /justify-content:\s*center/);
  assert.match(source, /previewBar\.style\.display\s*=\s*"none"/);
});

test('index uses aggregated instructions for route state and draws SDK Directions per leg', () => {
  const source = readFileSync(new URL('../main/main-function/index.ts', import.meta.url), 'utf8');

  assert.match(source, /const\s+\{\s*uiDirections,\s*legSpans\s*\}\s*=\s*aggregateNavigationLegs/);
  assert.match(source, /const\s+directions\s*=\s*uiDirections/);
  assert.match(source, /directions\.instructions\s*=\s*simplifiedInstructions/);
  assert.match(source, /wayfindingDirections\s*=\s*uiDirections/);
  assert.match(source, /await\s+drawThenCommitNavigation\(\{/);
  assert.match(source, /draw:\s*\(\)\s*=>\s*mapView\.Navigation\.draw\(legDirections,\s*navigationOptions\)/);
  assert.match(source, /const\s+navigationPathOptions\s*=\s*\{/);
  assert.match(source, /color:\s*['"]#4b90e2['"]/);
  assert.match(source, /accentColor:\s*['"]#ffffff['"]/);
  assert.match(source, /pathOptions:\s*\{\s*\.\.\.navigationPathOptions\s*\}/);
  assert.match(source, /inactivePathOptions:\s*\{\s*\.\.\.navigationPathOptions\s*\}/);
  assert.match(source, /selectNonIntersectingStopoverRoute\(\{/);
  assert.match(source, /requireNonIntersecting:\s*false/);
  assert.match(source, /preselectedDirections\.get\(i\)/);
  assert.doesNotMatch(source, /const\s+displayDirections\s*=/);
  assert.doesNotMatch(source, /mapView\.Navigation\.draw\(directions,\s*navigationOptions\)/);
  assert.match(source, /landmarkExcludeObjects:\s*waypoints/);
});

const routeCoord = (floorId, latitude, longitude) => ({ floorId, latitude, longitude });

class GetterBackedConnection {
  constructor(id, type, name) {
    this._id = id;
    this._type = type;
    this._name = name;
  }

  get id() {
    return this._id;
  }

  get type() {
    return this._type;
  }

  get name() {
    return this._name;
  }
}

class GetterBackedCoordinate {
  constructor(floorId, latitude, longitude, anchorTarget) {
    this._floorId = floorId;
    this._latitude = latitude;
    this._longitude = longitude;
    this._anchorTarget = anchorTarget;
  }

  get floorId() {
    return this._floorId;
  }

  get latitude() {
    return this._latitude;
  }

  get longitude() {
    return this._longitude;
  }

  get anchorTarget() {
    return this._anchorTarget;
  }
}

class GetterBackedAction {
  constructor(type, options = {}) {
    this._type = type;
    this._bearing = options.bearing;
    this._instruction = options.instruction;
    this._connection = options.connection;
  }

  get type() {
    return this._type;
  }

  get bearing() {
    return this._bearing;
  }

  get instruction() {
    return this._instruction;
  }

  get connection() {
    return this._connection;
  }
}

class GetterBackedInstruction {
  constructor(action, coordinate, distance) {
    this._action = action;
    this._coordinate = coordinate;
    this._distance = distance;
  }

  get action() {
    return this._action;
  }

  get coordinate() {
    return this._coordinate;
  }

  get distance() {
    return this._distance;
  }
}

test('validates same-floor instruction coordinates within the default 1.5m tolerance', () => {
  const pathCoordinates = [
    routeCoord('floor-1', 0, 0),
    routeCoord('floor-1', 0, 0.0001)
  ];
  const instructions = [
    {
      action: { type: 'departure' },
      coordinate: routeCoord('floor-1', 0, 0.000009),
      distance: 11
    },
    {
      action: { type: 'arrival' },
      coordinate: pathCoordinates[1],
      distance: 0
    }
  ];

  const result = validateNavigationInstructionsAgainstPath(instructions, {
    pathCoordinates,
    routeDistance: 11
  });

  assert.equal(result.valid, true);
  assert.equal(result.reason, null);
  assert.deepEqual(result.coordinateIndices, [0, 1]);
});

test('rejects instruction coordinates farther than 1.5m from the current leg path', () => {
  const result = validateNavigationInstructionsAgainstPath([
    {
      action: { type: 'departure' },
      coordinate: routeCoord('floor-1', 0.00003, 0),
      distance: 11
    }
  ], {
    pathCoordinates: [
      routeCoord('floor-1', 0, 0),
      routeCoord('floor-1', 0, 0.0001)
    ],
    routeDistance: 11
  });

  assert.equal(result.valid, false);
  assert.match(result.reason, /1\.5m|path/i);
  assert.deepEqual(result.coordinateIndices, [-1]);
});

test('rejects decreasing coordinate indices within one leg', () => {
  const pathCoordinates = [
    routeCoord('floor-1', 0, 0),
    routeCoord('floor-1', 0, 0.0001),
    routeCoord('floor-1', 0, 0.0002)
  ];
  const result = validateNavigationInstructionsAgainstPath([
    {
      action: { type: 'continue' },
      coordinate: pathCoordinates[2],
      distance: 20
    },
    {
      action: { type: 'arrival' },
      coordinate: pathCoordinates[1],
      distance: 0
    }
  ], {
    pathCoordinates,
    routeDistance: 20
  });

  assert.equal(result.valid, false);
  assert.match(result.reason, /nondecreasing/i);
  assert.deepEqual(result.coordinateIndices, [2, 1]);
});

test('accepts and rejects display distance at the 15 percent tolerance edge', () => {
  const pathCoordinates = [
    routeCoord('floor-1', 0, 0),
    routeCoord('floor-1', 0, 0.0009)
  ];
  const makeInstructions = (distance) => [
    {
      action: { type: 'departure' },
      coordinate: pathCoordinates[0],
      distance
    },
    {
      action: { type: 'arrival' },
      coordinate: pathCoordinates[1],
      distance: 0
    }
  ];

  const valid = validateNavigationInstructionsAgainstPath(makeInstructions(115), {
    pathCoordinates,
    routeDistance: 100
  });
  const invalid = validateNavigationInstructionsAgainstPath(makeInstructions(116), {
    pathCoordinates,
    routeDistance: 100
  });

  assert.equal(valid.valid, true);
  assert.equal(valid.distanceDeviation, 15);
  assert.equal(valid.distanceTolerance, 15);
  assert.equal(invalid.valid, false);
  assert.match(invalid.reason, /distance/i);
});

test('uses the 5m minimum display distance tolerance for short routes', () => {
  const pathCoordinates = [
    routeCoord('floor-1', 0, 0),
    routeCoord('floor-1', 0, 0.00009)
  ];
  const makeInstructions = (distance) => [{
    action: { type: 'continue' },
    coordinate: pathCoordinates[0],
    distance
  }];

  assert.equal(validateNavigationInstructionsAgainstPath(makeInstructions(15), {
    pathCoordinates,
    routeDistance: 10
  }).valid, true);
  assert.equal(validateNavigationInstructionsAgainstPath(makeInstructions(15.1), {
    pathCoordinates,
    routeDistance: 10
  }).valid, false);
});

test('protects a displayed turn at the strong 45 degree threshold', () => {
  const strongPath = [
    routeCoord('floor-1', 0, 0),
    routeCoord('floor-1', 0, 0.0001),
    routeCoord('floor-1', 0.0001, 0.0002)
  ];
  const flattenedPath = [
    strongPath[0],
    strongPath[1],
    routeCoord('floor-1', 0, 0.0002)
  ];
  const instruction = {
    action: { type: 'turn', bearing: 'right' },
    coordinate: strongPath[1],
    distance: 20
  };

  assert.equal(validateNavigationInstructionsAgainstPath([instruction], {
    pathCoordinates: strongPath,
    routeDistance: 20
  }).valid, true);

  const flattened = validateNavigationInstructionsAgainstPath([instruction], {
    pathCoordinates: flattenedPath,
    routeDistance: 20
  });
  assert.equal(flattened.valid, false);
  assert.match(flattened.reason, /strong turn/i);
});

test('accepts a 90 degree corridor bend when the SDK source has no turn instruction', () => {
  const pathCoordinates = [
    routeCoord('floor-1', 0, 0),
    routeCoord('floor-1', 0, 0.0001),
    routeCoord('floor-1', 0.0001, 0.0002)
  ];
  const result = validateNavigationInstructionsAgainstPath([
    {
      action: { type: 'departure' },
      coordinate: pathCoordinates[0],
      distance: 20
    },
    {
      action: { type: 'arrival' },
      coordinate: pathCoordinates[2],
      distance: 0
    }
  ], {
    pathCoordinates,
    routeDistance: 20,
    sourceInstructions: [
      {
        action: { type: 'departure' },
        coordinate: pathCoordinates[0],
        distance: 0
      },
      {
        action: { type: 'arrival' },
        coordinate: pathCoordinates[2],
        distance: 20
      }
    ]
  });

  assert.equal(result.valid, true);
  assert.equal(result.reason, null);
});

test('rejects a simplified candidate that loses an original SDK strong turn', () => {
  const pathCoordinates = [
    routeCoord('floor-1', 0, 0),
    routeCoord('floor-1', 0, 0.0001),
    routeCoord('floor-1', 0.0001, 0.0002)
  ];
  const sourceInstructions = [
    {
      action: { type: 'departure' },
      coordinate: pathCoordinates[0],
      distance: 0
    },
    {
      action: { type: 'turn', bearing: 'right' },
      coordinate: pathCoordinates[1],
      distance: 10
    },
    {
      action: { type: 'arrival' },
      coordinate: pathCoordinates[2],
      distance: 10
    }
  ];
  const simplifiedCandidate = [
    {
      action: { type: 'departure' },
      coordinate: pathCoordinates[0],
      distance: 20
    },
    {
      action: { type: 'arrival' },
      coordinate: pathCoordinates[2],
      distance: 0
    }
  ];

  const result = validateNavigationInstructionsAgainstPath(simplifiedCandidate, {
    pathCoordinates,
    routeDistance: 20,
    sourceInstructions
  });

  assert.equal(result.valid, false);
  assert.match(result.reason, /source strong turn|original SDK strong turn/i);
});

test('assigns connection enter and exit to adjacent walking floors', () => {
  const pathCoordinates = [
    routeCoord('floor-1', 0, 0),
    routeCoord('floor-1', 0, 0.00009),
    routeCoord('floor-2', 0, 0.00009),
    routeCoord('floor-2', 0, 0.00018),
    routeCoord('floor-2', 0, 0.00027)
  ];
  const instructions = [
    {
      action: { type: 'departure' },
      coordinate: pathCoordinates[0],
      distance: 10
    },
    {
      action: { type: 'takeconnection', connection: elevator },
      coordinate: routeCoord('floor-2', 0, 0.00009),
      distance: 3
    },
    {
      action: { type: 'exitconnection', connection: elevator },
      coordinate: routeCoord('floor-1', 0, 0.00009),
      distance: 0
    },
    {
      action: { type: 'continue' },
      coordinate: pathCoordinates[3],
      distance: 10
    },
    {
      action: { type: 'arrival' },
      coordinate: pathCoordinates[4],
      distance: 0
    }
  ];

  const result = validateNavigationInstructionsAgainstPath(instructions, {
    pathCoordinates,
    routeDistance: 23
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.coordinateIndices, [0, 1, 2, 3, 4]);
  assert.deepEqual(result.coordinateFloorIds, [
    'floor-1',
    'floor-1',
    'floor-2',
    'floor-2',
    'floor-2'
  ]);
});

test('does not map an instruction through coordinates from another leg', () => {
  const repeatedCoordinateOnOtherLeg = routeCoord('floor-1', 0, 0);
  const currentLegPath = [
    routeCoord('floor-1', 0.001, 0.001),
    routeCoord('floor-1', 0.001, 0.0011)
  ];
  const result = validateNavigationInstructionsAgainstPath([
    {
      action: { type: 'continue' },
      coordinate: repeatedCoordinateOnOtherLeg,
      distance: 11
    }
  ], {
    pathCoordinates: currentLegPath,
    routeDistance: 11,
    otherLegCoordinates: [repeatedCoordinateOnOtherLeg]
  });

  assert.equal(result.valid, false);
  assert.deepEqual(result.coordinateIndices, [-1]);
});

test('adapts kiosk to check-in to gate boundaries without merging across the stopover', () => {
  const kiosk = routeCoord('floor-1', 0, 0);
  const checkin = routeCoord('floor-1', 0, 0.0001);
  const gate = routeCoord('floor-1', 0, 0.0002);
  const firstDirections = {
    coordinates: [kiosk, checkin],
    instructions: [
      { action: { type: 'departure' }, coordinate: kiosk, distance: 0 },
      { action: { type: 'arrival' }, coordinate: checkin, distance: 11 }
    ],
    distance: 11
  };
  const secondDirections = {
    coordinates: [checkin, gate],
    instructions: [
      { action: { type: 'departure' }, coordinate: checkin, distance: 0 },
      { action: { type: 'arrival' }, coordinate: gate, distance: 11 }
    ],
    distance: 11
  };
  const prepared = [
    prepareNavigationLeg(firstDirections, { legIndex: 0 }),
    prepareNavigationLeg(secondDirections, { legIndex: 1 })
  ];

  const result = aggregateNavigationLegs(prepared, {
    waypointLabels: ['Kiosk A', 'Check-in C12', 'Gate 40']
  });

  assert.deepEqual(result.legDirections, [firstDirections, secondDirections]);
  assert.deepEqual(result.uiDirections.coordinates, [kiosk, checkin, gate]);
  assert.deepEqual(
    result.uiDirections.instructions.map((instruction) => instruction.action.type),
    ['departure', 'stopover', 'arrival']
  );
  assert.equal(result.uiDirections.instructions[1].action.instruction, 'Check-in C12');
  assert.equal(
    result.uiDirections.instructions.filter((instruction) => instruction.action.type === 'stopover').length,
    1
  );
  assert.equal(result.uiDirections.distance, 22);
  assert.deepEqual(result.legSpans, [
    {
      legIndex: 0,
      coordinateStartIndex: 0,
      coordinateEndIndex: 1,
      instructionStartIndex: 0,
      instructionEndIndex: 1
    },
    {
      legIndex: 1,
      coordinateStartIndex: 1,
      coordinateEndIndex: 2,
      instructionStartIndex: 2,
      instructionEndIndex: 2
    }
  ]);
});

test('uses raw SDK instructions only for the leg whose validation fails', () => {
  const firstStart = routeCoord('floor-1', 0, 0);
  const boundary = routeCoord('floor-1', 0, 0.0001);
  const finalCoordinate = routeCoord('floor-1', 0, 0.0002);
  const validDirections = {
    coordinates: [firstStart, boundary],
    instructions: [
      { action: { type: 'departure' }, coordinate: firstStart, distance: 0 },
      { action: { type: 'arrival' }, coordinate: boundary, distance: 11 }
    ],
    distance: 11
  };
  const rawInvalidInstructions = [
    {
      action: { type: 'departure', instruction: 'RAW LEG TWO' },
      coordinate: boundary,
      distance: 0
    },
    {
      action: { type: 'turn', bearing: 'left', instruction: 'RAW OFF PATH' },
      coordinate: routeCoord('floor-1', 0.001, 0.001),
      distance: 10
    },
    { action: { type: 'arrival' }, coordinate: finalCoordinate, distance: 10 }
  ];
  const invalidDirections = {
    coordinates: [boundary, finalCoordinate],
    instructions: rawInvalidInstructions,
    distance: 20
  };
  const firstPrepared = prepareNavigationLeg(validDirections, { legIndex: 0 });
  const secondPrepared = prepareNavigationLeg(invalidDirections, { legIndex: 1 });

  assert.equal(firstPrepared.usedFallback, false);
  assert.equal(firstPrepared.instructionSource, 'simplified');
  assert.equal(secondPrepared.usedFallback, true);
  assert.equal(secondPrepared.instructionSource, 'sdk-raw');
  assert.deepEqual(
    secondPrepared.legInstructions.map((instruction) => instruction.action.type),
    ['departure', 'turn', 'arrival']
  );
  assert.deepEqual(
    secondPrepared.legInstructions.map((instruction) => instruction.distance),
    [10, 10, 0]
  );
  assert.deepEqual(rawInvalidInstructions.map((instruction) => instruction.distance), [0, 10, 10]);

  const aggregate = aggregateNavigationLegs([firstPrepared, secondPrepared], {
    waypointLabels: ['Kiosk A', 'Check-in C12', 'Gate 40']
  });
  assert.deepEqual(
    aggregate.uiDirections.instructions.map((instruction) => instruction.action.type),
    ['departure', 'stopover', 'turn', 'arrival']
  );
  assert.equal(aggregate.uiDirections.instructions[1].action.instruction, 'Check-in C12');
  assert.equal(aggregate.uiDirections.instructions[2].action.instruction, 'RAW OFF PATH');
});

test('prepare and aggregate navigation legs do not mutate SDK directions or options', () => {
  const start = routeCoord('floor-1', 0, 0);
  const boundary = routeCoord('floor-1', 0, 0.0001);
  const end = routeCoord('floor-1', 0, 0.0002);
  const directions = [
    {
      coordinates: [start, boundary],
      instructions: [
        { action: { type: 'departure' }, coordinate: start, distance: 0 },
        { action: { type: 'arrival' }, coordinate: boundary, distance: 11 }
      ],
      distance: 11
    },
    {
      coordinates: [boundary, end],
      instructions: [
        { action: { type: 'departure' }, coordinate: boundary, distance: 0 },
        { action: { type: 'arrival' }, coordinate: end, distance: 11 }
      ],
      distance: 11
    }
  ];
  const options = {
    waypointLabels: ['Kiosk A', 'Check-in C12', 'Gate 40']
  };
  const directionsSnapshot = structuredClone(directions);
  const optionsSnapshot = structuredClone(options);

  const prepared = directions.map((leg, legIndex) => prepareNavigationLeg(leg, { legIndex }));
  const aggregate = aggregateNavigationLegs(prepared, options);
  aggregate.uiDirections.instructions[1].distance = 98;
  aggregate.uiDirections.instructions[1].action.type = 'changed';

  assert.deepEqual(directions, directionsSnapshot);
  assert.deepEqual(options, optionsSnapshot);
});

test('aggregate preserves SDK Coordinate identity in route and instruction coordinates', () => {
  const anchorTarget = { id: 'sdk-anchor-target' };
  const start = new GetterBackedCoordinate('floor-1', 0, 0, anchorTarget);
  const end = new GetterBackedCoordinate('floor-1', 0, 0.0001, anchorTarget);
  const departure = { action: { type: 'departure' }, coordinate: start, distance: 0 };
  const arrival = { action: { type: 'arrival' }, coordinate: end, distance: 11 };
  const directions = {
    coordinates: [start, end],
    instructions: [departure, arrival],
    distance: 11
  };

  const prepared = prepareNavigationLeg(directions, { legIndex: 0 });
  const aggregate = aggregateNavigationLegs([prepared]);

  assert.notEqual(aggregate.uiDirections.coordinates, directions.coordinates);
  assert.equal(aggregate.uiDirections.coordinates[0], start);
  assert.equal(aggregate.uiDirections.coordinates[1], end);
  assert.equal(Object.getPrototypeOf(aggregate.uiDirections.coordinates[0]), GetterBackedCoordinate.prototype);
  assert.equal(aggregate.uiDirections.coordinates[0].anchorTarget, anchorTarget);
  assert.equal(aggregate.uiDirections.instructions[0].coordinate, start);
  assert.equal(aggregate.uiDirections.instructions[1].coordinate, end);
  assert.equal(
    Object.getPrototypeOf(aggregate.uiDirections.instructions[0].coordinate),
    GetterBackedCoordinate.prototype
  );
  assert.equal(aggregate.uiDirections.instructions[0].coordinate.anchorTarget, anchorTarget);
  assert.notEqual(aggregate.uiDirections.instructions[0], departure);
  assert.notEqual(aggregate.uiDirections.instructions[0].action, departure.action);

  aggregate.uiDirections.instructions[0].distance = 99;
  aggregate.uiDirections.instructions[0].action.type = 'changed';
  assert.equal(departure.distance, 0);
  assert.equal(departure.action.type, 'departure');
});

test('normalizes realistic SDK distances for valid and raw-fallback short legs', () => {
  const start = routeCoord('floor-1', 0, 0);
  const end = routeCoord('floor-1', 0, 0.0002);
  const validDirections = {
    coordinates: [start, end],
    instructions: [
      { action: { type: 'departure' }, coordinate: start, distance: 0 },
      { action: { type: 'arrival' }, coordinate: end, distance: 22 }
    ],
    distance: 22
  };
  const invalidDirections = {
    coordinates: [start, end],
    instructions: [
      { action: { type: 'departure' }, coordinate: start, distance: 0 },
      {
        action: { type: 'arrival' },
        coordinate: routeCoord('floor-1', 0.001, 0.001),
        distance: 22
      }
    ],
    distance: 22
  };

  const valid = prepareNavigationLeg(validDirections, { legIndex: 0 });
  const fallback = prepareNavigationLeg(invalidDirections, { legIndex: 1 });

  assert.equal(valid.usedFallback, false);
  assert.equal(valid.legInstructions[0].action.type, 'departure');
  assert.equal(getInstructionDisplayDistance(valid.legInstructions[0]), 22);
  assert.equal(shouldRenderNavigationInstruction(valid.legInstructions[0]), true);
  assert.equal(getRouteDisplayDistanceMeters(valid.legInstructions), 22);

  assert.equal(fallback.usedFallback, true);
  assert.deepEqual(
    fallback.legInstructions.map((instruction) => instruction.action.type),
    ['departure', 'arrival']
  );
  assert.equal(getInstructionDisplayDistance(fallback.legInstructions[0]), 22);
  assert.equal(shouldRenderNavigationInstruction(fallback.legInstructions[0]), true);
  assert.equal(getRouteDisplayDistanceMeters(fallback.legInstructions), 22);
  assert.deepEqual(invalidDirections.instructions.map((instruction) => instruction.distance), [0, 22]);
});

test('preserves post-connection walking distance in getter-backed raw fallback aggregation', () => {
  for (const { type, expectedConnectionDistance } of [
    { type: 'elevator', expectedConnectionDistance: 3 },
    { type: 'escalator', expectedConnectionDistance: 6 }
  ]) {
    const connection = new GetterBackedConnection(
      `${type}-getter`,
      type,
      `Getter ${type}`
    );
    const start = routeCoord('floor-1', 0, 0);
    const sourceConnection = routeCoord('floor-1', 0, 0.00009);
    const targetConnection = routeCoord('floor-2', 0, 0.00009);
    const end = routeCoord('floor-2', 0, 0.00018);
    const rawInstructions = [
      new GetterBackedInstruction(
        new GetterBackedAction('departure'),
        start,
        0
      ),
      new GetterBackedInstruction(
        new GetterBackedAction('takeconnection', { connection }),
        targetConnection,
        10
      ),
      new GetterBackedInstruction(
        new GetterBackedAction('exitconnection', { connection }),
        sourceConnection,
        0
      ),
      new GetterBackedInstruction(
        new GetterBackedAction('arrival'),
        routeCoord('floor-2', 0.001, 0.001),
        10
      )
    ];
    const directions = {
      coordinates: [start, sourceConnection, targetConnection, end],
      instructions: rawInstructions,
      distance: 20
    };

    const prepared = prepareNavigationLeg(directions, { legIndex: 0 });
    const aggregate = aggregateNavigationLegs([prepared]);
    const enterInstruction = aggregate.uiDirections.instructions.find(
      (instruction) => instruction.action.type === 'takeconnection'
    );
    const exitInstruction = aggregate.uiDirections.instructions.find(
      (instruction) => instruction.action.type === 'exitconnection'
    );

    assert.equal(prepared.usedFallback, true);
    assert.deepEqual(
      aggregate.uiDirections.instructions.map((instruction) => instruction.distance),
      [10, expectedConnectionDistance, 10, 0]
    );
    assert.equal(enterInstruction.action.connection, connection);
    assert.equal(enterInstruction.action.connection.type, type);
    assert.equal(getInstructionDisplayDistance(enterInstruction), expectedConnectionDistance);
    assert.equal(exitInstruction.action.connection, connection);
    assert.equal(getInstructionDisplayDistance(exitInstruction), 10);
    assert.equal(shouldRenderNavigationInstruction(exitInstruction), true);
    assert.equal(prepared.validation.displayDistance, 20 + expectedConnectionDistance);
    assert.equal(prepared.validation.walkingDisplayDistance, 20);
    assert.equal(prepared.validation.distanceDeviation, 0);
    assert.equal(aggregate.uiDirections.instructions[0].distance, 10);
    assert.equal(rawInstructions[0].distance, 0);
    assert.equal(rawInstructions[1].distance, 10);
    assert.equal(rawInstructions[2].distance, 0);
    assert.equal(rawInstructions[3].distance, 10);
  }
});
