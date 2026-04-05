import os
import re

directories = ['src/components/create', 'src/components/view']

def reset_classes(text):
    # Strip manual dark toggles that we want to replace entirely with Semantic
    text = re.sub(r'bg-\[#0a0a0a\] text-white border-\[#141414\] shadow-sm dark:bg-white dark:text-slate-900 dark:border-white', 'bg-foreground text-background shadow-sm border-transparent', text)
    text = re.sub(r'border-slate-200 dark:border-\[#292929\] bg-transparent text-slate-600 dark:text-\[#999999\] hover:bg-slate-200 dark:hover:bg-\[#1f1f1f\] hover:text-slate-900 dark:hover:text-white', 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground', text)
    
    # BentoCard active/inactive
    text = re.sub(r"bg-\[#0a0a0a\] dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm ring-1 ring-slate-900/50", "bg-foreground text-background shadow-sm", text)
    text = re.sub(r"bg-slate-200 dark:bg-\[#141414\] text-slate-700 dark:text-\[#cccccc\] ring-1 ring-slate-300 dark:ring-slate-700", "bg-muted text-muted-foreground border border-border", text)
    text = re.sub(r"text-slate-700 dark:text-\[#999999\]", "text-muted-foreground", text)
    text = re.sub(r"bg-slate-300 dark:bg-\[#1f1f1f\] justify-start hover:bg-slate-400 dark:hover:bg-slate-600", "bg-muted justify-start border border-border", text)
    
    text = re.sub(r"border border-slate-200 dark:border-\[#292929\] shadow-\[0_12px_30px_rgb\(0,0,0,0\.08\)\] bg-white dark:bg-\[#0a0a0a\]", "border border-border/60 shadow-lg bg-card", text)
    text = re.sub(r"border border-slate-200/60 dark:border-\[#1f1f1f\] bg-white/50 dark:bg-\[#0a0a0a\]/30 shadow-sm opacity-100 hover:shadow-md hover:border-slate-200/90", "border border-border/40 bg-card/60 shadow-sm hover:shadow-md hover:bg-card/90", text)
    
    # Generic hex class cleanup mapping to semantics
    text = text.replace('disabled:bg-slate-100 dark:disabled:bg-[#0a0a0a]', 'disabled:bg-muted disabled:opacity-50')
    text = text.replace('disabled:text-slate-400 dark:disabled:text-[#666666]', 'disabled:text-muted-foreground')
    text = text.replace('placeholder:text-slate-400', 'placeholder:text-muted-foreground/60')
    text = text.replace('hover:bg-slate-100 dark:hover:bg-[#141414]', 'hover:bg-muted')
    text = text.replace('hover:border-slate-300', 'hover:border-foreground/20')
    text = text.replace('focus:bg-slate-100 dark:focus:bg-[#141414]', 'focus:bg-muted')
    text = text.replace('text-slate-500 dark:text-[#999999]', 'text-muted-foreground')
    text = text.replace('border-slate-200/60 dark:border-[#1f1f1f]', 'border-border')
    text = text.replace('bg-white dark:bg-[#0a0a0a]', 'bg-card')
    
    # RichEditors & Content Areas
    text = text.replace('bg-[#0a0a0a] text-green-400', 'bg-[#0f172a] text-emerald-400') # Give code a distinct sleek dark theme always
    text = text.replace('bg-[#0a0a0a] border-border', 'bg-muted/30 border-border')
    text = text.replace('placeholder:text-[#666666]', 'placeholder:text-muted-foreground/50')
    text = text.replace('text-[#666666] rounded-b-xl', 'text-muted-foreground rounded-b-xl')
    text = text.replace('bg-[#0a0a0a] rounded-b-xl', 'bg-card rounded-b-xl')
    
    # PasswordCard Tabs
    text = text.replace('border-current/20', 'border-foreground/10')
    text = text.replace('text-muted-foreground/60 hover:text-foreground hover:bg-muted/50', 'text-muted-foreground hover:text-foreground hover:bg-muted/40')
    
    # ViewScreen general
    text = text.replace('bg-slate-100 dark:bg-[#0a0a0a]', 'bg-background')
    
    return text

def process_file(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        new_content = reset_classes(content)
        
        if new_content != content:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Applying semantic reset to {path}")
    except Exception as e:
        print(f"Error processing {path}: {e}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            process_file(os.path.join(root, file))

print("Semantic reset execution complete.")
