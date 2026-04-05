# 🔐 Pastit / ClipAlpha — Full System Architecture

> **Zero-knowledge encrypted clipboard. The server sees only encrypted noise.**

---

## 🗺️ The Big Picture

```mermaid
graph TD
    USER["👤 User Browser\n(clipalpha.com)"]

    subgraph DNS ["🌐 DNS Layer"]
        GODADDY["GoDaddy\nDomain Registrar"]
        R53["Route 53\nHosted Zone\nA/ALIAS → CloudFront"]
        ACM["ACM Certificate\nus-east-1\n✳ pastit.site + *.pastit.site"]
    end

    subgraph EDGE ["🛡️ Edge & Security Layer"]
        WAF["WAF\nWeb Application Firewall\nOWASP Top 10 Rules\nRate Limiting"]
        CF["CloudFront CDN\n400+ Edge Locations\nHTTPS Termination\nSPA 403/404 → index.html"]
    end

    subgraph STATIC ["📦 Static Hosting"]
        S3_FE["S3 Bucket\npastit-site-frontend\nReact Build Files\nPrivate — OAC Only"]
    end

    subgraph API ["🔀 API Routing"]
        APIGW["API Gateway\nHTTP API\n/api/* routes\nCORS Configured"]
    end

    subgraph LAMBDA ["⚡ Lambda Functions (Node.js 20)"]
        L_CREATE["pastit-create\nPOST /api/clip\n256MB · 10s timeout"]
        L_VIEW["pastit-view\nGET /api/clip/:slug\n256MB · 10s timeout"]
        L_UNLOCK["pastit-unlock\nPOST /api/clip/:slug/unlock\n256MB · 15s timeout"]
        L_CHECK["pastit-slugcheck\nGET /api/slug-check/:slug\n128MB · 5s timeout"]
        L_CLEANUP["pastit-cleanup\nScheduled — no HTTP\n256MB · 60s timeout"]
        L_DOWNLOAD["pastit-download\nGET /api/download\nPresigned S3 URLs"]
        L_EXTEND["pastit-extend\nPOST /api/extend\nExtend clip expiry"]
    end

    subgraph DATA ["🗄️ Data Layer"]
        DYNAMO["DynamoDB\npastit-clips\nPartition Key: slug\nOn-demand billing\nTTL: expiresAt"]
        S3_CONTENT["S3 Bucket\npastit-site-content\nAES-256-GCM Blobs\nclips/{slug}\n35-day lifecycle rule"]
    end

    subgraph SCHEDULER ["⏰ Scheduler"]
        EB["EventBridge\nrate(1 hour)\nTriggers cleanup Lambda"]
    end

    subgraph DASHBOARD ["📊 Admin Dashboard"]
        DASH_FE["dashboard-frontend\nVite + React\nCharts & Metrics"]
        ANALYTICS["analytics-backend Lambda\nDynamoDB full scan\nTime series + metrics"]
    end

    USER -->|"DNS lookup"| GODADDY
    GODADDY -->|"Nameservers → AWS"| R53
    R53 -->|"ALIAS"| CF
    ACM -.->|"TLS cert"| CF
    USER -->|"HTTPS request"| CF
    CF --> WAF
    WAF -->|"Clean traffic"| CF
    CF -->|"/* (static)"| S3_FE
    CF -->|"/api/* (dynamic)"| APIGW
    APIGW --> L_CREATE
    APIGW --> L_VIEW
    APIGW --> L_UNLOCK
    APIGW --> L_CHECK
    APIGW --> L_DOWNLOAD
    APIGW --> L_EXTEND
    L_CREATE -->|"Write metadata"| DYNAMO
    L_CREATE -->|"PutObject"| S3_CONTENT
    L_VIEW -->|"GetItem"| DYNAMO
    L_UNLOCK -->|"GetItem + UpdateItem"| DYNAMO
    L_UNLOCK -->|"GetObject"| S3_CONTENT
    L_CHECK -->|"GetItem"| DYNAMO
    L_DOWNLOAD -->|"Presign URL"| S3_CONTENT
    L_EXTEND -->|"UpdateItem"| DYNAMO
    EB -->|"Scheduled trigger"| L_CLEANUP
    L_CLEANUP -->|"List + DeleteObject"| S3_CONTENT
    L_CLEANUP -->|"GetItem"| DYNAMO
    DASH_FE --> ANALYTICS
    ANALYTICS -->|"Scan"| DYNAMO
```

---

## 🔄 Request Flows

### Flow A — Creating a Clip

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant CloudFront
    participant APIGW as API Gateway
    participant L_Create as Lambda: create
    participant DynamoDB
    participant S3_Content as S3 Content Bucket

    User->>Browser: Types content + sets password
    Note over Browser: 1. PBKDF2 (310k iterations) → 256-bit key<br/>2. AES-256-GCM encrypt content<br/>3. SHA-256 hash password (door check)<br/>4. SHA-256 integrity hash of blob
    Browser->>CloudFront: POST /api/clip<br/>{slug, ciphertext, passwordHash, expirySeconds, burnAfterRead, contentType, viewLimit}
    CloudFront->>APIGW: Forward /api/* request
    APIGW->>L_Create: Invoke with event
    L_Create->>DynamoDB: GetItem(slug) — check availability
    DynamoDB-->>L_Create: not found (or expired)
    L_Create->>S3_Content: PutObject clips/{slug}
    S3_Content-->>L_Create: 200 OK
    L_Create->>DynamoDB: PutCommand(clipRecord) — slug, hash, expiresAt, viewCount=0, etc.
    DynamoDB-->>L_Create: 200 OK
    L_Create-->>Browser: {success: true, url: "clipalpha.com/slug"}
    Browser-->>User: Shows shareable URL + QR code
    Note over Browser,S3_Content: ✅ Server NEVER saw plaintext
```

---

### Flow B — Viewing a Clip (Password Protected)

```mermaid
sequenceDiagram
    actor Recipient
    participant Browser
    participant CloudFront
    participant L_View as Lambda: view
    participant L_Unlock as Lambda: unlock
    participant DynamoDB
    participant S3_Content as S3 Content

    Recipient->>Browser: Opens clipalpha.com/myslug
    Browser->>CloudFront: GET /api/clip/myslug
    CloudFront->>L_View: Invoke
    L_View->>DynamoDB: GetItem(myslug)
    DynamoDB-->>L_View: {hasPassword: true, expiresAt, viewCount, viewsRemaining...}
    L_View-->>Browser: Metadata ONLY (no blob yet)
    Browser-->>Recipient: Shows password prompt + countdown timer

    Recipient->>Browser: Types password
    Note over Browser: SHA-256 hash password locally
    Browser->>CloudFront: POST /api/clip/myslug/unlock {passwordHash}
    CloudFront->>L_Unlock: Invoke
    L_Unlock->>DynamoDB: GetItem — check wrongAttempts < 5
    L_Unlock->>DynamoDB: Compare passwordHash
    DynamoDB-->>L_Unlock: Match ✅
    L_Unlock->>S3_Content: GetObject clips/myslug
    S3_Content-->>L_Unlock: Encrypted blob
    L_Unlock->>DynamoDB: Atomic UpdateItem — viewCount++
    alt burnAfterRead = true
        L_Unlock->>DynamoDB: DeleteItem
        L_Unlock->>S3_Content: DeleteObject
    end
    L_Unlock-->>Browser: {ciphertext, contentType}
    Note over Browser: AES-256-GCM decrypt locally<br/>using user's password + stored salt/IV
    Browser-->>Recipient: Plaintext displayed 🔓
    Note over Browser,S3_Content: ✅ Decryption 100% in-browser
```

---

### Flow C — Wrong Password & Lockout

```mermaid
sequenceDiagram
    actor Attacker
    participant Browser
    participant L_Unlock as Lambda: unlock
    participant DynamoDB

    loop Up to 5 attempts
        Attacker->>Browser: Wrong password
        Browser->>L_Unlock: POST /unlock {wrongPasswordHash}
        L_Unlock->>DynamoDB: Conditional UpdateItem<br/>wrongAttempts += 1 IF wrongAttempts < 5
        DynamoDB-->>L_Unlock: New count
        L_Unlock-->>Browser: {error: "wrong_password", attemptsRemaining: N}
        Browser-->>Attacker: ❌ Wrong password — N attempts left
    end

    Attacker->>Browser: 5th wrong attempt
    L_Unlock->>DynamoDB: Atomic increment → wrongAttempts = 5
    L_Unlock-->>Browser: {error: "locked"}
    Browser-->>Attacker: 🔒 LOCKED — No more input accepted
    Note over DynamoDB: Atomic operation prevents race-condition brute force
```

---

### Flow D — Scheduled Cleanup

```mermaid
sequenceDiagram
    participant EB as EventBridge (hourly)
    participant L_Cleanup as Lambda: cleanup
    participant S3_Content as S3 Content
    participant DynamoDB

    EB->>L_Cleanup: Schedule trigger (rate 1 hour)
    L_Cleanup->>S3_Content: ListObjectsV2 prefix=clips/
    S3_Content-->>L_Cleanup: [clips/slug1, clips/slug2, ...]
    loop For each S3 object
        L_Cleanup->>DynamoDB: GetItem(slug)
        alt Record missing OR expiresAt < now
            L_Cleanup->>S3_Content: DeleteObject(clips/slug)
            Note over L_Cleanup: Orphaned blob cleaned 🧹
        end
    end
    Note over EB,DynamoDB: 3-Layer Cleanup:<br/>1. DynamoDB TTL (record auto-deleted)<br/>2. EventBridge + Lambda (orphan S3 cleanup)<br/>3. S3 35-day lifecycle rule (final safety net)
```

---

## 🔐 Encryption Model (Zero-Knowledge)

```mermaid
graph LR
    subgraph Browser ["🖥️ Browser — ALL crypto happens here"]
        PW["User Password\n(never transmitted)"]
        PBKDF2["PBKDF2\n310,000 iterations\nSHA-256\n16-byte random salt"]
        KEY["256-bit AES Key\n(ephemeral, in-memory only)"]
        AES["AES-256-GCM\n12-byte random IV\n+ 16-byte auth tag"]
        PLAIN["Plaintext Content"]
        CIPHER["Encrypted Blob\n(base64)"]
        PW_HASH["SHA-256(password)\nDoor-check hash only\n(not the encryption key)"]
    end

    subgraph Server ["☁️ Server — sees ONLY encrypted data"]
        S3_BLOB["S3: Encrypted Blob\nclips/{slug}"]
        DB_META["DynamoDB: Metadata\npasswordHash, expiresAt,\nviewCount, burnAfterRead..."]
    end

    PW --> PBKDF2
    PBKDF2 --> KEY
    PLAIN --> AES
    KEY --> AES
    AES --> CIPHER
    PW --> PW_HASH

    CIPHER -->|"stored"| S3_BLOB
    PW_HASH -->|"stored for door check"| DB_META
```

| What the server stores | What the server can read |
|---|---|
| AES-256-GCM ciphertext | ❌ Nothing — encrypted noise |
| SHA-256(password) | ❌ Cannot reverse to password |
| PBKDF2 salt + IV | ❌ Useless without the password |
| Expiry, view count, flags | ✅ Metadata only |

---

## 🏗️ AWS Infrastructure Map

```mermaid
graph TD
    subgraph GLOBAL ["🌍 Global (us-east-1)"]
        R53["Route 53\n$0.50/mo"]
        ACM["ACM Certificate\nFREE"]
        CF["CloudFront\n400+ PoPs\nFREE tier 1TB/mo"]
        WAF["WAF + Shield\n$5/mo fixed"]
    end

    subgraph COMPUTE ["⚡ Compute (us-east-1)"]
        APIGW["API Gateway HTTP\n$1/M requests"]
        L1["Lambda: create"]
        L2["Lambda: view"]
        L3["Lambda: unlock"]
        L4["Lambda: slugcheck"]
        L5["Lambda: cleanup"]
        L6["Lambda: download"]
        L7["Lambda: extend"]
        EB["EventBridge\nFREE"]
        IAM["IAM Role\npastit-lambda-role\nS3 + DynamoDB + CloudWatch"]
    end

    subgraph STORAGE ["🗄️ Storage (us-east-1)"]
        S3_FE["S3: pastit-site-frontend\nReact app files\nFREE 5GB"]
        S3_CONTENT["S3: pastit-site-content\nEncrypted blobs\nclips/{slug}\n35-day lifecycle"]
        DYNAMO["DynamoDB: pastit-clips\nslug PK\nTTL: expiresAt\nFREE 25GB"]
    end

    subgraph MONITORING ["📊 Observability"]
        CW["CloudWatch\nLambda Logs\nMetrics"]
        DASH_BE["Analytics Lambda\nDynamoDB scan\nTime-series metrics"]
        DASH_FE["Dashboard Frontend\nVite React SPA\nAdmin-only"]
    end

    CF --> S3_FE
    CF --> APIGW
    APIGW --> L1 & L2 & L3 & L4 & L6 & L7
    EB --> L5
    L1 & L2 & L3 & L4 & L5 & L6 & L7 --> IAM
    IAM --> S3_CONTENT
    IAM --> DYNAMO
    IAM --> CW
    DASH_FE --> DASH_BE
    DASH_BE --> DYNAMO
```

---

## 📡 API Endpoint Reference

| Method | Route | Lambda | Purpose |
|---|---|---|---|
| `POST` | `/api/clip` | `pastit-create` | Create new encrypted clip |
| `GET` | `/api/clip/:slug` | `pastit-view` | Fetch clip metadata (no blob) |
| `POST` | `/api/clip/:slug/unlock` | `pastit-unlock` | Verify password, return blob |
| `DELETE` | `/api/clip/:slug` | `pastit-unlock` | Delete clip immediately |
| `GET` | `/api/slug-check/:slug` | `pastit-slugcheck` | Real-time slug availability |
| `GET` | `/api/download` | `pastit-download` | Presigned S3 GET URL |
| `POST` | `/api/extend` | `pastit-extend` | Extend clip expiry (max 50 days) |
| `GET` | `/api/presign` | *(presign fn)* | Presigned S3 PUT URL for uploads |

---

## 🗃️ DynamoDB Schema

| Field | Type | Description |
|---|---|---|
| `slug` | String (PK) | URL slug — unique identifier |
| `passwordHash` | String / null | SHA-256 of password (door check) |
| `hasPassword` | Boolean | Quick flag |
| `expiresAt` | Number | **TTL field** — Unix timestamp |
| `expiresAtISO` | String | ISO string for frontend countdown |
| `viewCount` | Number | Successful views so far |
| `viewLimit` | Number / null | Max views cap |
| `viewsRemaining` | Number / null | Countdown |
| `wrongAttempts` | Number | Failed password attempts |
| `burnAfterRead` | Boolean | Delete after first view |
| `s3Key` | String | `clips/{slug}` |
| `contentType` | String | `text` / `file` / `multipart` |
| `createdAt` | String | ISO timestamp |

---

## 📊 Analytics Dashboard

The `dashboard-frontend` is a **separate admin Vite/React SPA** that calls the `analytics-backend` Lambda, which does a **full DynamoDB scan** and returns:

- `allTime` counters: clips created, viewed, destroyed, locked, by content type, by TTL bucket
- `last30Days`: daily time-series (created, viewed, wrongAttempts)
- `last24Hours`: hourly time-series

> Note: Deleted clips (burned/TTL'd) are invisible to scans — destruction stats are **estimated** (`~45%` destruction rate). A production-grade solution would use DynamoDB Streams or S3 event notifications.

---

## 💰 Monthly Cost (Early Stage)

| Service | Cost |
|---|---|
| Route 53 | $0.50 |
| ACM | FREE |
| CloudFront | FREE (< 1TB/mo) |
| S3 (both buckets) | FREE (< 5GB) |
| API Gateway | FREE (< 1M req) |
| Lambda (all functions) | FREE (< 1M invocations) |
| DynamoDB | FREE (< 25GB) |
| EventBridge | FREE |
| WAF | **$5.00/mo** |
| **TOTAL** | **~$5.50/mo** |

---

## 🗂️ Frontend Component Map

```mermaid
graph TD
    APP["App.tsx\nReact Router"]
    APP --> LP["LandingPage.tsx\nHero + CTA"]
    APP --> SP["SlugPage.tsx\nURL-driven state machine"]
    APP --> ABT["AboutPage.tsx"]
    APP --> HIW["HowItWorksPage.tsx"]
    APP --> PP["PrivacyPolicyPage.tsx"]
    APP --> TOS["TermsPage.tsx"]
    APP --> CON["ContactPage.tsx"]

    SP --> CW["CreateWorkspace.tsx\nSlug bar, text/file input,\nexpiry drum, password, create btn"]
    SP --> VS["ViewScreen.tsx\nState: unencrypted/locked/password/notfound"]
    VS --> PC["PasswordCard.tsx\nPassword input + attempt counter"]
    VS --> CT["CountdownTimer.tsx\nLive expiry countdown"]

    CW --> RE["RichEditors.tsx\nText + code editors"]
    CW --> ED["ExpiryDrum.tsx\nDrum-scroll expiry picker"]
    CW --> SLUGP["SlugPicker.tsx\nReal-time availability dot"]

    subgraph UTILS ["utils/"]
        API["api.ts\nAll fetch calls"]
        CRYPTO["crypto.ts\nAES-256-GCM\nPBKDF2\nWeb Crypto API"]
        STEG["steganography.ts\nImage steganography"]
    end
```

---

## 🚀 Deployment Flow

```mermaid
graph LR
    DEV["Local Dev\nnpm run dev"] -->|"npm run build"| BUILD["dist/ folder"]
    BUILD -->|"aws s3 sync"| S3_FE["S3 Frontend Bucket"]
    S3_FE -->|"CloudFront invalidation"| CF["CloudFront Edge Cache\nUsers get new version instantly"]

    LAMBDA_CODE["Lambda source\n*_lambda/"] -->|"zip + upload"| AWS_LAMBDA["AWS Lambda\nfunctions"]
    AWS_LAMBDA --> APIGW["API Gateway\nHTTP API"]
```
