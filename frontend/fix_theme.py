import os

def process_file(path, replacements):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        for old, new in replacements.items():
            content = content.replace(old, new)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {path}")
    except Exception as e:
        print(f"Error processing {path}: {e}")

# 1. CreateWorkspace.tsx
create_replacements = {
    'bg-slate-100 dark:bg-slate-950': 'bg-background',
    'bg-white/60 dark:bg-slate-900/80': 'bg-background/80',
    'bg-white dark:bg-slate-950': 'bg-background',
    'border-slate-200 dark:border-slate-800': 'border-border',
    'bg-slate-900 dark:bg-white': 'bg-foreground dark:bg-foreground',
    'text-slate-900 dark:text-white': 'text-foreground',
    'import SlugPicker': 'import { ThemeToggle } from "../ThemeToggle";\nimport SlugPicker',
    '<motion.button onClick={handleCreate}': '<ThemeToggle />\n          <motion.button onClick={handleCreate}'
}
process_file('src/components/create/CreateWorkspace.tsx', create_replacements)

# 2. PasswordCard.tsx
view_replacements = {
    'bg-slate-100 dark:bg-slate-950': 'bg-background',
    'bg-white/60 dark:bg-slate-900/80': 'bg-background/80',
    'border-slate-200/60 dark:border-slate-800': 'border-border',
    'bg-white dark:bg-slate-900': 'bg-card',
    'import CountdownTimer': 'import { ThemeToggle } from "../ThemeToggle";\nimport CountdownTimer',
    '{/* Copy button */}': '<ThemeToggle />\n        {/* Copy button */}'
}
process_file('src/components/view/PasswordCard.tsx', view_replacements)

# 3. SlugPage.tsx
slug_replacements = {
    'bg-slate-100 dark:bg-slate-950': 'bg-background',
    'bg-white dark:bg-slate-900': 'bg-card',
    'border-slate-200/60 dark:border-slate-800': 'border-border',
    'import PasswordCard': 'import { ThemeToggle } from "../components/ThemeToggle";\nimport PasswordCard',
    '<AmbientBackground />': '<AmbientBackground />\n      <div className="absolute top-6 right-6 z-50">\n        <ThemeToggle />\n      </div>'
}
process_file('src/pages/SlugPage.tsx', slug_replacements)

# 4. SuccessScreen in CreateWorkspace.tsx
# Need to make sure SuccessScreen has toggle if needed? It uses same layout later.

print("Done.")
