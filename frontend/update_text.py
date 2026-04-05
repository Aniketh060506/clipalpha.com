import re

with open('src/pages/LandingPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target_array = r'title: "Pick your secret name"[\s\S]*?desc: "Share your shiny new self-destructing link\. The moment they open it, poof\. The database securely obliterates the key and the payload\.",'

replacement = r'''title: "Claim your secure link",
                  desc: "Choose a custom URL like pastit.site/keys or get a random secure hash. Absolutely no accounts, emails, or setup required.",
                  icon: Globe,
                  color: "from-primary/40 to-primary/10",
                  textColor: "text-primary",
                  borderColor: "border-primary",
                  align: "left",
                },
                {
                  step: "2",
                  title: "Encrypt text & files",
                  desc: "Client-side AES-GCM encryption for text and files up to 50MB. Set exact expiry timers (5 mins to 30 days) and view limits.",
                  icon: Lock,
                  color: "from-accent/40 to-accent/10",
                  textColor: "text-accent",
                  borderColor: "border-accent",
                  align: "right",
                },
                {
                  step: "3",
                  title: "Share & self-destruct",
                  desc: "Send the link and track its views. Whether it burns after reading or expires in a month, the database mathematically shreds the payload.",'''

content = re.sub(target_array, replacement, content)

with open('src/pages/LandingPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated Quick Start card text.")
