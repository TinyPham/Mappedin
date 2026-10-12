import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { tutorialSteps } from '../src/tutorial/tutorialSteps.js';
import { findNodes, sourceFile, ts } from './helpers/mainSource.mjs';

test('actual TranslationManager fallbacks render combined copy in every supported language', async () => {
  const { combinedTutorialTranslations: copy, combinedTutorialUiFallbacks } = await import('../src/tutorial/combinedTutorialTranslations.mjs');
  const manager = findNodes(node => ts.isClassDeclaration(node) && node.name?.text === 'TranslationManager')[0];
  const fallback = manager.members.find(node => node.name?.getText(sourceFile) === 'STATIC_UI_FALLBACKS').initializer;
  const method = manager.members.find(node => ts.isMethodDeclaration(node) && node.name?.getText(sourceFile) === 't');
  const compiled = ts.transpileModule(`class Manager { static currentLang='vn';static data={ui:{}};
    static STATIC_UI_FALLBACKS=${fallback.getText(sourceFile)}; ${method.getText(sourceFile)} }`,
    { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const runtime = Function('combinedTutorialUiFallbacks', `${compiled}; return Manager;`)(combinedTutorialUiFallbacks);
  for (const language of ['vn', 'en', 'zh', 'ja', 'ko']) {
    runtime.currentLang = language;
    for (const key of Object.keys(copy)) assert.equal(runtime.t(key, 'missing'), copy[key][language.toUpperCase()]);
  }
});

const moduleUrl = new URL('../src/tutorial/combinedTutorialTranslations.mjs', import.meta.url);
const patchUrl = new URL('../database/patches/update_combined_tutorial_translations.sql', import.meta.url);
const languages = ['VN', 'EN', 'ZH', 'JA', 'KO'];
const stepIds = [
  'mobile-search-explore-theme',
  'mobile-floor-language',
  'mobile-wayfinding-combined',
  'desktop-search',
  'desktop-floor',
  'desktop-theme',
  'desktop-wayfinding'
];
const keyFor = (id, field) => `guide_${field}_${id.replaceAll('-', '_')}`;
const expectedKeys = stepIds.flatMap(id => [keyFor(id, 'title'), keyFor(id, 'desc')]);

async function translations() {
  assert.ok(existsSync(moduleUrl), 'Missing combined tutorial translation module');
  const { combinedTutorialTranslations } = await import(moduleUrl);
  assert.ok(combinedTutorialTranslations, 'Missing combinedTutorialTranslations named export');
  return combinedTutorialTranslations;
}

function migration() {
  assert.ok(existsSync(patchUrl), 'Missing combined tutorial translation SQL patch');
  return readFileSync(patchUrl, 'utf8');
}

test('exactly fourteen translation keys cover the seven current tutorial steps', async () => {
  const dictionary = await translations();
  const actualSteps = Object.values(tutorialSteps).flat();
  for (const id of stepIds) {
    assert.equal(actualSteps.filter(step => step.id === id).length, 1, `Current step ${id}`);
  }
  assert.equal(Object.keys(dictionary).length, 14);
  assert.deepEqual(Object.keys(dictionary).sort(), [...expectedKeys].sort());
});

test('Vietnamese titles and descriptions exactly match the current tutorial copy', async () => {
  const dictionary = await translations();
  const actualSteps = Object.values(tutorialSteps).flat();
  for (const id of stepIds) {
    const step = actualSteps.find(item => item.id === id);
    assert.ok(step, `Missing current step ${id}`);
    assert.equal(dictionary[keyFor(id, 'title')].VN, step.title, `${id} title`);
    assert.equal(dictionary[keyFor(id, 'desc')].VN, step.description, `${id} description`);
  }
});

test('every key has complete VN/EN/ZH/JA/KO copy within the database column limit', async () => {
  const dictionary = await translations();
  for (const key of expectedKeys) {
    assert.deepEqual(Object.keys(dictionary[key]).sort(), [...languages].sort(), key);
    for (const language of languages) {
      const value = dictionary[key][language];
      assert.equal(typeof value, 'string', `${key}.${language}`);
      assert.ok(value.trim().length > 0, `${key}.${language} is empty`);
      assert.equal(value, value.trim(), `${key}.${language} has edge whitespace`);
      assert.ok(value.length <= 500, `${key}.${language} exceeds NVARCHAR(500)`);
      assert.doesNotMatch(value, /\uFFFD/, `${key}.${language} has broken Unicode`);
      if (language === 'ZH') assert.match(value, /\p{Script=Han}/u, key);
      if (language === 'JA') assert.match(value, /[\p{Script=Hiragana}\p{Script=Katakana}]/u, key);
      if (language === 'KO') assert.match(value, /\p{Script=Hangul}/u, key);
    }
  }
});

test('translated descriptions teach all the merged controls and route inputs', async () => {
  const dictionary = await translations();
  const copy = id => dictionary[keyFor(id, 'desc')].EN;
  for (const id of ['mobile-search-explore-theme', 'desktop-search']) {
    assert.match(copy(id), /search/i, id);
    assert.match(copy(id), /categor/i, id);
  }
  assert.match(copy('mobile-search-explore-theme'), /arrow/i);
  for (const id of ['mobile-search-explore-theme', 'desktop-theme']) {
    assert.match(copy(id), /settings/i, id);
    assert.match(copy(id), /(?:six|6)\s+(?:colou?r\s+)?themes/i, id);
    assert.match(copy(id), /slider.*brightness/i, id);
  }
  for (const id of ['mobile-floor-language', 'desktop-floor']) {
    assert.match(copy(id), /floor/i, id);
    assert.match(copy(id), /language/i, id);
  }
  for (const id of ['mobile-wayfinding-combined', 'desktop-wayfinding']) {
    for (const concept of [/Directions/, /starting point|origin/i, /destination/i, /stopover/i, /route.*3D map/i]) {
      assert.match(copy(id), concept, id);
    }
  }
});

test('SQL has exactly fourteen literal Unicode rows identical to the fallback dictionary', async () => {
  const dictionary = await translations();
  const sql = migration();
  const source = sql.match(/USING\s*\(VALUES([\s\S]*?)\)\s+AS source\s*\(KeyCode, KeyType, VN, EN, ZH, JA, KO\)/i);
  assert.ok(source, 'Expected literal rows in schema column order');
  const rowPattern = /\('(guide_(?:title|desc)_[a-z_]+)',\s*'(title|label)',\s*N'((?:''|[^'])*)',\s*N'((?:''|[^'])*)',\s*N'((?:''|[^'])*)',\s*N'((?:''|[^'])*)',\s*N'((?:''|[^'])*)'\)/g;
  const rows = [...source[1].matchAll(rowPattern)];
  assert.equal(rows.length, 14);
  assert.deepEqual(rows.map(row => row[1]).sort(), [...expectedKeys].sort());
  assert.equal(source[1].replace(rowPattern, '').replace(/[\s,]/g, ''), '', 'No extra source rows or expressions');
  assert.equal([...sql.matchAll(/N'((?:''|[^'])*)'/g)].length, 70, 'All five values in each row are Unicode literals');
  for (const row of rows) {
    assert.equal(row[2], row[1].startsWith('guide_title_') ? 'title' : 'label');
    for (const [index, language] of languages.entries()) {
      assert.equal(row[index + 3].replaceAll("''", "'"), dictionary[row[1]][language], `${row[1]}.${language}`);
    }
  }
});

test('SQL upserts only the supplied keys with no broad updates or deletes', () => {
  const sql = migration().replace(/--[^\r\n]*/g, '').trim();
  assert.match(sql, /^SET NOCOUNT ON;\s*MERGE dbo\.Translation_UI WITH \(HOLDLOCK\) AS target\s*USING/i);
  const sourceEnd = sql.match(/\) AS source \(KeyCode, KeyType, VN, EN, ZH, JA, KO\)/);
  assert.ok(sourceEnd);
  const upsert = sql.slice(sourceEnd.index + sourceEnd[0].length).replace(/\s+/g, ' ').trim();
  assert.equal(upsert, [
    'ON target.KeyCode = source.KeyCode',
    'WHEN MATCHED THEN',
    'UPDATE SET VN = source.VN, EN = source.EN, ZH = source.ZH, JA = source.JA, KO = source.KO',
    'WHEN NOT MATCHED BY TARGET THEN',
    'INSERT (KeyCode, KeyType, VN, EN, ZH, JA, KO)',
    'VALUES (source.KeyCode, source.KeyType, source.VN, source.EN, source.ZH, source.JA, source.KO);'
  ].join(' '));
});
