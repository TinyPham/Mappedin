import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const serverSource = readFileSync(new URL('../../backend/server.ts', import.meta.url), 'utf8');
const repositorySource = readFileSync(new URL('../../backend/flights/flightRepository.ts', import.meta.url), 'utf8');
const frontendSource = readFileSync(new URL('../../main/main-function/index.ts', import.meta.url), 'utf8');

function blockBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `missing start marker: ${startMarker}`);
  assert.notEqual(end, -1, `missing end marker: ${endMarker}`);
  return source.slice(start, end);
}

test('flight list API returns a stable unavailable contract without SQL details', () => {
  const route = blockBetween(
    serverSource,
    "app.get('/api/flights',",
    "app.get('/api/flights/:id/navigation-targets'"
  );

  assert.match(route, /res\.status\(503\)\.json\(\{[\s\S]*code:\s*['"]FLIGHT_DATA_UNAVAILABLE['"]/);
  assert.doesNotMatch(route, /res\.status\(500\)\.json\(\{\s*error:\s*err\.message/);
});

test('flight repository measures stored procedure and mapping stages', () => {
  for (const stage of ['stored-procedure', 'gate-mapping', 'belt-mapping', 'checkin-mapping']) {
    assert.match(repositorySource, new RegExp(`measureFlightStage\\(\\s*['"]${stage}['"]`));
  }
});

test('flight modal shows a friendly localized message and never renders backend error text', () => {
  const loadFlights = blockBetween(
    frontendSource,
    'const loadFlights = async () =>',
    'const openModal = () =>'
  );

  assert.match(loadFlights, /TranslationManager\.t\(\s*['"]flight_data_unavailable['"]/);
  assert.doesNotMatch(loadFlights, /payload\?\.error/);
  assert.doesNotMatch(loadFlights, /error\.textContent\s*=\s*err\?\.message/);
});
