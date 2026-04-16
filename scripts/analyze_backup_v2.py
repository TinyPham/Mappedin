
import re

def analyze():
    print("Reading file...")
    try:
        with open('database/backup_reference.sql', 'r', encoding='utf-16') as f:
            lines = f.readlines()
    except Exception as e:
        print(f"Read error: {e}")
        return

    print(f"Read {len(lines)} lines.")
    
    current_table = None
    table_lines = []
    
    found_tables = {}

    for line in lines:
        line = line.strip()
        if line.startswith("CREATE TABLE"):
            current_table = line
            table_lines = [line]
        elif current_table:
            table_lines.append(line)
            if line.endswith(");") or line.startswith("GO"):
                # Table end
                full_def = "\n".join(table_lines)
                if "Translation" in current_table or "UI" in current_table:
                    print(f"FOUND TABLE: {current_table}")
                    print(full_def)
                    print("-" * 20)
                current_table = None
                table_lines = []

analyze()
