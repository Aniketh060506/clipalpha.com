import os

def strip_backgrounds(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # CreateWorkspace & PasswordCard attachment panel wrappers:
    content = content.replace('flex-shrink-0 flex flex-col bg-muted/20 relative', 'flex-shrink-0 flex flex-col relative')
    
    # CreateWorkspace & PasswordCard footer wrapper:
    content = content.replace('opacity-60 bg-background z-10 shrink-0', 'opacity-60 z-10 shrink-0')
    content = content.replace('opacity-50 bg-background shrink-0', 'opacity-50 shrink-0')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

strip_backgrounds('src/components/create/CreateWorkspace.tsx')
strip_backgrounds('src/components/view/PasswordCard.tsx')
print("Editor shells unified.")
