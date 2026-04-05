import os
from pathlib import Path

def remove_theme_toggles(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        original = content
        
        # 1. Strip the import
        content = content.replace('import { ThemeToggle } from "../components/ThemeToggle";\n', '')
        content = content.replace('import { ThemeToggle } from "../ThemeToggle";\n', '')
        content = content.replace("import { ThemeToggle } from '../components/ThemeToggle';\n", '')
        content = content.replace("import { ThemeToggle } from '../ThemeToggle';\n", '')
        
        # 2. Strip component 
        content = content.replace('<ThemeToggle />\n', '')
        content = content.replace('      <ThemeToggle />\n', '')
        content = content.replace('        <ThemeToggle />\n', '')
        content = content.replace('          <ThemeToggle />\n', '')
        
        if content != original:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Purged from {file_path}")
    except Exception as e:
        print(f"Failed on {file_path}: {e}")

base_dir = Path.cwd() / 'src'
pages = [
    base_dir / 'pages' / 'LandingPage.tsx',
    base_dir / 'pages' / 'SlugPage.tsx',
    base_dir / 'components' / 'create' / 'CreateWorkspace.tsx',
    base_dir / 'components' / 'view' / 'PasswordCard.tsx'
]

for p in pages:
    remove_theme_toggles(p)

print("Toggle cleanup complete.")
