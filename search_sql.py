
import re

path = r"c:\Users\Welcome\Downloads\ERP-Mappedin\database\Script_Mappedin_22-01-2026.sql"

def search_text(term):
    for enc in ['utf-16', 'utf-8']:
        try:
            with open(path, 'r', encoding=enc) as f:
                content = f.read()
                matches = re.findall(r"N'[^']*"+term+r"[^']*'", content)
                if matches:
                    print(f"Found matches for '{term}' with {enc}:")
                    for m in matches[:5]:
                        print(m)
                    return True
        except Exception:
            pass
    return False

search_text("Check-in")
search_text("Quầy thủ tục")
