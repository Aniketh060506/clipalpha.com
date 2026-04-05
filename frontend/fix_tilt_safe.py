import sys

with open('src/pages/LandingPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('whileHover={{ scale: 1.05, y: -12, rotate: [0, -3, 3, -1, 1, 0] }}', 'whileHover={{ scale: 1.04, y: -12, rotate: item.align === "left" ? -2 : 2 }}')
content = content.replace('transition={{ type: "spring", stiffness: 400, damping: 20 }}', 'transition={{ type: "spring", stiffness: 500, damping: 25 }}')

with open('src/pages/LandingPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Ultra smooth snap tilt added.")
