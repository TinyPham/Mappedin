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
sql_lines.append("-- SUPPLEMENTAL SEED: 2F & 3F (Row-Based)")
sql_lines.append("-- ============================================")
sql_lines.append("")

processed_ids = set()

for obj in map_objects:
    oid = obj.get('id')
    oname = obj.get('name')
    otype = obj.get('type', 'room')

    if not oid or not oname:
        continue
        
    if oid in processed_ids:
        continue
    processed_ids.add(oid)

    vn, en = parse_name(oname)
    zh = en if en else vn
    ja = en if en else vn
    ko = en if en else vn

    # Row-Based Inserts
    # Assuming Table: Translation_Locations
    # Columns: MappedinId, LocationType, LanguageId, TranslatedText
    
    # VN
    sql_lines.append(f"INSERT INTO Translation_Locations (MappedinId, LocationType, LanguageId, TranslatedText) VALUES ('{oid}', '{otype}', 'vn', {sanitize(vn)});")
    # EN
    sql_lines.append(f"INSERT INTO Translation_Locations (MappedinId, LocationType, LanguageId, TranslatedText) VALUES ('{oid}', '{otype}', 'en', {sanitize(en)});")
    # ZH
    sql_lines.append(f"INSERT INTO Translation_Locations (MappedinId, LocationType, LanguageId, TranslatedText) VALUES ('{oid}', '{otype}', 'zh', {sanitize(zh)});")
    # JA
    sql_lines.append(f"INSERT INTO Translation_Locations (MappedinId, LocationType, LanguageId, TranslatedText) VALUES ('{oid}', '{otype}', 'ja', {sanitize(ja)});")
    # KO
    sql_lines.append(f"INSERT INTO Translation_Locations (MappedinId, LocationType, LanguageId, TranslatedText) VALUES ('{oid}', '{otype}', 'ko', {sanitize(ko)});")

with open('database/seed_supplement_2f_3f.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_lines))

print(f"Generated seed_supplement_2f_3f.sql with {len(sql_lines)} lines.")
