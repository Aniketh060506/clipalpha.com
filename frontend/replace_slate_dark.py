import os
import re

directories = ['src/components', 'src/pages', 'src/utils']

replacements = {
    r'dark:bg-slate-950': 'dark:bg-black',
    r'dark:bg-slate-900': 'dark:bg-[#0a0a0a]',
    r'dark:bg-slate-800': 'dark:bg-[#141414]',
    r'dark:bg-slate-700': 'dark:bg-[#1f1f1f]',
    
    r'dark:border-slate-950': 'dark:border-[#0a0a0a]',
    r'dark:border-slate-900': 'dark:border-[#141414]',
    r'dark:border-slate-800': 'dark:border-[#1f1f1f]',
    r'dark:border-slate-700': 'dark:border-[#292929]',
    r'dark:border-slate-600': 'dark:border-[#333333]',
    
    r'dark:hover:bg-slate-950': 'dark:hover:bg-black',
    r'dark:hover:bg-slate-900': 'dark:hover:bg-[#141414]',
    r'dark:hover:bg-slate-800': 'dark:hover:bg-[#1f1f1f]',
    r'dark:hover:bg-slate-700': 'dark:hover:bg-[#292929]',
    
    r'dark:hover:border-slate-800': 'dark:hover:border-[#1f1f1f]',
    r'dark:hover:border-slate-700': 'dark:hover:border-[#292929]',

    r'dark:focus:bg-slate-900': 'dark:focus:bg-[#0a0a0a]',
    r'dark:focus:bg-slate-800': 'dark:focus:bg-[#141414]',

    r'dark:disabled:bg-slate-900': 'dark:disabled:bg-[#0a0a0a]',
    r'dark:disabled:text-slate-500': 'dark:disabled:text-[#666666]',
    
    r'dark:text-slate-400': 'dark:text-[#999999]',
    r'dark:text-slate-500': 'dark:text-[#666666]',
    r'dark:text-slate-300': 'dark:text-[#cccccc]',
}

def process_file(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        for pattern, replacement in replacements.items():
            content = re.sub(pattern, replacement, content)
            
        if content != original_content:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Purged slate from {path}")
    except Exception as e:
        print(f"Error processing {path}: {e}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            process_file(os.path.join(root, file))

print("Complete.")
