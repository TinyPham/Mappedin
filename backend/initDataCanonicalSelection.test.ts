import assert from 'node:assert/strict';
import { getInitialData } from './initDataRepository';

async function load(rows: any[]) {
    const floors = [
        { FloorId: 0, FloorCode: ' OVERVIEW ', MappedinId: 'f_obsolete', EN: 'Overview' },
        { FloorId: 1, FloorCode: 'F1', MappedinId: 'm_41a38d6d0411d397', EN: 'Arrival' }
    ];
    const calls: string[] = [];
    const db = { request: () => ({
        execute: async (name: string) => {
            calls.push(name);
            return { recordsets: [[], [], [], [], floors, rows] };
        },
        query: async (query: string) => {
            assert.doesNotMatch(query, /\b(INSERT|UPDATE|DELETE|MERGE|CREATE|ALTER)\b/i);
            return { recordset: [] };
        }
    }) };
    const payload = await getInitialData(db as any);
    assert.deepEqual(calls, ['SP_GetInitialData']);
    assert.equal(floors[0].MappedinId, 'f_obsolete', 'source records must not be mutated');
    return payload;
}

async function run() {
    const rows = Array.from({ length: 24 }, (_, i) => [
        { MappedinID: ` e_${i} `, AreaListID: 200 + i, CategoryID: 5, SubCategoryID: 7, EN: `Gate ${i}` },
        { MappedinID: `e_${i}`, AreaListID: i + 1, CategoryID: null, EN: 'Uncategorized', Phone: '123' }
    ]).flat();
    const snapshot = JSON.stringify(rows);
    const forward = await load(rows);
    const reverse = await load([...rows].reverse());
    assert.deepEqual(forward, reverse, 'all 24 duplicate IDs must be independent of SQL order');
    assert.equal(JSON.stringify(forward), JSON.stringify(reverse), 'serialized output order must also be stable');
    assert.equal(Object.keys(forward.locations).length, 24);
    assert.equal(forward.locations.e_0.AreaListID, 200);
    assert.equal(forward.locations.e_0.CategoryID, 5);
    assert.equal(forward.locations.e_0.names.en, 'Gate 0');
    assert.equal(forward.locations.e_0.phone, '123', 'preserve complementary location data');
    assert.equal(JSON.stringify(rows), snapshot);
    assert.equal(forward.floors[0].mappedinId, 'f_36653dc40b36e121');
    assert.equal(forward.floors[1].mappedinId, 'm_41a38d6d0411d397');

    const ties = [
        { MappedinID: 'e_tie', AreaListID: '10', CategoryID: 5, SubCategoryID: 7, EN: 'Winner' },
        { MappedinID: 'e_tie', AreaListID: 20, CategoryID: 6, SubCategoryID: 8, EN: 'Other', SubCategoryIconPath: 'wrong.svg', SubCategoryEN: 'Wrong' },
        { MappedinID: 'e_tie', AreaListID: 10, CategoryID: 5, SubCategoryID: 7, EN: 'Winner', VN: 'Tên', SubCategoryEN: 'Gate', InformationEN: 'Details' },
        { MappedinID: 'e_plain', AreaListID: 90, CategoryID: null, EN: 'Other' },
        { MappedinID: 'e_plain', AreaListID: 3, CategoryID: null, EN: 'First' },
        { MappedinID: 'e_join', AreaListID: 30, CategoryID: 2, SubCategoryID: 5, EN: 'Zulu' },
        { EN: 'Alpha', SubCategoryID: 5, CategoryID: 2, AreaListID: 30, MappedinID: 'e_join' },
        { MappedinID: '   ', AreaListID: 1 }
    ];
    const selected = await load(ties);
    assert.deepEqual(selected, await load([...ties].reverse()));
    assert.equal(selected.locations.e_tie.id, 10, 'lowest numeric AreaListID wins ties');
    assert.equal(selected.locations.e_tie.names.vn, 'Tên');
    assert.equal(selected.locations.e_tie.descriptions.en, 'Details');
    assert.equal(selected.locations.e_tie.subCategoryNames.en, 'Gate');
    assert.equal(selected.locations.e_tie.subCategoryIcon, undefined, 'do not mix different classifications');
    assert.equal(selected.locations.e_plain.id, 3);
    assert.equal(selected.locations.e_join.names.en, 'Alpha', 'same-ID joins use a stable final tie breaker');
    console.log('initDataCanonicalSelection tests passed');
}

run().catch(error => { console.error(error); process.exitCode = 1; });
