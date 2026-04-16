
def search_tables():
    print("Reading binary...")
    with open('database/backup_reference.sql', 'rb') as f:
        data = f.read()
    
    # Try decoding as utf-16le
    try:
        text = data.decode('utf-16')
    except:
        text = data.decode('utf-16', errors='ignore')

    # Look for "CREATE TABLE [dbo].[...]"
    import re
    tables = re.findall(r'CREATE TABLE \[dbo\]\.\[(.*?)\]', text)
    print("Tables found:", tables)

    # Specific look at Translation_Locations body
    if 'Translation_Locations' in tables:
        start = text.find('CREATE TABLE [dbo].[Translation_Locations]')
        end = text.find('GO', start)
        print("DEFINITION Translation_Locations:")
        print(text[start:end])
    
    if 'MasterData_Locations' in tables:
        start = text.find('CREATE TABLE [dbo].[MasterData_Locations]')
        end = text.find('GO', start)
        print("DEFINITION MasterData_Locations:")
        print(text[start:end])

search_tables()
