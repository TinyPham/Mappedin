import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const source=readFileSync(new URL('../main/main-function/index.ts',import.meta.url),'utf8');
const startMarker='(window as any).drawNavigation = drawNavigation;';
const start=source.indexOf(startMarker),end=source.indexOf('const resetWayfinding =',start);
assert.ok(start>=0&&end>start,'video activation stays between navigation initialization and reset');
const activation=source.slice(start+startMarker.length,end);

function mountIntegration({language='vn',debug=false}={}){
 const listeners=new Map(),guideCalls=[];let options;
 const player={languages:[],setLanguage(lang){this.languages.push(lang);},setRoute(){},setPosition(){}};
 const win={addEventListener:(name,listener)=>listeners.set(name,listener)};
 const translations={currentLang:language};
 const javascript=ts.transpileModule(activation,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
 const run=Function('mountAirportFlowVideoPlayer','TranslationManager','window','closeUserGuide','isMapRuntimeDebugEnabled',
  `let passengerFlowOpened=false;let airportJourneyPanel=null;let isAirportOverviewActive=true;${javascript}
   return {player:airportJourneyPanel,getOverviewActive:()=>isAirportOverviewActive,getPassengerFlowOpened:()=>passengerFlowOpened};`);
 const result=run(value=>{options=value;return player;},translations,win,value=>guideCalls.push(value),()=>debug);
 return {result,player,options,win,listeners,guideCalls,translations};
}

test('the simulation toolbar imports and mounts the video player without old overview activation',()=>{
 assert.ok(/import\s*\{\s*mountAirportFlowVideoPlayer\s*\}\s*from\s*['"]\.\.\/\.\.\/src\/journeys\/airportFlowVideoPlayer\.js['"]/.test(source),'main imports the video player');
 assert.match(activation,/airportJourneyPanel\s*=\s*mountAirportFlowVideoPlayer\(/);
 assert.ok(!/\b(?:mountAirportJourneyPanel|buildAirportOverviewScene|createAirportOverviewPlayback|airportOverviewPlayback|overviewSelectionVersion)\b/.test(source),'old overview imports, activation and debug exposure are removed');
 assert.doesNotMatch(activation,/\b(?:mapView|mapData|airportOperations|airportJourneyPreferences|planAirportJourney|drawNavigation|startupCameraSequenceCompletedPromise|setFloor|Camera|onStart|onPause|onSpeedChange|onViewChange)\b/,
  'video activation must not animate the map, gate on a route, or wait for map startup');
});

test('mount uses the current language and the existing language event updates the player',()=>{
 assert.match(activation,/language\s*:\s*TranslationManager\.currentLang/);
 const h=mountIntegration({language:'en'});
 assert.equal(h.options.language,'en');assert.equal(h.result.player,h.player);
 assert.equal(typeof h.listeners.get('language-change'),'function');
 h.translations.currentLang='vn';h.listeners.get('language-change')();
 h.translations.currentLang='en';h.listeners.get('language-change')();
 assert.deepEqual(h.player.languages,['vn','en']);
});

test('expanding the player closes overlapping guide content and leaves map overview inactive',()=>{
 const h=mountIntegration();
 assert.equal(h.result.getPassengerFlowOpened(),false);
 h.options.onModeChange('expanded');
 assert.equal(h.result.getPassengerFlowOpened(),true);
 assert.match(source,/if \(passengerFlowOpened\) return;/);
 assert.deepEqual(h.guideCalls,[false]);assert.equal(h.result.getOverviewActive(),false);
 h.options.onModeChange('compact');h.options.onModeChange('closed');
 assert.equal(h.result.getOverviewActive(),false);
});

test('debug exposes the new player only and existing route and position compatibility calls remain',()=>{
 const ordinary=mountIntegration(),debug=mountIntegration({debug:true});
 assert.equal(ordinary.win.airportFlowVideoPlayer,undefined);
 assert.equal(debug.win.airportFlowVideoPlayer,debug.player);
 assert.equal(debug.win.airportOverviewPlayback,undefined);
 assert.ok(/airportJourneyPanel\?\.setRoute\(null\)/.test(source),'clear-route compatibility hook remains');
 assert.ok(/airportJourneyPanel\?\.setRoute\(latestAirportRoute\)/.test(source),'active-route compatibility hook remains');
 assert.ok(/airportJourneyPanel\?\.setPosition\(coord\)/.test(source),'position compatibility hook remains');
});
