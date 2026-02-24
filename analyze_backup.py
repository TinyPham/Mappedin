import re

try:
    with open('database/backup_reference.sql', 'r', encoding='utf-16') as f:
        content = f.read()
except UnicodeError:
    try:
        with open('database/backup_reference.sql', 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading file: {e}")
        exit(1)

# Find Translation tables
tables = re.findall(r'CREATE TABLE \[dbo\]\.\[([a-zA-Z_]+)\] \((.*?)\);', content, re.DOTALL)
for name, body in tables:
    if 'Translation' in name or 'UI' in name or 'Location' in name:
        print(f"--- TABLE: {name} ---")
        print(body[:500])
        print("...")

# Find INSERT examples
inserts = re.findall(r'INSERT INTO \[?dbo\]?\.?\[?Translation_([a-zA-Z_]+)\]?.*VALUES.*', content, re.IGNORECASE)
print(f"\nFound {len(inserts)} INSERT statements for Translation tables.")
if inserts:
    print("Example INSERT:")
    print(inserts[0][:200])
