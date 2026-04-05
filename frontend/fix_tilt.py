import re

with open('src/pages/LandingPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = r'whileHover=\{\{ scale: 1\.05, y: -12, rotate: \[0, -3, 3, -1, 1, 0\] \}\}\n\s*whileTap=\{\{ scale: 0\.98 \}\}\n\s*transition=\{\{ type: "spring", stiffness: 400, damping: 20 \}\}'
replacement = r'''whileHover={{ scale: 1.04, y: -12, rotate: item.align === "left" ? -2 : 2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}'''

content = re.sub(target, replacement, content)

with open('src/pages/LandingPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Ultra smooth snap tilt added.")
