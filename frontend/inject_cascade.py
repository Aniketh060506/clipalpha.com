import re

def inject_cascade(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # CreateWorkspace.tsx injections
    if "CreateWorkspace" in file_path:
        content = re.sub(r'(<div className="flex-1 min-w-\[200px\] p-6 rounded-3xl border[^"]+)(")', r'\1 theme-cascade-1\2', content)
        content = re.sub(r'(<div className="flex-\[1\.5\] min-w-\[280px\] p-6 rounded-3xl border[^"]+)(")', r'\1 theme-cascade-2\2', content)
        content = re.sub(r'(<div className="flex-\[0\.8\] min-w-\[150px\] p-6 rounded-3xl border[^"]+)(")', r'\1 theme-cascade-3\2', content)
        # Burn button card in CreateWorkspace
        content = re.sub(r'(<div className="flex-\[0\.8\] min-w-\[150px\] p-6 rounded-3xl border border-transparent[^"]+)(")', r'\1 theme-cascade-4\2', content)
        
        # The massive editor block
        content = re.sub(r'(<div className="flex-1 flex flex-col lg:flex-row relative rounded-2xl border[^"]+)(")', r'\1 theme-cascade-5\2', content)
        
    # PasswordCard.tsx injections
    elif "PasswordCard" in file_path:
        # Top badges or stats row can be cascade-1 and 2
        content = re.sub(r'(<div className="p-6[^"]*border-b[^"]+)(")', r'\1 theme-cascade-1\2', content)
        
        # Meta grid
        content = re.sub(r'(<div className="p-6 bg-muted/20[^"]+)(")', r'\1 theme-cascade-2\2', content)
        
        # Password view specific cards
        content = re.sub(r'(<div className="flex-1 flex flex-col lg:flex-row relative rounded-2xl border[^"]+)(")', r'\1 theme-cascade-5\2', content)
        
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

pages = [
    r'src\components\create\CreateWorkspace.tsx',
    r'src\components\view\PasswordCard.tsx'
]

for p in pages:
    try:
        inject_cascade(p)
        print(f"Patched {p}")
    except Exception as e:
        print(f"Failed {p}: {e}")
