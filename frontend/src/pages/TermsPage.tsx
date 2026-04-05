import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function TermsPage() {
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
            Terms of Service
          </h1>

          <div className="prose prose-invert prose-lg max-w-none text-muted-foreground font-body leading-relaxed space-y-6">
            <p>
              By accessing or using Clipalpha (the "Service"), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the Service.
            </p>

            <h2 className="text-2xl font-bold text-foreground mt-8">1. Description of Service</h2>
            <p>
              Clipalpha acts as a "secure clipboard" and pastebin alternative, designed to facilitate the ephemeral, end-to-end encrypted transmission of text and files. The Service provides purely infrastructural, zero-knowledge routing parameters. We mathematically enforce our own inability to view, parse, or moderate the encrypted ciphertext transported over our Service.
            </p>

            <h2 className="text-2xl font-bold text-foreground mt-8">2. Acceptable Use</h2>
            <p>
              You agree not to use the Service:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>In any way that violates any applicable national or international law, including the hosting or distribution of <strong>illegal content</strong>.</li>
              <li>For the purpose of exploiting, harming, or attempting to exploit or harm minors in any way.</li>
              <li>To host, distribute, or facilitate <strong>malware distribution</strong>, viruses, or any other destructive code.</li>
              <li>To host, distribute, or facilitate <strong>phishing content</strong> or any deceptive material intended to steal credentials.</li>
              <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail", "chain letter", "spam", or any other similar solicitation.</li>
            </ul>
            <p>
              While we cannot decrypt or monitor the contents of user clips due to our zero-knowledge architecture, we reserve the right to delete any clips and block access if we are notified or detect that the Service is being used to facilitate illegal activities or abuse our infrastructure.
            </p>

            <h2 className="text-2xl font-bold text-foreground mt-8">3. Disclaimer of Warranties</h2>
            <p>
              The Service is provided on an "AS IS" and "AS AVAILABLE" basis. Clipalpha makes no representations or warranties of any kind, express or implied, regarding the operation or availability of the Service. We do not warrant that the Service will be uninterrupted or error-free.
            </p>

            <h2 className="text-2xl font-bold text-foreground mt-8">4. Limitation of Liability</h2>
            <p>
              You understand that if you lose your encryption key (password), your data is permanently irretrievable. In no event shall Clipalpha be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
            </p>

            <p className="mt-12 text-sm text-muted-foreground">Last Updated: March 2026</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
