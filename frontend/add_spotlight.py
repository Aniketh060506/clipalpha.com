import re

with open('src/pages/LandingPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add React MouseEvent
content = content.replace('import { useRef } from "react";', 'import React, { useRef, useState } from "react";')

spotlight_code = '''
/* ───── interactive spotlight 1card ───── */

function SpotlightCard({ item }: { item: any }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePosition({ x, y });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`w-[calc(100%-4.5rem)] ml-auto md:ml-0 md:w-[calc(50%-4rem)] bg-card/80 backdrop-blur-md rounded-[2rem] border border-border p-8 shadow-[0_20px_50px_rgba(0,0,0,0.15)] relative overflow-hidden group hover:border-border/80 hover:shadow-2xl transition-shadow duration-300`}
    >
      {/* Spotlight Flashlight tracking mouse */}
      <div
        className={`absolute pointer-events-none rounded-full blur-[60px] opacity-0 group-hover:opacity-40 transition-opacity duration-500 z-0 bg-gradient-to-tr ${item.color}`}
        style={{
          left: mousePosition.x - 200,
          top: mousePosition.y - 200,
          width: 400,
          height: 400,
        }}
      />
      
      {/* Existing Background gradient blob inside card */}
      <div className={`absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-gradient-to-tr ${item.color} blur-3xl opacity-30 pointer-events-none group-hover:opacity-50 transition-opacity duration-500`} />
      
      <div className="relative z-10 pointer-events-none">
        <div className={`w-14 h-14 rounded-2xl bg-background border border-border flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
          <item.icon className={`w-7 h-7 ${item.textColor}`} />
        </div>
        <h3 className="text-2xl md:text-3xl font-heading font-black text-foreground mb-3 tracking-tight">{item.title}</h3>
        <p className="text-muted-foreground font-body text-sm md:text-base leading-relaxed">{item.desc}</p>
      </div>
    </motion.div>
  );
}

export default function LandingPage'''

content = content.replace("export default function LandingPage", spotlight_code)

card_target = r'''\{\/\* Sleek Card \*\/\}[\s\S]*?\{\/\* Empty Flex Spacer \*\/\}'''
card_replacement = r'''{/* Sleek Card */}
                  <SpotlightCard item={item} />

                  {/* Empty Flex Spacer */}'''
content = re.sub(card_target, card_replacement, content)

with open('src/pages/LandingPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Spotlight effect added successfully.")
