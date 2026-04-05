import re

with open('src/pages/LandingPage.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Define section markers
m_nav = "{/* ═══ NAV ═══ */}"
m_hero = "{/* ═══ HERO ═══ */}"
m_htu = "{/* ═══ HOW TO USE IT (PLAYFUL DYNAMIC) ═══ */}"
m_prob = "{/* ═══ THE PROBLEM ═══ */}"
m_feat = "{/* ═══ WHAT MAKES US DIFFERENT ═══ */}"
m_sec = "{/* ═══ SECURITY & TRUST ═══ */}"
m_use = "{/* ═══ USE CASES ═══ */}"
m_build = "{/* ═══ HOW IT'S BUILT ═══ */}"
m_cta = "{/* ═══ FINAL CTA ═══ */}"
m_footer = "{/* ═══ FOOTER ═══ */}"

def get_section(start_marker, end_marker):
    start = text.find(start_marker)
    if end_marker:
        end = text.find(end_marker)
        return text[start:end]
    else:
        return text[start:]

sec_nav = get_section(m_nav, m_hero)
sec_hero = get_section(m_hero, m_htu)
sec_htu = get_section(m_htu, m_prob)
sec_prob = get_section(m_prob, m_feat)
sec_feat = get_section(m_feat, m_sec)
sec_sec = get_section(m_sec, m_use)
sec_use = get_section(m_use, m_build)
sec_build = get_section(m_build, m_cta)
sec_cta = get_section(m_cta, m_footer)
sec_footer = get_section(m_footer, None)

# Merge Security & Trust + Under the Hood
merged = """      {/* ═══ ARCHITECTURE OF TRUST ═══ */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false }}
            variants={stagger}
            className="text-center mb-16"
          >
            <SectionTag>
              <Shield className="w-4 h-4" /> Architecture of Trust
            </SectionTag>
            <motion.h2
              variants={popIn}
              custom={1}
              className="text-4xl md:text-5xl font-heading font-bold text-foreground"
            >
              The tech that protects you
            </motion.h2>
            <motion.p
              variants={popIn}
              custom={2}
              className="mt-4 text-lg text-muted-foreground font-body max-w-xl mx-auto"
            >
               No proprietary magic — just well-established cryptographic standards that security researchers trust.
            </motion.p>
          </motion.div>

          {/* Merge trust points alert here */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ type: "spring", stiffness: 150, damping: 18 }}
            className="bg-accent/8 border-2 border-accent/25 rounded-2xl p-8 md:p-10 flex gap-5 mb-10 text-left"
          >
            <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}>
              <AlertTriangle className="w-8 h-8 text-accent flex-shrink-0 mt-0.5" />
            </motion.div>
            <div>
              <h3 className="text-xl font-heading font-bold text-foreground mb-2">This is important — please read</h3>
              <p className="text-foreground/80 font-body leading-relaxed">
                If you forget your password, <strong>your data is permanently gone</strong>. We don't store your password. We cannot decrypt or recover your content. That's what zero-knowledge means.
              </p>
            </div>
          </motion.div>

          {/* The Tech Grid */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false }}
            variants={stagger}
            className="grid sm:grid-cols-2 gap-4 text-left"
          >
            {[
              { label: "Data Encryption", value: "AES-256-GCM", desc: "Authenticates and encrypts. If a single bit is tampered with, decryption outright fails." },
              { label: "Key Derivation", value: "PBKDF2", desc: "310,000 algorithmic iterations with a randomized 16-byte salt to prevent brute-forcing." },
              { label: "Storage Layer", value: "NoSQL + S3", desc: "Encrypted blobs sit in private buckets. Metadata uses DB-level atomic operations." },
              { label: "App Execution", value: "Browser Native", desc: "Zero third-party crypto libraries. We leverage the OS-native Web Crypto API." },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                variants={popIn}
                custom={i}
                whileHover={{ scale: 1.04, transition: { type: "spring", stiffness: 400 } }}
                className="bg-card rounded-2xl border border-border p-5"
              >
                <span className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider">{item.label}</span>
                <p className="text-xl font-heading font-bold text-primary mt-1">{item.value}</p>
                <p className="text-sm text-muted-foreground font-body mt-1">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Trust Checkmarks */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false }}
            variants={stagger}
            className="grid sm:grid-cols-2 gap-3 mt-10"
          >
            {trustPoints.map((point, i) => (
              <motion.div
                key={i}
                variants={popIn}
                custom={i}
                whileHover={{ x: 8, scale: 1.02, transition: { type: "spring", stiffness: 400 } }}
                className="bg-card rounded-2xl border border-border px-5 py-3.5 flex items-center gap-3 cursor-default"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: false }}
                  transition={{ type: "spring", stiffness: 300, damping: 15, delay: i * 0.08 }}
                  className="w-7 h-7 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0"
                >
                  <span className="text-success font-bold text-xs">✓</span>
                </motion.div>
                <span className="text-foreground font-body text-sm">{point}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
"""

pre_nav = text[:text.find(m_nav)]

new_text = pre_nav + sec_nav + sec_hero + sec_htu + sec_prob + sec_use + sec_feat + merged + sec_cta + sec_footer

with open('src/pages/LandingPage.tsx', 'w', encoding='utf-8') as f:
    f.write(new_text)

print("success")
