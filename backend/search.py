import re

with open(r'c:\Users\SUDIP\OneDrive\Desktop\15.09\RailSync\backend\main.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '@app.' in line or 'FastAPI(' in line or 'network-references' in line:
        print(f"Line {i+1}: {line.strip()}")
