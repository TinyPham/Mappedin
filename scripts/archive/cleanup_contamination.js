
const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Longthanh@2026',
    server: '152.42.217.126',
    port: 1433,
    database: 'LongThanhFlightBK',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        requestTimeout: 600000
    }
};

async function cleanup() {
    try {
        let pool = await sql.connect(config);
        console.log('Connected');
        
        // 1. Delete arrival milestones from departure flights
        console.log('Cleaning Departure flights...');
        await pool.request().query(`
            DELETE fi 
            FROM FlightInfo fi 
            JOIN Flight f ON fi.FlightId = f.FlightId 
            WHERE f.ArrDep = 'D' 
            AND fi.ShortName IN ('ALDT', 'EIBT', 'SIBT', 'AIBT', 'FirstBag', 'LastBag')
        `);

        // 2. Delete departure milestones from arrival flights
        console.log('Cleaning Arrival flights...');
        await pool.request().query(`
            DELETE fi 
            FROM FlightInfo fi 
            JOIN Flight f ON fi.FlightId = f.FlightId 
            WHERE f.ArrDep = 'A' 
            AND fi.ShortName IN ('ATOT', 'EOBT', 'SOBT', 'CkiOPN', 'CkiClosedTime', 'GateClosedTime', 'ASBT')
        `);

        // 3. Clear status to force recalculation
        console.log('Resetting statuses...');
        await pool.request().query("UPDATE Flight SET Status = NULL");

        console.log('Database cleaned. Now re-calculating statuses...');
        
        // 4. Run the status update (re-calculate everything)
        // Note: run_status_update.js should have the latest SP code
        await pool.request().execute('SP_UpdateFlightStatuses');

        console.log('Success! Data contamination resolved.');

        await sql.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

cleanup();
