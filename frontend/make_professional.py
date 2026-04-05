import sys
import re

with open('src/pages/LandingPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_card = '''/* ───── interactive crazy 3D card ───── */

function SpotlightCard({ item }: { item: any }) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Spotlight state
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // 3D Tilt state
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth out the rotation - Professional feel (higher stiffness, less damping for crisp response)
  const mouseXSpring = useSpring(x, { stiffness: 400, damping: 40 });
  const mouseYSpring = useSpring(y, { stiffness: 400, damping: 40 });

  // Rotate based on mouse pos - Restrained to small angles (8 degrees max)
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["8deg", "-8deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-8deg", "8deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    
    // Spotlight coords
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setMousePosition({ x: mouseX, y: mouseY });

    // 3D Tilt coords (normalized -0.5 to 0.5)
    x.set(mouseX / rect.width - 0.5);
    y.set(mouseY / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <div className={`w-[calc(100%-4.5rem)] ml-auto md:ml-0 md:w-[calc(50%-4rem)] relative perspective-[1200px]`}>
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d"
        }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className={`w-full relative group`}
      >
        {/* The Card Background and Lights (Flattened & Clipped) */}
        <div className="absolute inset-0 bg-card/80 backdrop-blur-sm rounded-[1.5rem] md:rounded-[2rem] border-[1px] md:border-[2px] border-border/60 group-hover:border-border shadow-lg group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 overflow-hidden">
           {/* Spotlight Flashlight tracking mouse */}
           <div
             className={`absolute pointer-events-none rounded-full blur-[50px] transition-opacity duration-300 z-0 bg-gradient-to-tr ${item.color}`}
             style={{
               left: mousePosition.x - 200,
               top: mousePosition.y - 200,
               width: 400,
               height: 400,
               opacity: isHovered ? 0.4 : 0
             }}
           />
           
           {/* Existing Background gradient blob inside card */}
           <div className={`absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-gradient-to-tr ${item.color} blur-3xl opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity duration-500`} />
        </div>
        
        {/* Subtle 3D Content wrapper - NOT clipped */}
        <div className="relative z-10 p-6 md:p-8 pointer-events-none" style={{ transform: "translateZ(20px)", transformStyle: "preserve-3d" }}>
          <div 
             className={`w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center mb-5 shadow-sm transition-transform duration-500 group-hover:scale-105`}
             style={{ transform: "translateZ(10px)" }}
          >
            <item.icon className={`w-5 h-5 md:w-6 md:h-6 ${item.textColor}`} />
          </div>
          
          <h3 
             className="text-xl md:text-2xl font-heading font-bold text-foreground mb-3 tracking-tight"
             style={{ transform: "translateZ(5px)" }}
          >
             {item.title}
          </h3>
          
          <p 
             className="text-muted-foreground font-body text-sm md:text-base leading-relaxed"
             style={{ transform: "translateZ(2px)" }}
          >
             {item.desc}
          </p>
        </div>
      </motion.div>
    </div>
  );
}'''

target_card = r'/\* ───── interactive crazy 3D card ───── \*/[\s\S]*?export default function LandingPage'
content = re.sub(target_card, new_card + '\n\nexport default function LandingPage', content)

# Reduce the spacing between cards
content = content.replace('space-y-16 md:space-y-24 flex flex-col', 'space-y-8 md:space-y-12 flex flex-col')

with open('src/pages/LandingPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Professional card layout applied.")
