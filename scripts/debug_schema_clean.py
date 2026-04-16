
import re

def extract_clean():
    try:
        with open('database/backup_reference.sql', 'rb') as f:
            data = f.read()
            text = data.decode('utf-16', errors='ignore')
    except:
        return

    # Find the CREATE TABLE block for Translation_Locations
    match = re.search(r'CREATE TABLE \[dbo\]\.\[Translation_Locations\]\((.*?)\) ON \[PRIMARY\]', text, re.DOTALL)
    if match:
        body = match.group(1)
        lines = [line.strip() for line in body.split('\n') if line.strip()]
        for line in lines:
            print(line)

extract_clean()
