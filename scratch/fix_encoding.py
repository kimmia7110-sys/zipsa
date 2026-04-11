import os

file_path = r'd:\개발\zipsa\src\app\dashboard\page.tsx'

# Try reading as CP949 (Korean Windows default) or other encodings
encodings = ['cp949', 'utf-8', 'utf-16', 'euc-kr']

content = None
for enc in encodings:
    try:
        with open(file_path, 'r', encoding=enc) as f:
            content = f.read()
        print(f"Successfully read with {enc}")
        break
    except Exception as e:
        print(f"Failed with {enc}: {e}")

if content:
    # Write back as UTF-8 without BOM
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully converted to UTF-8")
else:
    print("Failed to read file with any common encoding")
