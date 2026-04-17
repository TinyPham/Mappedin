
import re

def extract_table(table_name):
    print(f"Searching for {table_name}...")
    try:
        with open('database/backup_reference.sql', 'r', encoding='utf-16') as f:
            content = f.read()
    except:
        with open('database/backup_reference.sql', 'r', encoding='utf-8') as f:
            content = f.read()
            
    # Regex to find create table
    pattern = re.compile(f"CREATE TABLE \[dbo\]\.\[{table_name}\](.*?)\);", re.DOTALL)
    match = pattern.search(content)
    if match:
        print(f"FOUND {table_name}:")
        print(match.group(1))
    else:
        print(f"Not found: {table_name}")

extract_table('Translation_Locations')
extract_table('MasterData_Locations')
extract_table('Translation_UI')
