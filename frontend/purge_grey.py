import os
import re

directories = ['src/components', 'src/pages', 'src/utils']

replacements = {
    # Unconditional grey-blues hiding in the editors:
    r'bg-slate-950': 'bg-black',
    r'bg-slate-900': 'bg-[#0a0a0a]',
    r'bg-slate-800': 'bg-[#141414]',
    r'bg-slate-700': 'bg-[#1f1f1f]',
    
    r'border-slate-900': 'border-[#141414]',
    r'border-slate-800': 'border-[#1f1f1f]',
    
    # Specific to the text editor placeholder:
    r'placeholder:text-slate-500': 'placeholder:text-[#666666]',
    r'text-slate-500 rounded-b-xl': 'text-[#666666] rounded-b-xl'
}

def process_file(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        original_content = content
        
        # We only want to replace literal appearances that don't have 'dark:' prefix,
        # but the previous script already altered all the 'dark:' versions, so 
        # what remains are just unconditional plain classes (like "bg-slate-900").
        
        for p, r in replacements.items():
            content = content.replace(p, r)
            
        if content != original_content:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Purged residual grey slates from {path}")
    except Exception as e:
        print(f"Error processing {path}: {e}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            process_file(os.path.join(root, file))

print("Total purge complete.")
