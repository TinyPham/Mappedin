import json
import re

def sanitize(s):
    if s is None:
        return 'NULL'
    s = s.replace("'", "''")
    return f"N'{s}'"

def parse_name(full_name):
    pattern = r"^(.*?)\s*\((.*?)\)$"
    match = re.search(pattern, full_name)
    if match:
        return match.group(1).strip(), match.group(2).strip()
    return full_name.strip(), full_name.strip()

map_objects = []
try:
    with open('database/raw_2f_3f.json', 'r', encoding='utf-8') as f:
        map_objects.extend(json.load(f))
except Exception as e:
    print(f"Error reading JSON: {e}")

print(f"Loaded {len(map_objects)} objects from 2F/3F.")

sql_lines = []
sql_lines.append("-- ============================================")
sql_lines.append("-- SUPPLEMENTAL SEED: 2F & 3F (Self-Healing)")
sql_lines.append("-- Target Database: MappedIn3DModels")
sql_lines.append("-- ============================================")
sql_lines.append("USE [MappedIn3DModels]")
sql_lines.append("GO")
sql_lines.append("")

# Create Table if missing (Column-Based)
sql_lines.append("-- Ensure Translation_Locations exists")
sql_lines.append("IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Translation_Locations]') AND type in (N'U'))")
sql_lines.append("BEGIN")
sql_lines.append("CREATE TABLE [dbo].[Translation_Locations](")
sql_lines.append("    [LocationId] [bigint] IDENTITY(1,1) NOT NULL,")
sql_lines.append("    [MappedinId] [varchar](100) NULL,")
sql_lines.append("    [LocationType] [varchar](50) NULL,")
sql_lines.append("    [CategoryId] [int] NULL,")
sql_lines.append("    [VN] [nvarchar](500) NULL,")
sql_lines.append("    [EN] [nvarchar](500) NULL,")
sql_lines.append("    [ZH] [nvarchar](500) NULL,")
sql_lines.append("    [JA] [nvarchar](500) NULL,")
sql_lines.append("    [KO] [nvarchar](500) NULL,")
sql_lines.append(" CONSTRAINT [PK_Translation_Locations] PRIMARY KEY CLUSTERED ([LocationId] ASC)")
sql_lines.append(") ON [PRIMARY]")
sql_lines.append("END")
sql_lines.append("GO")
sql_lines.append("")

processed_ids = set()

for obj in map_objects:
    oid = obj.get('id')
    oname = obj.get('name')
    otype = obj.get('type', 'room') # usage depends on schema, usually 'room', 'space' etc.

    if not oid or not oname:
        continue
        
    if oid in processed_ids:
        continue
    processed_ids.add(oid)

    vn, en = parse_name(oname)
    zh = en if en else vn
    ja = en if en else vn
    ko = en if en else vn

    # Column-Based Inserts
    # Table: Translation_Locations
    
    val_vn = sanitize(vn)
    val_en = sanitize(en)
    val_zh = sanitize(zh)
    val_ja = sanitize(ja)
    val_ko = sanitize(ko)
    
    sql = f"INSERT INTO Translation_Locations (MappedinId, LocationType, VN, EN, ZH, JA, KO) VALUES ('{oid}', '{otype}', {val_vn}, {val_en}, {val_zh}, {val_ja}, {val_ko});"
    sql_lines.append(sql)

with open('database/seed_supplement_2f_3f_v2.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_lines))

print(f"Generated seed_supplement_2f_3f_v2.sql with {len(sql_lines)} lines.")
