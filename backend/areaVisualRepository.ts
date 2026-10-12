import type sql from 'mssql';

export async function fetchAreaVisualStyles(db: sql.ConnectionPool) {
    const result = await db.request().query(`
        IF OBJECT_ID(N'dbo.AreaVisualOverrides', N'U') IS NULL
            SELECT CAST(NULL AS NVARCHAR(100)) AS MappedinID, CAST(NULL AS NVARCHAR(MAX)) AS StyleJson WHERE 1 = 0;
        ELSE
            SELECT MappedinID, StyleJson FROM dbo.AreaVisualOverrides;
    `);
    const styles: Record<string, any> = {};
    for (const row of result.recordset || []) {
        try {
            const style = JSON.parse(row.StyleJson);
            if (['road', 'curbside'].includes(style.role)) styles[row.MappedinID] = style;
        } catch { /* An invalid optional visual override must not prevent map initialization. */ }
    }
    return styles;
}
