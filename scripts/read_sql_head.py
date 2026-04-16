
import os

path = r"c:\Users\Welcome\Downloads\ERP-Mappedin\database\Script_Mappedin_22-01-2026.sql"
try:
    with open(path, 'r', encoding='utf-16') as f:
        print(f.read(2000)) # First 2000 chars
except Exception as e:
    print(e)
    try:
        with open(path, 'r', encoding='utf-8') as f:
            print(f.read(2000))
    except Exception as e2:
        print(e2)
