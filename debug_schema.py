
import re

def extract_exact_table():
    try:
        with open('database/backup_reference.sql', 'rb') as f:
            data = f.read()
            text = data.decode('utf-16', errors='ignore')
    except:
        return

    # Find the CREATE TABLE block for Translation_Locations
    match = re.search(r'CREATE TABLE \[dbo\]\.\[Translation_Locations\]\((.*?)\) ON \[PRIMARY\]', text, re.DOTALL)
    if match:
        print("MATCH FOUND:")
        print(match.group(1))
    else:
        print("NO MATCH FOUND")

extract_exact_table()
