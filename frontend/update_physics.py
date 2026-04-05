import re

with open('src/pages/LandingPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace the empty Nav with the requested Top Center Nav
nav_replacement = r'''{/* ═══ NAV ═══ */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="absolute top-0 left-0 right-0 z-50 pt-8 pb-4 flex flex-col items-center justify-center pointer-events-none"
      >
        <span className="font-heading text-3xl font-black text-foreground tracking-tighter">
          pastit<span className="text-primary">.</span>site
        </span>
        <span className="text-[0.65rem] font-body font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1 opacity-80">
          The ultimate dead drop
        </span>
      </motion.nav>'''
content = content.replace('{/* NAV REMOVED AS REQUESTED */}', nav_replacement)

# 2. Add refs for timeline animation right after hero refs
ref_target = r'(const heroOpacity = useTransform\(scrollYProgress, \[0, 0\.8\], \[1, 0\]\);)'
ref_addition = r'''\1

  const timelineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: timelineProgress } = useScroll({
    target: timelineRef,
    offset: ["start center", "end center"]
  });
  const lineHeight = useTransform(timelineProgress, [0, 1], ["0%", "100%"]);'''
content = re.sub(ref_target, ref_addition, content)

# 3. Completely replace the Quick Start relative container
# Using a regex that captures everything from {/* Dynamic Scrolling Path */} down to the end of the section container
quick_section_regex = r'\{\/\* Dynamic Scrolling Path \*\/\}[\s\S]*?\{\/\* Empty Flex Spacer \*\/\}[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>'

smooth_quick_section = r'''{/* Dynamic Scrolling Path */}
          <div ref={timelineRef} className="relative py-10">
            {/* The Track */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-2.5 bg-background border border-border rounded-full -translate-x-1/2 shadow-inner overflow-hidden flex justify-center">
               {/* The Fill */}
               <motion.div 
                 className="absolute top-0 w-full bg-gradient-to-b from-primary via-accent to-success rounded-full origin-top" 
                 style={{ height: lineHeight }}
               />
            </div>

            <div className="space-y-16 md:space-y-24 flex flex-col items-stretch relative z-10">
              {[
                {
                  step: "1",
                  title: "Pick your secret name",
                  desc: "Start with any URL slice you want, like pastit.site/super-secret-keys. Or let us generate a perfectly random one for you.",
                  icon: Globe,
                  color: "from-primary/40 to-primary/10",
                  textColor: "text-primary",
                  borderColor: "border-primary",
                  align: "left",
                },
                {
                  step: "2",
                  title: "Dump your data in",
                  desc: "Paste giant text blocks, drop 50MB files, and toggle the vault. Type a password and everything scrambles instantly.",
                  icon: Lock,
                  color: "from-accent/40 to-accent/10",
                  textColor: "text-accent",
                  borderColor: "border-accent",
                  align: "right",
                },
                {
                  step: "3",
                  title: "Copy & let it vanish",
                  desc: "Share your shiny new self-destructing link. The moment they open it, poof. The database securely obliterates the key and the payload.",
                  icon: Flame,
                  color: "from-success/40 to-success/10",
                  textColor: "text-success",
                  borderColor: "border-success",
                  align: "left",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 50, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: false, amount: 0.3 }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  className={`relative flex items-center gap-6 md:gap-12 ${
                    item.align === "right" ? "md:flex-row-reverse" : "md:flex-row"
                  }`}
                >
                  {/* Glowing Node on Line */}
                  <div className="absolute left-8 md:left-1/2 -translate-x-1/2 flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: false, amount: 0.8 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className={`w-12 h-12 md:w-16 md:h-16 rounded-full bg-background border-[4px] ${item.borderColor} flex items-center justify-center shadow-xl relative overflow-hidden`}
                    >
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} className={`absolute inset-0 bg-gradient-to-tr ${item.color} opacity-30`} />
                      <span className={`text-xl md:text-2xl font-heading font-black ${item.textColor} relative z-10`}>{item.step}</span>
                    </motion.div>
                  </div>

                  {/* Sleek Card */}
                  <div className={`w-[calc(100%-4.5rem)] ml-auto md:ml-0 md:w-[calc(50%-4rem)] bg-card/80 backdrop-blur-md rounded-[2rem] border border-border p-8 shadow-lg relative overflow-hidden group hover:border-border/80 transition-all duration-300 hover:-translate-y-1`}>
                     {/* Background gradient blob inside card */}
                     <div className={`absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-gradient-to-tr ${item.color} blur-3xl opacity-30 pointer-events-none group-hover:opacity-60 transition-opacity duration-500`} />
                     
                     <div className="relative z-10">
                       <div className={`w-14 h-14 rounded-2xl bg-background border border-border flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                         <item.icon className={`w-7 h-7 ${item.textColor}`} />
                       </div>
                       <h3 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-3 tracking-tight">{item.title}</h3>
                       <p className="text-muted-foreground font-body text-sm md:text-base leading-relaxed">{item.desc}</p>
                     </div>
                  </div>

                  {/* Empty Flex Spacer */}
                  <div className="hidden md:block md:w-[calc(50%-4rem)]" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>'''
content = re.sub(quick_section_regex, smooth_quick_section, content)

with open('src/pages/LandingPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Animation physics updated.")
