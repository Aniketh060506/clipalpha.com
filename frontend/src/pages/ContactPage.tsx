import { ArrowLeft, Mail, Github, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function ContactPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/30">
      <div className="absolute top-8 left-8 z-50">
        <motion.button
          onClick={() => navigate("/")}
          whileHover={{ x: -4 }}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back home
        </motion.button>
      </div>

      <div className="max-w-3xl mx-auto py-32 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <h1 className="text-4xl md:text-5xl font-heading font-black text-foreground tracking-tight">
            Contact & Support
          </h1>
          <p className="text-xl text-muted-foreground font-body leading-relaxed max-w-2xl">
            Clipalpha is built and maintained by an independent developer in India. Whether you have an enterprise inquiry, a bug report, or need support with the tool, I am always happy to help.
          </p>

          <div className="grid gap-6 mt-12">
            <a 
              href="mailto:jvanik06@gmail.com"
              className="group bg-card border border-border p-6 rounded-2xl flex items-center gap-6 hover:border-primary/50 transition-colors"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-primary/20 transition-all">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Email Support</h3>
                <p className="text-muted-foreground">jvanik06@gmail.com</p>
              </div>
            </a>

            <a 
              href="https://github.com/Aniketh060506"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-card border border-border p-6 rounded-2xl flex items-center gap-6 hover:border-accent/50 transition-colors"
            >
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-accent/20 transition-all">
                <Github className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">GitHub Profile</h3>
                <p className="text-muted-foreground">View open source projects and contributions</p>
              </div>
            </a>

            <div className="group bg-card border border-border p-6 rounded-2xl flex items-center gap-6">
              <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-6 h-6 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Abuse Reporting</h3>
                <p className="text-muted-foreground">To report malicious links or illegal content, email jvanik06@gmail.com immediately.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
