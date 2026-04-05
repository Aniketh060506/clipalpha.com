import sys
import re

with open('src/pages/LandingPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove Nav
content = re.sub(r'\{/\* ═══ NAV ═══ \*/\}.*?</motion\.nav>', '{/* NAV REMOVED AS REQUESTED */}', content, flags=re.DOTALL)

# Add Playful Hero Animation
target_hero = r'(<motion\.div\s+style=\{\{ y: heroY, scale: heroScale, opacity: heroOpacity \}\}\s+className="max-w-4xl mx-auto text-center relative z-10"\s*>)'
hero_addition = r'''\1
          {/* Playful Floating Hero Graphic */}
          <motion.div
            initial={{ opacity: 0, scale: 0.4, rotate: -20, y: 50 }}
            animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 12, delay: 0.2 }}
            className="mx-auto w-32 h-32 mb-10 relative flex justify-center items-center cursor-pointer perspective-[800px]"
            whileHover={{ scale: 1.15, rotateY: 15, rotateX: -10 }}
            whileTap={{ scale: 0.9, rotate: -5 }}
          >
            <motion.div
              animate={{ y: [-15, 15, -15], rotateZ: [-3, 3, -3] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="relative w-28 h-28 bg-gradient-to-tr from-primary via-accent to-success rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex items-center justify-center border-4 border-background overflow-hidden"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-white/20 blur-xl"
              />
              <Lock className="w-12 h-12 text-white relative z-10 drop-shadow-md" />
            </motion.div>
            <motion.div animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }} transition={{ repeat: Infinity, duration: 2, delay: 0.5 }} className="absolute -top-4 -right-4 text-accent"><Sparkles className="w-6 h-6" /></motion.div>
            <motion.div animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }} transition={{ repeat: Infinity, duration: 2.5, delay: 1 }} className="absolute -bottom-2 -left-4 text-success"><Sparkles className="w-5 h-5" /></motion.div>
          </motion.div>'''
content = re.sub(target_hero, hero_addition, content)

# Rewrite Quick Start
target_quick = r'\{/\* ═══ HOW TO USE IT ═══ \*/\}.*?</section>'
quick_replacement = r'''{/* ═══ HOW TO USE IT (PLAYFUL DYNAMIC) ═══ */}
      <section className="py-32 px-6 bg-section-lavender relative overflow-hidden">
        <FloatingBlob className="top-20 right-10 w-[40rem] h-[40rem] bg-primary/10 animate-pulse-soft blur-[100px]" />
        
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false }}
            variants={stagger}
            className="text-center mb-24"
          >
            <SectionTag>
              <Sparkles className="w-4 h-4" /> Quick Start
            </SectionTag>
            <motion.h2
              variants={popIn}
              custom={1}
              className="text-5xl md:text-6xl font-heading font-black text-foreground drop-shadow-sm"
            >
              Ready, set,<br />
              <motion.span
                className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto]"
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={{ duration: 4, ease: "linear", repeat: Infinity }}
              >
                Zero-knowledge!
              </motion.span>
            </motion.h2>
          </motion.div>

          {/* Dynamic Scrolling Path */}
          <div className="relative">
            <div className="absolute left-8 md:left-1/2 top-4 bottom-4 w-4 bg-muted rounded-full -translate-x-1/2 shadow-inner overflow-hidden">
               <motion.div 
                 className="absolute top-0 left-0 right-0 bg-primary/80" 
                 initial={{ height: "0%" }}
                 whileInView={{ height: "100%" }}
                 viewport={{ once: false, margin: "200px 0px -200px 0px" }}
                 transition={{ duration: 1.5, ease: "easeInOut" }}
               />
            </div>

            <div className="space-y-24 md:space-y-32 flex flex-col items-stretch">
              {[
                {
                  step: "1",
                  title: "Pick your secret name",
                  desc: "Start with any URL slice you want, like pastit.site/super-secret-keys. Or let us generate a perfectly random one for you.",
                  icon: Globe,
                  color: "from-primary/40 to-primary/10",
                  textColor: "text-primary",
                  align: "left",
                },
                {
                  step: "2",
                  title: "Dump your data in",
                  desc: "Paste giant text blocks, drag and drop 50MB files, and toggle the vault. Type a password and everything scrambles instantly.",
                  icon: Lock,
                  color: "from-accent/40 to-accent/10",
                  textColor: "text-accent",
                  align: "right",
                },
                {
                  step: "3",
                  title: "Copy & let it vanish",
                  desc: "Share your shiny new self-destructing link. The moment they open it, poof. The database securely obliterates the key and the payload.",
                  icon: Flame,
                  color: "from-success/40 to-success/10",
                  textColor: "text-success",
                  align: "left",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, scale: 0.6, rotate: item.align === "left" ? -8 : 8, y: 150 }}
                  whileInView={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
                  viewport={{ once: false, margin: "-100px 0px" }}
                  transition={{ type: "spring", bounce: 0.5, duration: 1.2 }}
                  whileHover={{ scale: 1.05, rotate: item.align === "left" ? 2 : -2 }}
                  className={`relative flex items-center gap-8 ${
                    item.align === "right" ? "md:flex-row-reverse" : "md:flex-row"
                  }`}
                >
                  {/* Bouncing Node on Line */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: false, margin: "-150px 0px" }}
                    transition={{ type: "spring", bounce: 0.7, duration: 1.5, delay: 0.2 }}
                    className="absolute left-8 md:left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-background border-4 border-primary flex items-center justify-center z-10 shadow-xl overflow-hidden"
                  >
                     <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-0 bg-primary/10" />
                     <span className="text-2xl font-heading font-black text-primary relative z-10">{item.step}</span>
                  </motion.div>

                  {/* Mega Card */}
                  <div className={`w-[calc(100%-5rem)] ml-auto md:ml-0 md:w-[calc(50%-4rem)] bg-card rounded-[2.5rem] border-[6px] border-background p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] relative overflow-hidden group hover:border-border transition-colors duration-500`}>
                     {/* Background gradient blob inside card */}
                     <motion.div 
                        animate={{ rotate: [0, 90, 0], scale: [1, 1.3, 1] }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className={`absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-tr ${item.color} blur-3xl opacity-60 pointer-events-none group-hover:opacity-100 transition-opacity duration-700`}
                     />
                     <div className="relative z-10">
                       <motion.div
                         whileHover={{ rotate: [0, -15, 15, -15, 0], scale: 1.2 }}
                         transition={{ duration: 0.5 }}
                         className={`w-16 h-16 rounded-2xl bg-background border-2 border-border flex items-center justify-center mb-6 shadow-sm`}
                       >
                         <item.icon className={`w-8 h-8 ${item.textColor}`} />
                       </motion.div>
                       <h3 className="text-3xl font-heading font-black text-foreground mb-4 leading-none tracking-tight">{item.title}</h3>
                       <p className="text-muted-foreground font-body text-base leading-relaxed md:text-lg">{item.desc}</p>
                     </div>
                  </div>

                  {/* Empty Flex Spacer */}
                  <div className="hidden md:block md:w-[calc(50%-4rem)]" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>'''
content = re.sub(target_quick, quick_replacement, content, flags=re.DOTALL)

with open('src/pages/LandingPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
