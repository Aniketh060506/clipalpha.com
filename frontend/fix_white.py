import os

# 1. Update index.css for better Light Mode contrast
css_path = 'src/index.css'
with open(css_path, 'r', encoding='utf-8') as f:
    css = f.read()

# Replace light mode background and card
css = css.replace('--background: 210 100% 98%;', '--background: 210 20% 96%;')
css = css.replace('--card: 210 60% 97%;', '--card: 0 0% 100%;')
css = css.replace('--muted: 210 30% 92%;', '--muted: 210 20% 92%;')

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(css)

# 2. Update CreateWorkspace.tsx to use bg-card for inner elements
cw_path = 'src/components/create/CreateWorkspace.tsx'
with open(cw_path, 'r', encoding='utf-8') as f:
    cw = f.read()

# I mapped 'bg-white dark:bg-slate-950' to 'bg-background' earlier.
# I want to change specific instances of 'bg-background' back to 'bg-card' where they are inner elements.
# The inputs and buttons had: className="w-full bg-background border-2 border-border
cw = cw.replace('className="w-full bg-background border-2', 'className="w-full bg-card border-2')
cw = cw.replace('rounded-lg bg-background border-2', 'rounded-lg bg-card border-2')
# Nav bar background:
cw = cw.replace('bg-background/80 backdrop-blur-md', 'bg-card/80 backdrop-blur-md border-b border-border/40')

with open(cw_path, 'w', encoding='utf-8') as f:
    f.write(cw)

# 3. RichEditors.tsx uses some hardcoded whites maybe?
re_path = 'src/components/create/RichEditors.tsx'
with open(re_path, 'r', encoding='utf-8') as f:
    re = f.read()

re = re.replace('bg-white dark:bg-slate-950', 'bg-card')
re = re.replace('bg-slate-50 dark:bg-slate-900', 'bg-muted/50')
re = re.replace('border-slate-200 dark:border-slate-800', 'border-border')
re = re.replace('bg-slate-900 dark:bg-white', 'bg-foreground')
re = re.replace('text-slate-900 dark:text-white', 'text-foreground')

with open(re_path, 'w', encoding='utf-8') as f:
    f.write(re)

print("Light mode contrast restored.")
