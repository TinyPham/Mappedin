import assert from 'node:assert/strict';
import { __testables } from './flightRepository';

(() => {
  assert.equal(
    __testables.buildFlightProcName('SP_GetFlights', {
      databaseName: 'OfficialFlightDb',
      schema: 'flight'
    }),
    'OfficialFlightDb.flight.SP_GetFlights'
  );
})();

(() => {
  assert.equal(__testables.flightProc('SP_GetFlights'), 'LongThanhFlightBK.dbo.SP_GetFlights');
})();

(() => {
  assert.equal(
    __testables.flightProc('SP_GetFlightNavigationTargets'),
    'LongThanhFlightBK.dbo.SP_GetFlightNavigationTargets'
  );
})();

async function runAsyncTests() {
  const events: Array<{ stage: string; durationMs: number; outcome: string }> = [];
  const result = await __testables.measureFlightStage(
    'stored-procedure',
    async () => 'ok',
    (event) => events.push(event),
    (() => {
      let now = 100;
      return () => {
        now += 25;
        return now;
      };
    })()
  );

  assert.equal(result, 'ok');
  assert.deepEqual(events, [{ stage: 'stored-procedure', durationMs: 25, outcome: 'success' }]);

  const failureEvents: Array<{ stage: string; durationMs: number; outcome: string }> = [];

  await assert.rejects(
    __testables.measureFlightStage(
      'gate-mapping',
      async () => {
        throw new Error('database unavailable');
      },
      (event) => failureEvents.push(event),
      (() => {
        let now = 200;
        return () => {
          now += 40;
          return now;
        };
      })()
    ),
    /database unavailable/
  );

  assert.deepEqual(failureEvents, [{ stage: 'gate-mapping', durationMs: 40, outcome: 'error' }]);
  console.log('flightRepository tests passed');
}

void runAsyncTests().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
