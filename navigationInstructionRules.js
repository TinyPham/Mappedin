const CONNECTION_ACTIONS = new Set(['enter', 'exit', 'takeconnection', 'exitconnection']);
const FLOOR_RANK_BY_ID = new Map([
  ['m_dae8f26a40f6017f', 0],
  ['m_41a38d6d0411d397', 1],
  ['m_d4b5674c0b15e099', 2],
  ['m_1523f7dcde647c40', 3]
]);

function actionTypeOf(instruction) {
  return (instruction?.action?.type || '').toLowerCase();
}

function cloneInstructions(instructions) {
  return JSON.parse(JSON.stringify(instructions || []));
}

function isEnterAction(type) {
  return type === 'enter' || type === 'takeconnection';
}

function isExitAction(type) {
  return type === 'exit' || type === 'exitconnection';
}

function isConnectionAction(type) {
  return type.includes('connection') || CONNECTION_ACTIONS.has(type);
}

function isElevatorConnection(connection) {
  const type = (connection?.type || '').toLowerCase();
  const name = (connection?.name || '').toLowerCase();
  return type.includes('elevator') || name.includes('elevator') || name.includes('thang may') || name.includes('thang máy');
}

function getCoordinateFloorId(coord) {
  return coord?.floorId || coord?.floor?.id || null;
}

function getObjectFloorId(obj, anchor) {
  return obj?.floor?.id || obj?.floorId || anchor?.floorId || anchor?.floor?.id || null;
}

export function getObjectAnchor(obj) {
  if (!obj) return null;
  if (obj.anchor) return obj.anchor;
  if (obj.coordinate) return obj.coordinate;
  if (obj.center) return obj.center;
  if (obj.centroid) return obj.centroid;
  if (obj.entrances?.length > 0 && obj.entrances[0].coordinate) return obj.entrances[0].coordinate;
  if (obj.navigableNodes?.length > 0) {
    const node = obj.navigableNodes[0];
    return node.coordinate || node.anchor || null;
  }
  return null;
}

export function calcDistanceMeters(coord1, coord2) {
  if (!coord1 || !coord2) return Infinity;
  const lat1 = coord1.latitude ?? coord1.lat;
  const lng1 = coord1.longitude ?? coord1.lng;
  const lat2 = coord2.latitude ?? coord2.lat;
  const lng2 = coord2.longitude ?? coord2.lng;
  if (lat1 === undefined || lng1 === undefined || lat2 === undefined || lng2 === undefined) return Infinity;

  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestPathIndex(coord, pathCoordinates) {
  if (!coord || !Array.isArray(pathCoordinates) || pathCoordinates.length === 0) return -1;
  const coordFloorId = getCoordinateFloorId(coord);
  let bestIndex = -1;
  let bestDistance = Infinity;
  for (let i = 0; i < pathCoordinates.length; i++) {
    const pathFloorId = getCoordinateFloorId(pathCoordinates[i]);
    if (coordFloorId && pathFloorId && coordFloorId !== pathFloorId) continue;
    const dist = calcDistanceMeters(coord, pathCoordinates[i]);
    if (dist < bestDistance) {
      bestDistance = dist;
      bestIndex = i;
    }
  }
  return bestIndex;
}

function pathDistanceBetween(pathCoordinates, startIndex, endIndex) {
  if (!Array.isArray(pathCoordinates) || startIndex < 0 || endIndex <= startIndex) return 0;
  let total = 0;
  for (let i = startIndex; i < endIndex; i++) {
    total += calcDistanceMeters(pathCoordinates[i], pathCoordinates[i + 1]);
  }
  return total;
}

function pathTurnAngle(prev, current, next) {
  if (!prev || !current || !next) return 0;
  const prevLng = prev.longitude ?? prev.lng;
  const prevLat = prev.latitude ?? prev.lat;
  const currLng = current.longitude ?? current.lng;
  const currLat = current.latitude ?? current.lat;
  const nextLng = next.longitude ?? next.lng;
  const nextLat = next.latitude ?? next.lat;
  if ([prevLng, prevLat, currLng, currLat, nextLng, nextLat].some((value) => value === undefined)) return 0;

  const v1x = currLng - prevLng;
  const v1y = currLat - prevLat;
  const v2x = nextLng - currLng;
  const v2y = nextLat - currLat;
  const len1 = Math.hypot(v1x, v1y);
  const len2 = Math.hypot(v2x, v2y);
  if (len1 === 0 || len2 === 0) return 0;
  const dot = Math.max(-1, Math.min(1, (v1x * v2x + v1y * v2y) / (len1 * len2)));
  return Math.acos(dot) * 180 / Math.PI;
}

function findFirstStrongTurnIndexAfter(pathCoordinates, startIndex, endIndex) {
  if (!Array.isArray(pathCoordinates) || startIndex < 0 || endIndex <= startIndex + 1) return -1;
  const floorId = getCoordinateFloorId(pathCoordinates[startIndex]);
  for (let i = Math.max(1, startIndex + 1); i < Math.min(endIndex, pathCoordinates.length - 1); i++) {
    if (floorId && getCoordinateFloorId(pathCoordinates[i]) !== floorId) continue;
    const beforeDistance = pathDistanceBetween(pathCoordinates, startIndex, i);
    const afterDistance = pathDistanceBetween(pathCoordinates, i, endIndex);
    if (beforeDistance < 5 || afterDistance <= 0) continue;
    const angle = pathTurnAngle(pathCoordinates[i - 1], pathCoordinates[i], pathCoordinates[i + 1]);
    if (angle >= 45) return i;
  }
  return -1;
}

function splitExitAtStrongTurn(exitStep, turnStep, followingStep, pathCoordinates) {
  if (actionTypeOf(turnStep) !== 'turn' || !Array.isArray(pathCoordinates) || pathCoordinates.length < 3) return null;
  const startIndex = nearestPathIndex(exitStep.coordinate, pathCoordinates);
  const endCoord = followingStep?.coordinate || turnStep.coordinate || pathCoordinates[pathCoordinates.length - 1];
  const endIndex = nearestPathIndex(endCoord, pathCoordinates);
  if (startIndex < 0 || endIndex <= startIndex + 1) return null;

  const turnIndex = findFirstStrongTurnIndexAfter(pathCoordinates, startIndex, endIndex);
  if (turnIndex < 0) return null;

  const beforeDistance = Math.round(pathDistanceBetween(pathCoordinates, startIndex, turnIndex));
  const afterDistance = Math.round(pathDistanceBetween(pathCoordinates, turnIndex, endIndex));
  if (beforeDistance <= 0 || afterDistance <= 0) return null;

  exitStep._mergedNextAction = { type: 'continue' };
  exitStep._mergedNextInstruction = '';
  exitStep.distance = beforeDistance;
  exitStep.originalDistance = beforeDistance;
  exitStep._displayDistance = beforeDistance;

  const splitTurn = JSON.parse(JSON.stringify(turnStep));
  splitTurn.coordinate = pathCoordinates[turnIndex];
  splitTurn.distance = afterDistance;
  splitTurn.originalDistance = afterDistance;
  splitTurn._displayDistance = afterDistance;
  return splitTurn;
}

export function findNearbyLandmark(coord, currentFloorId, mapObjects, options = {}) {
  if (!coord || !currentFloorId) return null;

  const maxDist = options.maxDist ?? 15;
  const getName = options.getName || ((obj) => obj?.name);
  const excludeNames = [
    'cua hang ban le',
    'cửa hàng bán lẻ',
    ...(options.excludeNames || [])
  ];
  let bestLandmark = null;
  let minDist = maxDist;

  for (const obj of mapObjects || []) {
    const anchor = getObjectAnchor(obj);
    const objectFloorId = getObjectFloorId(obj, anchor);
    if (objectFloorId !== currentFloorId) continue;

    const name = getName(obj) || obj?.name;
    if (!name || name.length < 3) continue;
    if (excludeNames.some((ex) => name.toLowerCase().includes(ex.toLowerCase()))) continue;

    const dist = calcDistanceMeters(coord, anchor);
    if (dist < minDist) {
      minDist = dist;
      bestLandmark = name;
    }
  }

  return bestLandmark;
}

function tryMergeShortTurn(current, next, nextNext) {
  const nextBearing = (next.action?.bearing || '').toString().toLowerCase();
  if (actionTypeOf(next) !== 'turn') return false;
  if ((next.distance || 0) < 3) return true;
  if ((next.distance || 0) >= 10) return false;

  const cCoord = current.coordinate;
  const nCoord = next.coordinate;
  const nnCoord = nextNext?.coordinate;
  if (!cCoord || !nCoord || !nnCoord) return (next.distance || 0) < 8;

  const dLat1 = (nCoord.latitude || 0) - (cCoord.latitude || 0);
  const dLng1 = (nCoord.longitude || 0) - (cCoord.longitude || 0);
  const dLat2 = (nnCoord.latitude || 0) - (nCoord.latitude || 0);
  const dLng2 = (nnCoord.longitude || 0) - (nCoord.longitude || 0);
  if ((Math.abs(dLat1) + Math.abs(dLng1)) <= 0.0000001 || (Math.abs(dLat2) + Math.abs(dLng2)) <= 0.0000001) {
    return (next.distance || 0) < 8;
  }

  const h1 = Math.atan2(dLng1, dLat1) * 180 / Math.PI;
  const h2 = Math.atan2(dLng2, dLat2) * 180 / Math.PI;
  let angleDiff = Math.abs(h2 - h1);
  if (angleDiff > 180) angleDiff = 360 - angleDiff;
  if (angleDiff < 30) {
    current.action.type = 'continue';
    current.action.bearing = '';
    current.action.instruction = '';
    current.instruction = '';
    return true;
  }

  return false;
}

export function simplifyNavigationInstructions(instructions, options = {}) {
  const source = cloneInstructions(instructions);
  const pathCoordinates = options.pathCoordinates || [];
  if (source.length === 0) return [];

  const merged = [];
  let current = source[0];

  for (let i = 1; i < source.length; i++) {
    const next = source[i];
    const currentType = actionTypeOf(current);
    const nextType = actionTypeOf(next);
    const currentBearing = (current.action?.bearing || '').toString().toLowerCase();
    const nextBearing = (next.action?.bearing || '').toString().toLowerCase();

    if (isConnectionAction(currentType) || isConnectionAction(nextType)) {
      const sameConnection = current.action?.connection?.id && next.action?.connection?.id &&
        current.action.connection.id === next.action.connection.id;
      if (sameConnection && isEnterAction(currentType) && isEnterAction(nextType)) {
        current.distance = (current.distance || 0) + (next.distance || 0);
        if (next.time !== undefined) current.time = (current.time || 0) + next.time;
        if (next.duration !== undefined) current.duration = (current.duration || 0) + next.duration;
        continue;
      }
      merged.push(current);
      current = next;
      continue;
    }

    let shouldMerge = false;
    let overrideAction = false;
    const isStart = currentType === 'departure' || currentType === 'start';
    const isNextSlight = nextType === 'turn' && nextBearing.includes('slight');

    if (isStart && ((nextType === 'continue' && (next.distance || 0) < 15) || (isNextSlight && (next.distance || 0) < 5))) {
      shouldMerge = true;
    }

    if (!shouldMerge && currentType === 'turn' && nextType === 'turn') {
      const opposite = (currentBearing.includes('left') && nextBearing.includes('right')) ||
        (currentBearing.includes('right') && nextBearing.includes('left'));
      if (opposite && ((current.distance || 0) + (next.distance || 0)) < 12) {
        shouldMerge = true;
        current.action.type = 'continue';
        current.action.bearing = '';
        current.action.instruction = '';
        current.instruction = '';
      }
    }

    if (!shouldMerge && currentType === 'turn' && nextType === 'turn') {
      const same = (currentBearing.includes('left') && nextBearing.includes('left')) ||
        (currentBearing.includes('right') && nextBearing.includes('right'));
      if (same && (current.distance || 0) < 8) {
        shouldMerge = true;
        overrideAction = true;
      }
    }

    if (!shouldMerge && currentType === 'continue' && nextType === 'continue') shouldMerge = true;
    if (!shouldMerge && (next.distance || 0) < 3 && !isConnectionAction(nextType) && nextType !== 'arrival' && nextType !== 'arrive') shouldMerge = true;
    if (!shouldMerge && tryMergeShortTurn(current, next, source[i + 1])) shouldMerge = true;

    if (shouldMerge) {
      current.distance = (current.distance || 0) + (next.distance || 0);
      if (next.time !== undefined) current.time = (current.time || 0) + next.time;
      if (next.duration !== undefined) current.duration = (current.duration || 0) + next.duration;
      if (overrideAction) current.action = next.action;
    } else {
      merged.push(current);
      current = next;
    }
  }

  merged.push(current);

  const postMerged = [];
  for (const step of merged) {
    const stepType = actionTypeOf(step);
    const prevStep = postMerged[postMerged.length - 1];
    const prevType = actionTypeOf(prevStep);
    if ((prevType === 'departure' || prevType === 'start') && stepType === 'continue') {
      prevStep.distance = (prevStep.distance || 0) + (step.distance || 0);
    } else {
      postMerged.push(step);
    }
  }

  const withExitMerged = [];
  for (let i = 0; i < postMerged.length; i++) {
    const step = postMerged[i];
    const stepType = actionTypeOf(step);
    const nextStep = postMerged[i + 1];
    const followingStep = postMerged[i + 2];
    const nextStepType = actionTypeOf(nextStep);
    if (isExitAction(stepType) && nextStep && (nextStepType === 'turn' || nextStepType === 'continue')) {
      const followingStepType = actionTypeOf(followingStep);
      const splitTurn = splitExitAtStrongTurn(step, nextStep, followingStep, pathCoordinates);
      if (splitTurn) {
        if (nextStep.time !== undefined) step.time = (step.time || 0) + nextStep.time;
        withExitMerged.push(step);
        withExitMerged.push(splitTurn);
        i += followingStepType === 'turn' && (followingStep.distance || 0) <= 15 ? 2 : 1;
      } else {
        step._mergedNextAction = nextStep.action;
        step._mergedNextInstruction = nextStep.instruction;
        step.distance = nextStep.distance || 0;
        if (nextStep.time !== undefined) step.time = (step.time || 0) + nextStep.time;
        withExitMerged.push(step);
        i++;
      }
    } else {
      withExitMerged.push(step);
    }
  }

  const cleaned = [];
  for (let i = 0; i < withExitMerged.length; i++) {
    const step = withExitMerged[i];
    const stepType = actionTypeOf(step);
    const nextStepType = actionTypeOf(withExitMerged[i + 1]);
    const standaloneConnection = stepType === 'takeconnection' && !step.action?.connection;
    const shortContinueBeforeConnection = stepType === 'continue' && isEnterAction(nextStepType) && (step.distance || 0) < 10;
    const turnBeforeConnection = stepType === 'turn' && isEnterAction(nextStepType);

    if (standaloneConnection || shortContinueBeforeConnection || turnBeforeConnection) {
      const prev = cleaned[cleaned.length - 1];
      if (prev) prev.distance = (prev.distance || 0) + (step.distance || 0);
      continue;
    }
    cleaned.push(step);
  }

  cleaned.forEach((step) => {
    step.originalDistance = step.distance || 0;
  });

  for (let i = 0; i < cleaned.length - 1; i++) {
    const curr = cleaned[i];
    const next = cleaned[i + 1];
    const currType = actionTypeOf(curr);
    const nextType = actionTypeOf(next);
    if (isExitAction(currType)) {
      curr.distance = curr._mergedNextAction ? (curr.originalDistance || curr.distance || 0) : 0;
    } else if (isEnterAction(currType) && isExitAction(nextType)) {
      curr.distance = isElevatorConnection(curr.action?.connection) ? 3 : 6;
    } else {
      curr.distance = next.originalDistance || next.distance || 0;
    }
  }

  if (cleaned.length > 0) cleaned[cleaned.length - 1].distance = 0;
  return cleaned;
}

function parseFloorNumber(name) {
  const match = String(name || '').match(/\d+/);
  return match ? Number(match[0]) : null;
}

function readFloorHeight(floor) {
  if (!floor) return null;
  for (const key of ['elevation', 'altitude', 'level', 'z', 'verticalOffset', 'height']) {
    const value = Number(floor[key]);
    if (Number.isFinite(value)) return value;
  }
  return null;
}

function connectionDirectionText(direction, t) {
  if (direction > 0) return ` ${t('connection_direction_up', 'len')}`;
  if (direction < 0) return ` ${t('connection_direction_down', 'xuong')}`;
  return '';
}

function findFloorById(floors, floorId) {
  return (floors || []).find((floor) => floor.id === floorId || floor.mappedinId === floorId || floor.code === floorId) || null;
}

function resolveFloorName(floorId, floor, getFloorName) {
  const translatedName = getFloorName?.(floorId, floor?.name || '');
  if (translatedName && translatedName !== floorId) return translatedName;
  return floor?.name || translatedName || '';
}

function resolveFloorDirection(currentFloorId, targetFloorId, floors, t, getFloorName) {
  if (!currentFloorId || !targetFloorId || currentFloorId === targetFloorId) return '';
  const floorList = floors || [];
  const currentFloor = findFloorById(floorList, currentFloorId);
  const targetFloor = findFloorById(floorList, targetFloorId);
  const currentIndex = floorList.indexOf(currentFloor);
  const targetIndex = floorList.indexOf(targetFloor);
  const currentRank = FLOOR_RANK_BY_ID.get(currentFloorId);
  const targetRank = FLOOR_RANK_BY_ID.get(targetFloorId);
  if (currentRank !== undefined && targetRank !== undefined && currentRank !== targetRank) {
    return connectionDirectionText(targetRank - currentRank, t);
  }

  const currentName = resolveFloorName(currentFloorId, currentFloor, getFloorName);
  const targetName = resolveFloorName(targetFloorId, targetFloor, getFloorName);
  const currentNumber = parseFloorNumber(currentName);
  const targetNumber = parseFloorNumber(targetName);
  if (currentNumber !== null && targetNumber !== null && currentNumber !== targetNumber) {
    return connectionDirectionText(targetNumber - currentNumber, t);
  }

  const currentHeight = readFloorHeight(currentFloor);
  const targetHeight = readFloorHeight(targetFloor);
  if (currentHeight !== null && targetHeight !== null && currentHeight !== targetHeight) {
    return connectionDirectionText(targetHeight - currentHeight, t);
  }

  if (currentIndex >= 0 && targetIndex >= 0 && currentIndex !== targetIndex) {
    return connectionDirectionText(targetIndex - currentIndex, t);
  }

  return '';
}

function findTargetFloorIdForEnter(instruction, allInstructions, currentIndex) {
  const currentFloorId = getCoordinateFloorId(instruction.coordinate);
  for (let i = currentIndex + 1; i < allInstructions.length; i++) {
    const floorId = getCoordinateFloorId(allInstructions[i]?.coordinate);
    if (floorId && floorId !== currentFloorId) return floorId;
  }
  return currentFloorId;
}

function findCurrentFloorIdForEnter(instruction, allInstructions, currentIndex, targetFloorId) {
  const currentFloorId = getCoordinateFloorId(instruction.coordinate);
  if (currentFloorId && currentFloorId !== targetFloorId) return currentFloorId;

  for (let i = currentIndex - 1; i >= 0; i--) {
    const floorId = getCoordinateFloorId(allInstructions[i]?.coordinate);
    if (floorId && floorId !== targetFloorId) return floorId;
  }

  return currentFloorId;
}

export function createInstructionFormatter(options) {
  const floors = options.floors || [];
  const mapObjects = options.mapObjects || [];
  const usedLandmarks = new Set();
  const t = options.t || ((_key, fallback) => fallback);
  const getFloorName = options.getFloorName || (() => '');
  const getName = options.getName || ((obj) => obj?.name);
  const landmarkMaxDist = options.landmarkMaxDist ?? 15;

  function landmarkTextFor(instruction) {
    const coord = instruction?.coordinate;
    const stepFloorId = getCoordinateFloorId(coord);
    const near = findNearbyLandmark(coord, stepFloorId, mapObjects, { maxDist: landmarkMaxDist, getName });
    if (!near) return '';
    const key = near.toLowerCase();
    if (usedLandmarks.has(key)) return '';
    usedLandmarks.add(key);
    return ` ${t('near', 'gan')} ${near}`;
  }

  function format(instruction, allInstructions, currentIndex) {
    const actionType = actionTypeOf(instruction) || 'continue';
    const bearing = (instruction.action?.bearing || '').toLowerCase();
    const connection = instruction.action?.connection;
    const mappedinText = instruction.action?.instruction || instruction.instruction || '';

    if (connection) {
      const isEnter = isEnterAction(actionType);
      const isExit = isExitAction(actionType);
      const connName = getName(connection) || connection.name || '';
      const name = isElevatorConnection(connection) ? t('elevator', 'thang may') : (connName || t('escalator', 'thang cuon'));
      const stepFloorId = getCoordinateFloorId(instruction.coordinate);
      const targetFloorId = isEnter ? findTargetFloorIdForEnter(instruction, allInstructions, currentIndex) : stepFloorId;
      const currentFloorId = isEnter
        ? findCurrentFloorIdForEnter(instruction, allInstructions, currentIndex, targetFloorId)
        : stepFloorId;
      const floorName = targetFloorId ? getFloorName(targetFloorId) : '';
      const floorText = floorName ? ` ${isEnter ? '' : `${t('at_floor_label', 'tai')} `}${floorName}` : '';

      if (isEnter) {
        const action = isElevatorConnection(connection) ? t('action_enter', 'Vao') : t('action_take', 'Di');
        const dirText = resolveFloorDirection(currentFloorId, targetFloorId, floors, t, getFloorName);
        return `${action} ${name}${dirText}${floorText}`;
      }

      if (isExit) {
        const mergedAction = instruction._mergedNextAction;
        if (mergedAction) {
          let nextActionText = t('action_go_straight_lower', 'di thang');
          return `${t('action_exit', 'Ra')} ${name}${floorText} ${t('direction_connector_and', 'va')} ${nextActionText}`;
        }
        return `${t('action_exit', 'Ra')} ${name}${floorText}${landmarkTextFor(instruction)}`;
      }

      return `${t('action_use', 'Su dung')} ${name}${floorText}${landmarkTextFor(instruction)}`;
    }

    if (currentIndex === 0 && (actionType === 'start' || actionType === 'departure')) {
      return `${t('action_departure', 'Khoi hanh')} - ${t('action_go_straight', 'Di thang')}`;
    }

    if (actionType === 'turn' || bearing.includes('turn') || bearing.includes('left') || bearing.includes('right')) {
      if (mappedinText) {
        const text = mappedinText
          .replace(/Turn\s+left/gi, t('action_turn_left', 'Re trai'))
          .replace(/Turn\s+right/gi, t('action_turn_right', 'Re phai'))
          .replace(/Turn\s+around/gi, t('action_turn_around', 'Quay lai'))
          .replace(/Slight\s+left/gi, t('action_slight_left', 'Re trai nhe'))
          .replace(/Slight\s+right/gi, t('action_slight_right', 'Re phai nhe'));
        return `${text}${landmarkTextFor(instruction)}`;
      }
      if (bearing.includes('left')) return `${t('action_turn_left', 'Re trai')}${landmarkTextFor(instruction)}`;
      if (bearing.includes('right')) return `${t('action_turn_right', 'Re phai')}${landmarkTextFor(instruction)}`;
      return `${t('action_turn', 'Re')}${landmarkTextFor(instruction)}`;
    }

    const actionMap = {
      arrival: t('action_arrival', 'Ket thuc'),
      continue: t('action_go_straight', 'Di thang'),
      arrive: t('action_arrive', 'Den noi'),
      stopover: mappedinText || 'Diem dung',
      departure: t('action_departure', 'Khoi hanh')
    };

    const baseText = actionMap[actionType] || mappedinText || actionType;
    return actionType === 'continue' ? `${baseText}${landmarkTextFor(instruction)}` : baseText;
  }

  return { format };
}

export function isInstructionConnection(instruction) {
  return isConnectionAction(actionTypeOf(instruction));
}

export function isInstructionEnter(instruction) {
  return isEnterAction(actionTypeOf(instruction));
}

export function isInstructionExit(instruction) {
  return isExitAction(actionTypeOf(instruction));
}

export function getConnectionDisplayDistance(instruction) {
  if (Number.isFinite(instruction?._displayDistance)) return Math.round(instruction._displayDistance);
  if (!isInstructionConnection(instruction)) return Math.round(instruction?.distance || 0);
  if (isInstructionEnter(instruction)) return isElevatorConnection(instruction?.action?.connection) ? 3 : 6;
  if (isInstructionExit(instruction) && instruction?._mergedNextAction) return Math.round(instruction.distance || 0);
  return 0;
}

export function getInstructionDisplayDistance(instruction) {
  return getConnectionDisplayDistance(instruction);
}

function roundRouteDistance(distance, coordinates) {
  if (Number.isFinite(distance) && distance > 0) return Math.max(1, Math.round(distance));
  if (!Array.isArray(coordinates) || coordinates.length < 2) return 0;

  let total = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    total += calcDistanceMeters(coordinates[i], coordinates[i + 1]);
  }
  return total > 0 ? Math.max(1, Math.round(total)) : 0;
}

function isArrivalInstruction(instruction) {
  const type = actionTypeOf(instruction);
  return type === 'arrival' || type === 'arrive';
}

function hasDisplayWalkingStep(instructions) {
  return (instructions || []).some((instruction) =>
    !isArrivalInstruction(instruction) && getInstructionDisplayDistance(instruction) > 0
  );
}

export function ensureMinimumRouteInstructions(instructions, options = {}) {
  const source = cloneInstructions(instructions || []);
  const coordinates = options.coordinates || [];
  const routeDistance = roundRouteDistance(options.distance, coordinates);

  if (hasDisplayWalkingStep(source)) {
    if (!source.some(isArrivalInstruction) && coordinates.length > 0) {
      source.push({
        action: { type: 'arrival' },
        coordinate: coordinates[coordinates.length - 1],
        distance: 0,
        originalDistance: 0
      });
    }
    return source;
  }

  if (coordinates.length === 0 && source.length === 0) return source;

  const firstCoordinate = coordinates[0] || source[0]?.coordinate;
  const lastCoordinate = coordinates[coordinates.length - 1] || source[source.length - 1]?.coordinate || firstCoordinate;
  return [
    {
      action: { type: 'departure' },
      coordinate: firstCoordinate,
      distance: routeDistance,
      originalDistance: routeDistance
    },
    {
      action: { type: 'arrival' },
      coordinate: lastCoordinate,
      distance: 0,
      originalDistance: 0
    }
  ];
}

export function getRouteDisplayDistanceMeters(instructions, options = {}) {
  const instructionDistance = (instructions || []).reduce((sum, instruction) => {
    return isArrivalInstruction(instruction)
      ? sum
      : sum + Math.round(getInstructionDisplayDistance(instruction));
  }, 0);

  if (instructionDistance > 0) return instructionDistance;
  return roundRouteDistance(options.distance, options.coordinates || []);
}

export function shouldRenderNavigationInstruction(instruction) {
  const type = actionTypeOf(instruction);
  if (type === 'arrival' || type === 'arrive') return true;
  return getInstructionDisplayDistance(instruction) > 0;
}
