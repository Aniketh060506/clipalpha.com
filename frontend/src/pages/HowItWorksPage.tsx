import { ArrowLeft, Shield, Lock, Eye, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function HowItWorksPage() {
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

      <div className="max-w-4xl mx-auto py-32 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-heading font-black text-foreground tracking-tight mb-4">
              How <span className="text-primary">Clipalpha</span> Works
            </h1>
            <p className="text-xl text-muted-foreground font-body leading-relaxed">
              Clipalpha is a modern, secure clipboard and pastebin alternative designed for enterprise teams, developers, and security-conscious professionals to share text and files safely.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-card border border-border p-8 rounded-2xl flex flex-col gap-4">
              <Lock className="w-10 h-10 text-primary" />
              <h3 className="text-2xl font-bold text-foreground">1. Client-Side Encryption</h3>
              <p className="text-muted-foreground leading-relaxed">
                Before your data ever leaves your browser, it is encrypted locally on your device using the AES-256-GCM standard via the Web Crypto API. We only transmit mathematically secure ciphertext over the network.
              </p>
            </div>

            <div className="bg-card border border-border p-8 rounded-2xl flex flex-col gap-4">
              <Shield className="w-10 h-10 text-success" />
              <h3 className="text-2xl font-bold text-foreground">2. Zero-Knowledge Transit</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our servers act merely as a blind transport mechanism. We store the encrypted ciphertext and the unique Initialization Vector (IV), but your password never touches our backend.
              </p>
            </div>

            <div className="bg-card border border-border p-8 rounded-2xl flex flex-col gap-4">
              <CheckCircle2 className="w-10 h-10 text-accent" />
              <h3 className="text-2xl font-bold text-foreground">3. Secure Retrieval</h3>
              <p className="text-muted-foreground leading-relaxed">
                When a recipient opens the link, the encrypted payload is downloaded to their browser. Their browser then uses the password they provide to perform the decryption locally.
              </p>
            </div>

            <div className="bg-card border border-border p-8 rounded-2xl flex flex-col gap-4">
              <Eye className="w-10 h-10 text-destructive" />
              <h3 className="text-2xl font-bold text-foreground">4. Ephemeral Storage</h3>
              <p className="text-muted-foreground leading-relaxed">
                As a privacy-first pastebin alternative, our infrastructure enforces strict Time-To-Live (TTL) expiration rules. Once the time limit passes, auto-deletion scripts physically wipe the records.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
