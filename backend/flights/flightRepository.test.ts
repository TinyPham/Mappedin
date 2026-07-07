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

console.log('flightRepository tests passed');
