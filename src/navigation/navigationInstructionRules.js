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

function copyDefinedProperty(target, key, value) {
  if (value !== undefined) target[key] = value;
}

function cloneActionShell(action) {
  if (!action) return action;
  const clone = { ...action };
  copyDefinedProperty(clone, 'type', action.type);
  copyDefinedProperty(clone, 'bearing', action.bearing);
  copyDefinedProperty(clone, 'instruction', action.instruction);
  copyDefinedProperty(clone, 'connection', action.connection);
  return clone;
}

function cloneInstructionShell(instruction) {
  if (!instruction) return instruction;
  const clone = { ...instruction };
  copyDefinedProperty(clone, 'action', cloneActionShell(instruction.action));
  copyDefinedProperty(clone, 'coordinate', instruction.coordinate);
  copyDefinedProperty(clone, 'distance', instruction.distance);
  copyDefinedProperty(clone, 'time', instruction.time);
  copyDefinedProperty(clone, 'duration', instruction.duration);
  copyDefinedProperty(clone, 'instruction', instruction.instruction);
  copyDefinedProperty(clone, 'originalDistance', instruction.originalDistance);
  copyDefinedProperty(clone, '_displayDistance', instruction._displayDistance);
  copyDefinedProperty(clone, '_mergedNextAction', cloneActionShell(instruction._mergedNextAction));
  copyDefinedProperty(clone, '_mergedNextInstruction', instruction._mergedNextInstruction);
  copyDefinedProperty(clone, '_hasCollapsedInitialWalkingStep', instruction._hasCollapsedInitialWalkingStep);
  copyDefinedProperty(clone, '_collapsedInitialWalkingCoordinate', instruction._collapsedInitialWalkingCoordinate);
  return clone;
}

function cloneInstructions(instructions) {
  return Array.from(instructions || [], cloneInstructionShell);
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

function isSafeWalkingInstruction(instruction) {
  const type = actionTypeOf(instruction);
  return (type === 'turn' || type === 'continue') &&
    !instruction?.action?.connection;
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

  const splitTurn = cloneInstructionShell(turnStep);
  splitTurn.coordinate = pathCoordinates[turnIndex];
  splitTurn.distance = afterDistance;
  splitTurn.originalDistance = afterDistance;
  splitTurn._displayDistance = afterDistance;
  return splitTurn;
}

export function findNearbyLandmark(coord, currentFloorId, mapObjects, options = {}) {
  if (!coord || !currentFloorId) return null;

  const maxDist = options.maxDist ?? 20;
  const getName = options.getName || ((obj) => obj?.name);
  const normalize = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  const excludeNames = [
    'cua hang ban le',
    'cửa hàng bán lẻ',
    ...(options.excludeNames || [])
  ].map(normalize);
  const excludeIds = new Set((options.excludeObjects || [])
    .map((obj) => obj?.id)
    .filter(Boolean));
  for (const obj of options.excludeObjects || []) {
    const name = getName(obj) || obj?.name;
    if (name) excludeNames.push(normalize(name));
  }
  let bestLandmark = null;
  let minDist = maxDist;

  for (const obj of mapObjects || []) {
    if (obj?.id && excludeIds.has(obj.id)) continue;
    const anchor = getObjectAnchor(obj);
    const objectFloorId = getObjectFloorId(obj, anchor);
    if (objectFloorId !== currentFloorId) continue;

    const name = getName(obj) || obj?.name;
    if (!name || name.length < 3) continue;
    const normalizedName = normalize(name);
    if (excludeNames.some((ex) => normalizedName.includes(ex))) continue;

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

function turnSideOf(step) {
  const bearing = (step?.action?.bearing || '').toString().toLowerCase();
  if (bearing.includes('left')) return 'left';
  if (bearing.includes('right')) return 'right';
  return '';
}

function headingDegrees(from, to) {
  const fromLng = from?.longitude ?? from?.lng;
  const fromLat = from?.latitude ?? from?.lat;
  const toLng = to?.longitude ?? to?.lng;
  const toLat = to?.latitude ?? to?.lat;
  if ([fromLng, fromLat, toLng, toLat].some((value) => value === undefined)) return null;

  const dx = toLng - fromLng;
  const dy = toLat - fromLat;
  if (Math.hypot(dx, dy) <= 0.0000001) return null;
  return Math.atan2(dx, dy) * 180 / Math.PI;
}

function headingDeltaDegrees(a, b) {
  if (a === null || b === null) return 180;
  let delta = Math.abs(a - b);
  if (delta > 180) delta = 360 - delta;
  return delta;
}

function instructionPointsAreCorridorAligned(points, toleranceDeg = 35) {
  const headings = [];
  for (let i = 0; i < points.length - 1; i++) {
    const heading = headingDegrees(points[i], points[i + 1]);
    if (heading !== null) headings.push(heading);
  }
  if (headings.length < 2) return false;

  const reference = headings[0];
  return headings.every((heading) => headingDeltaDegrees(reference, heading) <= toleranceDeg);
}

function pathSegmentDirectness(start, end, pathCoordinates, maxRatio = 1.35) {
  const startIndex = nearestPathIndex(start, pathCoordinates);
  const endIndex = nearestPathIndex(end, pathCoordinates);
  if (startIndex < 0 || endIndex <= startIndex) return false;

  const directDistance = calcDistanceMeters(start, end);
  if (!Number.isFinite(directDistance) || directDistance <= 0) return false;

  const pathDistance = pathDistanceBetween(pathCoordinates, startIndex, endIndex);
  if (!Number.isFinite(pathDistance) || pathDistance <= 0) return false;
  return pathDistance / directDistance <= maxRatio;
}

function canMergeSameDirectionCorridorTurns(run, nextStep, pathCoordinates) {
  if (run.length < 2) return false;
  const side = turnSideOf(run[0]);
  if (!side || !run.every((step) => actionTypeOf(step) === 'turn' && turnSideOf(step) === side)) return false;

  const floorId = getCoordinateFloorId(run[0].coordinate);
  if (floorId && !run.every((step) => getCoordinateFloorId(step.coordinate) === floorId)) return false;

  const points = run.map((step) => step.coordinate).filter(Boolean);
  if (nextStep?.coordinate) points.push(nextStep.coordinate);
  if (points.length < 3) return false;

  if (instructionPointsAreCorridorAligned(points)) return true;
  return Array.isArray(pathCoordinates) &&
    pathCoordinates.length > 0 &&
    pathSegmentDirectness(points[0], points[points.length - 1], pathCoordinates);
}

function mergeConsecutiveCorridorTurns(steps, pathCoordinates) {
  const merged = [];
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const side = turnSideOf(step);
    if (actionTypeOf(step) !== 'turn' || !side) {
      merged.push(step);
      continue;
    }

    const run = [step];
    let j = i + 1;
    while (j < steps.length && actionTypeOf(steps[j]) === 'turn' && turnSideOf(steps[j]) === side) {
      run.push(steps[j]);
      j++;
    }

    if (canMergeSameDirectionCorridorTurns(run, steps[j], pathCoordinates)) {
      const displayDistance = run.reduce((sum, item) => {
        const distance = Number.isFinite(item.originalDistance) ? item.originalDistance : getInstructionDisplayDistance(item);
        return sum + Math.round(distance || 0);
      }, 0);
      const mergedStep = run[0];
      mergedStep.distance = displayDistance;
      mergedStep.originalDistance = displayDistance;
      mergedStep._displayDistance = displayDistance;
      merged.push(mergedStep);
      i = j - 1;
    } else {
      merged.push(step);
    }
  }

  return merged;
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

  return mergeConsecutiveCorridorTurns(
    normalizeInstructionDisplayDistances(cleaned),
    pathCoordinates
  );
}

function normalizeInstructionDisplayDistances(instructions) {
  const normalized = cloneInstructions(instructions);
  normalized.forEach((step) => {
    step.originalDistance = step.distance || 0;
  });

  for (let i = 0; i < normalized.length - 1; i++) {
    const curr = normalized[i];
    const next = normalized[i + 1];
    const currType = actionTypeOf(curr);
    const nextType = actionTypeOf(next);
    if (isExitAction(currType)) {
      curr.distance = curr._mergedNextAction
        ? (curr.originalDistance || curr.distance || 0)
        : (next.originalDistance || next.distance || 0);
      curr._displayDistance = curr.distance;
    } else if (isEnterAction(currType) && isExitAction(nextType)) {
      curr.distance = isElevatorConnection(curr.action?.connection) ? 3 : 6;
    } else {
      curr.distance = next.originalDistance || next.distance || 0;
    }
  }

  if (normalized.length > 0) normalized[normalized.length - 1].distance = 0;
  return normalized;
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
  const landmarkMaxDist = options.landmarkMaxDist ?? 20;

  function landmarkTextFor(instruction) {
    const coord = instruction?._collapsedInitialWalkingCoordinate ?? instruction?.coordinate;
    const stepFloorId = getCoordinateFloorId(coord);
    const near = findNearbyLandmark(coord, stepFloorId, mapObjects, {
      maxDist: landmarkMaxDist,
      getName,
      excludeObjects: options.landmarkExcludeObjects || [],
      excludeNames: options.landmarkExcludeNames || []
    });
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
    const landmarkText = () => actionType !== 'continue' || instruction?._hasCollapsedInitialWalkingStep
      ? landmarkTextFor(instruction)
      : '';

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
        return `${t('action_exit', 'Ra')} ${name}${floorText}`;
      }

      return `${t('action_use', 'Su dung')} ${name}${floorText}`;
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
        return `${text}${landmarkText()}`;
      }
      if (bearing.includes('left')) return `${t('action_turn_left', 'Re trai')}${landmarkText()}`;
      if (bearing.includes('right')) return `${t('action_turn_right', 'Re phai')}${landmarkText()}`;
      return `${t('action_turn', 'Re')}${landmarkText()}`;
    }

    const actionMap = {
      arrival: t('action_arrival', 'Ket thuc'),
      continue: t('action_go_straight', 'Di thang'),
      arrive: t('action_arrive', 'Den noi'),
      stopover: mappedinText || 'Diem dung',
      departure: t('action_departure', 'Khoi hanh')
    };

    const baseText = actionMap[actionType] || mappedinText || actionType;
    if (actionType === 'continue' && instruction?._hasCollapsedInitialWalkingStep) {
      return `${baseText}${landmarkText()}`;
    }
    return baseText;
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

export function collapseInitialWalkingInstructionForDisplay(instructions) {
  const source = cloneInstructions(instructions);
  const first = source[0];
  const second = source[1];
  const firstType = actionTypeOf(first);
  const canCollapse = source.length > 2 &&
    (firstType === 'departure' || firstType === 'start') &&
    isSafeWalkingInstruction(second);

  if (!canCollapse) return source;

  const distance = getInstructionDisplayDistance(first) + getInstructionDisplayDistance(second);
  first.distance = distance;
  first._displayDistance = distance;
  first.originalDistance =
    (Number.isFinite(first.originalDistance) ? first.originalDistance : 0) +
    (Number.isFinite(second.originalDistance) ? second.originalDistance : 0);
  for (const field of ['time', 'duration']) {
    const hasFirstValue = first[field] !== undefined;
    const hasSecondValue = second[field] !== undefined;
    const firstValue = Number.isFinite(first[field]) ? first[field] : 0;
    const secondValue = Number.isFinite(second[field]) ? second[field] : 0;
    if (hasFirstValue || hasSecondValue) {
      first[field] = firstValue + secondValue;
    } else {
      delete first[field];
    }
  }
  const transferRecipient = source.slice(2).find(isSafeWalkingInstruction);
  if (transferRecipient) {
    transferRecipient._hasCollapsedInitialWalkingStep = true;
    if (second.coordinate != null) {
      transferRecipient._collapsedInitialWalkingCoordinate = second.coordinate;
    }
  }
  source.splice(1, 1);
  return source;
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

function findAdjacentWalkingFloorId(instructions, instructionIndex, direction) {
  for (
    let i = instructionIndex + direction;
    i >= 0 && i < instructions.length;
    i += direction
  ) {
    if (isConnectionAction(actionTypeOf(instructions[i]))) continue;
    const floorId = getCoordinateFloorId(instructions[i]?.coordinate);
    if (floorId) return floorId;
  }
  return null;
}

function getInstructionPathFloorId(instructions, instructionIndex) {
  const instruction = instructions[instructionIndex];
  const type = actionTypeOf(instruction);
  if (isEnterAction(type)) {
    return findAdjacentWalkingFloorId(instructions, instructionIndex, -1) ||
      getCoordinateFloorId(instruction?.coordinate);
  }
  if (isExitAction(type)) {
    return findAdjacentWalkingFloorId(instructions, instructionIndex, 1) ||
      getCoordinateFloorId(instruction?.coordinate);
  }
  return getCoordinateFloorId(instruction?.coordinate);
}

function nearestStrictFloorPathIndex(coord, floorId, pathCoordinates, maxDistanceMeters) {
  if (!coord || !floorId) return { index: -1, distance: Infinity };

  let bestIndex = -1;
  let bestDistance = Infinity;
  for (let i = 0; i < pathCoordinates.length; i++) {
    if (getCoordinateFloorId(pathCoordinates[i]) !== floorId) continue;
    const distance = calcDistanceMeters(coord, pathCoordinates[i]);
    if (distance < bestDistance) {
      bestIndex = i;
      bestDistance = distance;
    }
  }

  if (bestDistance > maxDistanceMeters) return { index: -1, distance: bestDistance };
  return { index: bestIndex, distance: bestDistance };
}

function instructionDisplayDistanceValue(instruction) {
  if (isArrivalInstruction(instruction)) return 0;
  if (Number.isFinite(instruction?._displayDistance)) return instruction._displayDistance;
  if (isInstructionEnter(instruction)) {
    return isElevatorConnection(instruction?.action?.connection) ? 3 : 6;
  }
  if (isInstructionExit(instruction)) {
    return instruction?._mergedNextAction ? Number(instruction.distance || 0) : 0;
  }
  return Number(instruction?.distance || 0);
}

function instructionWalkingDistanceValue(instruction) {
  if (isInstructionEnter(instruction)) return 0;
  return instructionDisplayDistanceValue(instruction);
}

function invalidValidation(reason, metadata) {
  return {
    valid: false,
    reason,
    ...metadata
  };
}

export function validateNavigationInstructionsAgainstPath(instructions, options = {}) {
  const source = Array.isArray(instructions) ? instructions : [];
  const sourceInstructions = Array.isArray(options.sourceInstructions)
    ? options.sourceInstructions
    : source;
  const pathCoordinates = Array.isArray(options.pathCoordinates) ? options.pathCoordinates : [];
  const maxCoordinateDistanceMeters = options.maxCoordinateDistanceMeters ??
    options.maxDistanceMeters ??
    1.5;
  const strongTurnThresholdDegrees = options.strongTurnThresholdDegrees ?? 45;
  const routeDistance = Number.isFinite(options.routeDistance)
    ? options.routeDistance
    : roundRouteDistance(options.distance, pathCoordinates);
  const displayDistance = source.reduce(
    (sum, instruction) => sum + instructionDisplayDistanceValue(instruction),
    0
  );
  const walkingDisplayDistance = source.reduce(
    (sum, instruction) => sum + instructionWalkingDistanceValue(instruction),
    0
  );
  const distanceTolerance = Math.max(routeDistance * 0.15, 5);
  const distanceDeviation = Math.abs(walkingDisplayDistance - routeDistance);
  const coordinateFloorIds = source.map((_, index) =>
    getInstructionPathFloorId(source, index)
  );
  const coordinateMatches = source.map((instruction, index) =>
    nearestStrictFloorPathIndex(
      instruction?.coordinate,
      coordinateFloorIds[index],
      pathCoordinates,
      maxCoordinateDistanceMeters
    )
  );
  const coordinateIndices = coordinateMatches.map((match) => match.index);
  const metadata = {
    coordinateIndices,
    coordinateFloorIds,
    displayDistance,
    walkingDisplayDistance,
    routeDistance,
    distanceDeviation,
    distanceTolerance,
    maxCoordinateDistanceMeters
  };

  if (pathCoordinates.length === 0 && source.length > 0) {
    return invalidValidation('Current leg path has no coordinates.', metadata);
  }

  const unmatchedIndex = coordinateIndices.findIndex((index) => index < 0);
  if (unmatchedIndex >= 0) {
    const matchDistance = coordinateMatches[unmatchedIndex].distance;
    const distanceText = Number.isFinite(matchDistance)
      ? `${matchDistance.toFixed(2)}m`
      : 'an unknown distance';
    return invalidValidation(
      `Instruction ${unmatchedIndex} is ${distanceText} from the current leg path, beyond ${maxCoordinateDistanceMeters}m on the same floor.`,
      metadata
    );
  }

  for (let i = 1; i < coordinateIndices.length; i++) {
    if (coordinateIndices[i] < coordinateIndices[i - 1]) {
      return invalidValidation(
        `Instruction coordinate indices must be nondecreasing within one leg (${coordinateIndices[i - 1]} to ${coordinateIndices[i]}).`,
        metadata
      );
    }
  }

  const candidateStrongTurnIndices = new Set(source
    .map((instruction, index) => {
      const bearing = String(instruction?.action?.bearing || '').toLowerCase();
      return actionTypeOf(instruction) === 'turn' && !bearing.includes('slight')
        ? coordinateIndices[index]
        : -1;
    })
    .filter((index) => index >= 0));
  for (let i = 0; i < sourceInstructions.length; i++) {
    const sourceInstruction = sourceInstructions[i];
    if (actionTypeOf(sourceInstruction) !== 'turn') continue;
    const bearing = String(sourceInstruction?.action?.bearing || '').toLowerCase();
    if (bearing.includes('slight')) continue;

    const currentFloorId = getInstructionPathFloorId(sourceInstructions, i);
    const sourceMatch = nearestStrictFloorPathIndex(
      sourceInstruction?.coordinate,
      currentFloorId,
      pathCoordinates,
      maxCoordinateDistanceMeters
    );
    const coordinateIndex = sourceMatch.index;
    if (coordinateIndex < 0) {
      return invalidValidation(
        `Original SDK strong turn ${i} is not present on the displayed path within ${maxCoordinateDistanceMeters}m on the same floor.`,
        metadata
      );
    }

    const previousCoordinate = pathCoordinates[coordinateIndex - 1];
    const currentCoordinate = pathCoordinates[coordinateIndex];
    const nextCoordinate = pathCoordinates[coordinateIndex + 1];
    const staysOnFloor = previousCoordinate &&
      nextCoordinate &&
      getCoordinateFloorId(previousCoordinate) === currentFloorId &&
      getCoordinateFloorId(currentCoordinate) === currentFloorId &&
      getCoordinateFloorId(nextCoordinate) === currentFloorId;
    const turnAngle = staysOnFloor
      ? pathTurnAngle(previousCoordinate, currentCoordinate, nextCoordinate)
      : 0;
    if (turnAngle + Number.EPSILON < strongTurnThresholdDegrees) {
      return invalidValidation(
        `Original SDK strong turn ${i} is mapped to geometry below ${strongTurnThresholdDegrees} degrees on the displayed path.`,
        metadata
      );
    }
    if (!candidateStrongTurnIndices.has(coordinateIndex)) {
      return invalidValidation(
        `Source strong turn ${i} is missing from the simplified instruction candidate.`,
        metadata
      );
    }
  }

  if (distanceDeviation > distanceTolerance + Number.EPSILON) {
    return invalidValidation(
      `Instruction walking distance deviates from the leg distance by ${distanceDeviation.toFixed(2)}m, beyond the ${distanceTolerance.toFixed(2)}m tolerance.`,
      metadata
    );
  }

  return {
    valid: true,
    reason: null,
    ...metadata
  };
}

export function prepareNavigationLeg(legDirections, options = {}) {
  const legCoordinates = Array.isArray(legDirections?.coordinates)
    ? legDirections.coordinates
    : [];
  const rawInstructions = Array.isArray(legDirections?.instructions)
    ? legDirections.instructions
    : [];
  const legDistance = Number.isFinite(options.routeDistance)
    ? options.routeDistance
    : roundRouteDistance(legDirections?.distance, legCoordinates);
  const simplifiedInstructions = simplifyNavigationInstructions(rawInstructions, {
    ...options,
    pathCoordinates: legCoordinates
  });
  const preparedInstructions = ensureMinimumRouteInstructions(simplifiedInstructions, {
    ...options,
    coordinates: legCoordinates,
    distance: legDistance
  });
  const validation = validateNavigationInstructionsAgainstPath(preparedInstructions, {
    ...options,
    pathCoordinates: legCoordinates,
    routeDistance: legDistance,
    sourceInstructions: rawInstructions
  });
  const usedFallback = !validation.valid;

  return {
    legDirections,
    legInstructions: usedFallback
      ? normalizeInstructionDisplayDistances(rawInstructions)
      : preparedInstructions,
    legCoordinates,
    legDistance,
    legIndex: options.legIndex ?? 0,
    validation,
    usedFallback,
    instructionSource: usedFallback ? 'sdk-raw' : 'simplified',
    fallbackReason: usedFallback ? validation.reason : null
  };
}

function coordinatesAreSameActualPoint(first, second) {
  if (!first || !second) return false;
  const firstFloorId = getCoordinateFloorId(first);
  const secondFloorId = getCoordinateFloorId(second);
  const firstLatitude = first.latitude ?? first.lat;
  const firstLongitude = first.longitude ?? first.lng;
  const secondLatitude = second.latitude ?? second.lat;
  const secondLongitude = second.longitude ?? second.lng;
  return Boolean(firstFloorId) &&
    firstFloorId === secondFloorId &&
    firstLatitude !== undefined &&
    firstLongitude !== undefined &&
    secondLatitude !== undefined &&
    secondLongitude !== undefined &&
    firstLatitude === secondLatitude &&
    firstLongitude === secondLongitude;
}

function stopoverLabelFor(options, legIndex, arrivalInstruction) {
  return options.waypointLabels?.[legIndex + 1] ??
    options.boundaryWaypointLabels?.[legIndex] ??
    arrivalInstruction?.action?.instruction ??
    arrivalInstruction?.instruction ??
    'Stopover';
}

function adaptLegBoundaryInstructions(instructions, legIndex, legCount, options, boundaryCoordinate) {
  const adapted = [];
  let stopoverAdded = false;
  let firstArrival = null;

  for (const instruction of cloneInstructions(instructions)) {
    const type = actionTypeOf(instruction);
    if (legIndex > 0 && (type === 'departure' || type === 'start')) continue;

    if (legIndex < legCount - 1 && isArrivalInstruction(instruction)) {
      firstArrival ||= instruction;
      if (stopoverAdded) continue;
      const label = stopoverLabelFor(options, legIndex, instruction);
      adapted.push({
        ...instruction,
        action: {
          ...(instruction.action || {}),
          type: 'stopover',
          instruction: label
        },
        instruction: label,
        coordinate: boundaryCoordinate || instruction.coordinate,
        distance: 0,
        originalDistance: 0
      });
      stopoverAdded = true;
      continue;
    }

    adapted.push(instruction);
  }

  if (legIndex < legCount - 1 && !stopoverAdded) {
    const label = stopoverLabelFor(options, legIndex, firstArrival);
    adapted.push({
      action: { type: 'stopover', instruction: label },
      instruction: label,
      coordinate: boundaryCoordinate,
      distance: 0,
      originalDistance: 0
    });
  }

  return adapted;
}

export function aggregateNavigationLegs(preparedLegs, options = {}) {
  const legs = Array.isArray(preparedLegs) ? preparedLegs : [];
  const combinedCoordinates = [];
  const combinedInstructions = [];
  const legSpans = [];

  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    const legCoordinates = Array.isArray(leg?.legCoordinates) ? leg.legCoordinates : [];
    const duplicateBoundary = combinedCoordinates.length > 0 &&
      legCoordinates.length > 0 &&
      coordinatesAreSameActualPoint(
        combinedCoordinates[combinedCoordinates.length - 1],
        legCoordinates[0]
      );
    const coordinateStartIndex = legCoordinates.length === 0
      ? combinedCoordinates.length
      : duplicateBoundary
        ? combinedCoordinates.length - 1
        : combinedCoordinates.length;
    const coordinatesToAppend = duplicateBoundary ? legCoordinates.slice(1) : legCoordinates;
    combinedCoordinates.push(...coordinatesToAppend);
    const coordinateEndIndex = legCoordinates.length === 0
      ? coordinateStartIndex - 1
      : combinedCoordinates.length - 1;

    const instructionStartIndex = combinedInstructions.length;
    const boundaryCoordinate = legCoordinates[legCoordinates.length - 1];
    const adaptedInstructions = adaptLegBoundaryInstructions(
      leg?.legInstructions || [],
      i,
      legs.length,
      options,
      boundaryCoordinate
    );
    combinedInstructions.push(...adaptedInstructions);
    const instructionEndIndex = combinedInstructions.length - 1;

    legSpans.push({
      legIndex: leg?.legIndex ?? i,
      coordinateStartIndex,
      coordinateEndIndex,
      instructionStartIndex,
      instructionEndIndex
    });
  }

  return {
    legDirections: legs.map((leg) => leg?.legDirections),
    uiDirections: {
      coordinates: combinedCoordinates,
      instructions: combinedInstructions,
      distance: legs.reduce((sum, leg) => sum + Number(leg?.legDistance || 0), 0)
    },
    legSpans
  };
}
