
try:
    with open('database/backup_reference.sql', 'rb') as f:
        content = f.read(2000)
        print(content.decode('utf-16'))
except Exception as e:
    print(e)
