import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function AboutPage() {
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
            About <span className="text-primary">clipalpha</span>
          </h1>

          <div className="prose prose-invert prose-lg max-w-none text-muted-foreground font-body leading-relaxed space-y-6">
            <p>
              Clipalpha was built as a modern, high-security <strong>pastebin alternative</strong> and <strong>secure clipboard</strong> designed for enterprise teams, cybersecurity professionals, and software engineers who need to share sensitive data safely.
            </p>
            <p>
              Whether you are passing environment variables, API endpoints, or critical configuration files across the internet, legacy pastebin tools are fundamentally insecure. They store plaintext data indefinitely, creating a massive digital footprint and liability for enterprise networks.
            </p>
            <h2 className="text-2xl font-bold text-foreground mt-8">Our Philosophy</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Zero Knowledge:</strong> We mathematically prevent ourselves from seeing your data. Encryption happens entirely in your browser using the AES-256-GCM standard before any network request is made.</li>
              <li><strong>Zero Cookies:</strong> We don't track you. We don't want to know who you are. We don't use targeted advertising or invasive analytics.</li>
              <li><strong>Zero Footprint:</strong> When a clip expires or is burned, it is permanently wiped from the database. It is gone forever.</li>
            </ul>
            <p className="mt-8">
              Clipalpha is designed for developers, journalists, and anyone who believes privacy is a fundamental right. Share anything. Privately.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
