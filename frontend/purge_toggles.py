import os

def remove_theme_toggles(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Strip the import
    content = content.replace('import { ThemeToggle } from "../components/ThemeToggle";\n', '')
    content = content.replace('import { ThemeToggle } from "../ThemeToggle";\n', '')
    content = content.replace("import { ThemeToggle } from '../components/ThemeToggle';\n", '')
    content = content.replace("import { ThemeToggle } from '../ThemeToggle';\n", '')
    
    # 2. Strip component 
    content = content.replace('<ThemeToggle />\n', '')
    content = content.replace('      <ThemeToggle />', '')
    content = content.replace('<ThemeToggle />', '')
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

pages = [
    'src/pages/LandingPage.tsx',
    'src/pages/SlugPage.tsx',
    'src/components/create/CreateWorkspace.tsx',
    'src/components/view/PasswordCard.tsx'
]

for p in pages:
    if os.path.exists(p):
        remove_theme_toggles(p)
        print(f"Purged from {p}")

print("Toggle cleanup complete.")
