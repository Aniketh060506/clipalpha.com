import sys
import re

with open('src/pages/LandingPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix framer-motion imports to include useMotionValue, useSpring
content = content.replace('import { motion, useScroll, useTransform } from "framer-motion";', 'import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";')

# Define new Crazy3DSpotlightCard
crazy_card = '''/* ───── interactive crazy 3D card ───── */

function SpotlightCard({ item }: { item: any }) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Spotlight state
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // 3D Tilt state
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth out the rotation
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  // Rotate based on mouse pos
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["25deg", "-25deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-25deg", "25deg"]);

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
    <div className={`w-[calc(100%-4.5rem)] ml-auto md:ml-0 md:w-[calc(50%-4rem)] relative perspective-[1500px]`}>
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
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`w-full h-full relative group cursor-crosshair`}
      >
        {/* The Card Background and Lights (Flattened & Clipped) */}
        <div className="absolute inset-0 bg-card/80 backdrop-blur-md rounded-[2.5rem] border-[4px] border-background group-hover:border-border/80 shadow-[0_20px_50px_rgba(0,0,0,0.15)] group-hover:shadow-[0_50px_100px_rgba(0,0,0,0.4)] transition-all duration-300 overflow-hidden">
           {/* Spotlight Flashlight tracking mouse */}
           <div
             className={`absolute pointer-events-none rounded-full blur-[60px] transition-opacity duration-300 z-0 bg-gradient-to-tr ${item.color}`}
             style={{
               left: mousePosition.x - 250,
               top: mousePosition.y - 250,
               width: 500,
               height: 500,
               opacity: isHovered ? 0.8 : 0
             }}
           />
           
           {/* Existing Background gradient blob inside card */}
           <div className={`absolute -bottom-10 -right-10 w-64 h-64 rounded-full bg-gradient-to-tr ${item.color} blur-3xl opacity-30 pointer-events-none group-hover:opacity-90 transition-opacity duration-500`} />
        </div>
        
        {/* Deep 3D Content wrapper - NOT clipped */}
        <div className="relative z-10 p-8 md:p-10 pointer-events-none" style={{ transform: "translateZ(80px)", transformStyle: "preserve-3d" }}>
          <div 
             className={`w-16 h-16 rounded-2xl bg-background border-2 border-border flex items-center justify-center mb-6 shadow-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6`}
             style={{ transform: "translateZ(60px)" }}
          >
            <item.icon className={`w-8 h-8 ${item.textColor}`} />
          </div>
          
          <h3 
             className="text-3xl font-heading font-black text-foreground mb-4 tracking-tight drop-shadow-lg"
             style={{ transform: "translateZ(40px)" }}
          >
             {item.title}
          </h3>
          
          <p 
             className="text-muted-foreground font-body text-base md:text-lg leading-relaxed drop-shadow-md"
             style={{ transform: "translateZ(20px)" }}
          >
             {item.desc}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function LandingPage'''

# Replace old SpotlightCard chunk
target_card = r'/\* ───── interactive spotlight card ───── \*/[\s\S]*?export default function LandingPage'
content = re.sub(target_card, crazy_card, content)

with open('src/pages/LandingPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Ultra responsive 3D card added.")
