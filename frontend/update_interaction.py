import sys
import re

with open('src/pages/LandingPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Professional3DSpotlightCard with clean ActionCard
action_card = '''/* ───── interactive jump card ───── */

function ActionCard({ item }: { item: any }) {
  return (
    <div className={`w-[calc(100%-4.5rem)] ml-auto md:ml-0 md:w-[calc(50%-4rem)]`}>
      <motion.div
        whileHover={{ scale: 1.05, y: -10 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className={`w-full relative group cursor-pointer`}
      >
        {/* The Card Background */}
        <div className={`absolute inset-0 bg-card/90 backdrop-blur-xl rounded-[1.5rem] md:rounded-[2rem] border-[2px] border-border/40 shadow-sm group-hover:border-foreground/15 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden`}>
           {/* Subtle corner glow instead of distracting flashlight */}
           <div className={`absolute -top-20 -right-20 w-48 h-48 rounded-full bg-gradient-to-tr ${item.color} blur-3xl opacity-0 pointer-events-none group-hover:opacity-40 transition-opacity duration-300`} />
           <div className={`absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-gradient-to-tr ${item.color} blur-3xl opacity-10 pointer-events-none group-hover:opacity-40 transition-opacity duration-500`} />
        </div>
        
        {/* Content */}
        <div className="relative z-10 p-6 md:p-8">
          {/* Jumping Icon */}
          <motion.div 
             className={`w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center mb-5 shadow-sm origin-bottom`}
             whileHover={{ rotate: [0, -15, 15, -15, 0], scale: 1.15, y: -5 }}
             transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <item.icon className={`w-6 h-6 ${item.textColor}`} />
          </motion.div>
          
          <h3 className="text-xl md:text-2xl font-heading font-bold text-foreground mb-3 tracking-tight transition-colors duration-300">
             {item.title}
          </h3>
          
          <p className="text-muted-foreground font-body text-sm md:text-base leading-relaxed transition-colors duration-300">
             {item.desc}
          </p>
        </div>
      </motion.div>
    </div>
  );
}'''

target_card = r'/\* ───── interactive professional 3D card ───── \*/[\s\S]*?export default function LandingPage'
content = re.sub(target_card, action_card + '\n\nexport default function LandingPage', content)

# I don't know if the previous regex left "interactive crazy 3D card" or whatever name was used 
# Just in case, I will try to match whatever is between the interactive comment and export default!
target_card_fallback = r'/\* ───── interactive.*?card ───── \*/[\s\S]*?export default function LandingPage'
content = re.sub(target_card_fallback, action_card + '\n\nexport default function LandingPage', content)

# Also rename <SpotlightCard item={item} /> to <ActionCard item={item} /> inside the map loop
content = content.replace('<SpotlightCard item={item} />', '<ActionCard item={item} />')

with open('src/pages/LandingPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("ActionCard applied.")
