# Squally Line — Demonstration Video Script

**Course:** COE 454 — Software Engineering II
**Deliverable:** Project demonstration video (unlisted, incognito-accessible, clear English audio)
**Runtime:** 8–15 minutes allowed · **Target 13:00**
**Team:** 7 members · **Client:** Squally Line (fashion design studio)

---

## The production pack (three files)

This markdown is the **detailed master** — full lines, stage directions, guardrails, and appendices. Two companion files sit beside it in `docs/` for actually shooting the video:

- **`run-sheet.html`** — the *readable* version: only what each person says, in order, with time codes. Open it in any browser; read your lines from it while recording. This is the one to have on screen during the shoot.
- **`slides.html`** — the *on-screen deck*: 13 slides that match the segments below (SDLC, requirements methods, architecture diagram, ADRs, roles, scaling, etc.). Open in a browser, press **F** for fullscreen and screen-record it during the talking segments. Press **P** then **Ctrl/Cmd-P** to export the slides as a PDF.

*(These are local HTML files — just double-click to open. If you later want shareable links for the group, they can be published as Claude Artifacts from a claude.ai login.)*

---

## How to use this script

Every segment below gives you four things:

- **⏱ TIME** — the target duration and running clock. Treat these as a budget, not a straitjacket. The full script lands at roughly 13:30 of spoken content; there is deliberate slack so you can trim to a clean 13:00 after your first read-through.
- **🎬 SHOW** — what is on screen / what the presenter is doing while they talk.
- **🎙 SAY** — suggested narration. This is a *script you can read aloud*, but say it in your own voice. Where you see `[SQUARE BRACKETS]`, replace with your real data before recording.
- **✅ COVERS** — which lecturer requirement this segment satisfies, so you can prove full coverage.

Read the three **"Decisions to lock before you record"** notes next, then the **pre-production checklist**, then the script.

---

## Decisions to lock before you record

**1. Seven people, eight speaking parts.**
The role list handed in for this script names eight positions (Project Manager, Backend Lead, Frontend Lead, UI Designer, 2 Frontend Developers, 2 Backend Developers) but the team is seven. The script below writes eight distinct parts so nobody is left without lines. To fit seven people, the cleanest merge is: **the UI Designer also presents as Frontend Developer 1** (one person, both hats — this is a very common real-world overlap and it reads naturally on camera). Alternatively, the Project Manager can absorb the shorter Frontend Developer 2 lines. Pick one and delete the spare part.

**2. "ARDs" almost certainly means "ADRs" — Architecture Decision Records.**
The course (Lecture 5, Lecture 6) teaches **Architecture Decision Records (ADRs)** explicitly and tells you to "record it in your ADR." The requirements note reads "ARDs," which is the same term written from memory. This script treats the requirement as **ADRs** and gives you a ready-made ADR list in Appendix C. If your lecturer genuinely means an "Architectural Requirements Document," the same content in Appendix C fills that too — just present it as a document instead of a decision log.

**3. Client name and location are placeholders.**
The lecturer requires you to **state the client's name, location, and centres of business** on camera. Fill these in before recording:
- `[CLIENT FULL NAME]` — the fashion designer's real name (and studio/brand name if different from "Squally Line").
- `[CITY]` — the code defaults and currency (Ghana Cedi, GHS) point to **Ghana**, and the frontend copy references **Accra**. Confirm the real city. If the studio is in Kumasi or elsewhere, use that.
- `[CENTRES OF BUSINESS]` — recommended: *bespoke / made-to-measure tailoring, ready-to-wear sales, and in-studio consultations & fittings.* Confirm and adjust.

---

## Pre-production checklist (do this before filming)

**Video mechanics (lecturer's hard requirements):**
- [ ] Upload will be set to **Unlisted** and confirmed to open in an **incognito window**.
- [ ] Final cut is between **8:00 and 15:00** (target 13:00), with clear spoken English audio.
- [ ] The **live URL is visible on screen** at least twice — in the browser address bar during the demo, and on a title card. Live URL: `https://squallyline-frontend-production.up.railway.app`
- [ ] **Pictorial evidence with the client** is included — a photo or short clip of the team with `[CLIENT FULL NAME]` at the studio. Place it in the intro and again at the close.

**Demo safety (things that will embarrass you on camera if you forget):**
- [ ] **Never show `settings.py` on screen.** It currently has `DEBUG = True`, a hard-coded `SECRET_KEY`, a hard-coded database password, and `ALLOWED_HOSTS = ['*']`. Talk about the architecture from diagrams, not from that file. (Hardening this is genuinely part of your "what comes next" story — see Segment 10.)
- [ ] Use the **Sidebar** for profile and logout, **not** the top-right header avatar. The header component still shows a placeholder user ("Kwame Asante") and its logout button is not wired yet — do not open that dropdown on camera. The Sidebar is real (shows the logged-in user's real name, email, role, and has working logout).
- [ ] Do **not** click the "Measurements" call-to-action on the home marketing banner — it points at a dead route. Navigate to measurements via the sidebar (`/measure`) instead.
- [ ] For the payment step, run Paystack in **test mode** with test keys set, and use a **Paystack test card** (e.g. `4084 0840 8408 4081`, any future expiry, any CVV, OTP `123456`). This lets the whole checkout succeed on camera without spending real money. If you cannot set test keys in time, **pre-record** the payment redirect and narrate over it.
- [ ] Run `python manage.py seed_demo` on the demo database first. It creates the accounts you will log in with: **admin@squallyline.com / Admin@123**, an apprentice account, and two customer accounts, plus tiers, slots, categories, 12 products and 5 styles. (Seeded catalogue items have no images, so either add a few images to the items you will show, or film items you uploaded yourself through the admin catalogue.)
- [ ] Do **not** claim the system sends emails or SMS. It does not yet (this is on the roadmap — mention it as future work, not a current feature).
- [ ] Describe the two custom-order paths correctly: a **made-to-measure style request** submits a request and does **not** charge immediately (payment comes later, on the accepted proposal); an **appointment booking** *can* take an immediate Paystack payment. Do not say "buy a custom outfit here" on the style request page.

**Recommended recording order:** film the **demo segments first** (4–7) as one clean screen-capture run-through following the run-of-show in Appendix A, then record the talking-head / voice-over segments (1–3, 8–11) and edit them around the demo footage. This avoids fumbling live narration and clicking at the same time.

---

## Cast and who says what

| # | Role | Presents segments | Rough speaking time |
|---|------|-------------------|--------------------|
| 1 | **Project Manager** | 1 (client + problem), 2 (SE process), 10 (what's next), 11 (close) | ~3:30 |
| 2 | **Backend Lead** | 3 (architecture, ADRs, 3rd-party, licensing, live URL), part of 7, part of 10 | ~3:00 |
| 3 | **Frontend Lead** | 4 (commerce demo narration), frontend architecture | ~1:45 |
| 4 | **UI Designer** | 5 (measurements, 3D, design system), 9 (limitations) | ~2:15 |
| 5 | **Frontend Developer 1** | drives 4 and 5 (screen + supporting lines) | ~1:30 |
| 6 | **Frontend Developer 2** | 6 (proposal/agreement, customer side) | ~1:15 |
| 7 | **Backend Developer 1** | 6 (server side of the proposal flow), 8 (security/NFRs) | ~1:15 |
| 8 | **Backend Developer 2** | 7 (admin/staff roles + analytics) | ~1:15 |

*(If the team is seven: merge the UI Designer and Frontend Developer 1 into one presenter, as noted above.)*

---

# THE SCRIPT

---

## SEGMENT 1 — Cold open: the client and the problem
**⏱ 0:00 – 1:15 (1:15) · Presenter: Project Manager**

**🎬 SHOW:** Open on a short montage — the team at `[CLIENT FULL NAME]`'s studio, a shot of the physical shop / garments, then a photo of the team *with* the client. Lower-third title card: **"Squally Line"** and the live URL. End the montage on the `/atelier` cinematic landing page loading in the browser.

**🎙 SAY:**
> "Hello, we are a seven-person team from KNUST, and this is **Squally Line** — a web platform we designed and built for a real client, `[CLIENT FULL NAME]`, a fashion designer based in `[CITY]`, Ghana.
>
> `[CLIENT FULL NAME]`'s business has three centres: `[bespoke, made-to-measure tailoring; ready-to-wear sales; and in-studio consultations and fittings]`. Before Squally Line, all of that ran on paper and WhatsApp — measurements written in notebooks, orders and quotes negotiated in chat, and production progress tracked in the tailor's head. Customers had no way to browse the work, save their measurements, or follow an order.
>
> Our brief for this course was to find a real client, understand their problem properly, and solve it using software engineering — following the process, not just writing code. Over the next thirteen minutes we will show you the working system, and we will show you the engineering path we took to get here."

**✅ COVERS:** client name + location + centres of business · pictorial evidence with the client · sets up "we followed the correct SE path."

---

## SEGMENT 2 — The engineering process: how we gathered and analysed requirements
**⏱ 1:15 – 2:45 (1:30) · Presenter: Project Manager**

**🎬 SHOW:** A simple slide/graphic of the SDLC phases, then a slide listing the requirements-gathering methods you used, then a two-column slide "Functional vs Non-Functional requirements." Keep the slides clean — this is the part that proves you did the coursework.

**🎙 SAY:**
> "We followed the standard software development life cycle: problem definition, then **requirements gathering and analysis**, planning and design, implementation, testing, deployment, and now maintenance.
>
> For requirements gathering, there are many techniques — interviews, workshops, document analysis, observation, prototyping, surveys, and so on. We deliberately chose the ones that fit a single expert client. Our **primary method was semi-structured stakeholder interviews**: we sat with `[CLIENT FULL NAME]` and asked open-ended questions about how he runs his studio. Our **second method was direct observation, or contextual inquiry** — we watched him take a client's measurements and manage an order end to end. Those two methods were supported by **document analysis** of his existing paper measurement books and WhatsApp order chats, and by **iterative prototyping**, where we showed him mock-ups and refined them with his feedback.
>
> That analysis gave us our requirements. The **functional requirements** — what the system must *do* — became features like digital measurement profiles, a browsable catalogue, online ordering, and a formal quote-and-approval workflow. The **non-functional requirements** — how well it must do them — we grouped the way the course teaches: **security, performance and scalability, availability and reliability, usability, and compliance.** For example, handling money made security and Ghana-payment compliance non-negotiable.
>
> We ran the project **Agile and incrementally**, prioritising with **MoSCoW** — must-have, should-have, could-have, won't-have — so we shipped a working MVP first and kept the client updated every week."

**✅ COVERS:** proves the correct SE path · names the specific elicitation methods used and the theory behind them · functional vs non-functional requirements · methodology (Agile, MoSCoW, SDLC).

---

## SEGMENT 3 — System architecture, decision records, third-party systems, and the live URL
**⏱ 2:45 – 4:15 (1:30) · Presenter: Backend Lead**

**🎬 SHOW:** An architecture diagram (draw one — see Appendix B for what it must contain): browser → React SPA → REST API over HTTPS → Django + DRF → PostgreSQL, with Paystack and Railway shown as external boxes. Then briefly show the live site loading with the **URL visible in the address bar**. Do **not** show `settings.py`.

**🎙 SAY:**
> "Architecturally, Squally Line is a classic **three-tier, client–server web application**. The front end is a **React single-page application** — React 19 with React Router — that talks to a separate back end over a **REST API**. The back end is **Django with the Django REST Framework**, and it stores data in **PostgreSQL**. The two halves are deployed independently on **Railway**, our hosting platform, and you can use the live system right now at this address on screen: `squallyline-frontend-production.up.railway.app`.
>
> Authentication is **stateless JWT** — JSON Web Tokens — using SimpleJWT, with short-lived access tokens and rotating refresh tokens. Choosing stateless tokens over server sessions was a deliberate architectural decision, because it lets us scale the API horizontally later without sticky sessions.
>
> We recorded decisions like that as **Architecture Decision Records** — ADRs. For example: ADR-001, splitting the SPA from the REST API; ADR-002, JWT over sessions; ADR-003, choosing **Paystack** as our payment gateway because it is built for the Ghanaian market and settles in cedis; and ADR-006, our dependency-licensing policy.
>
> On that last point — our **third-party systems** are **Paystack** for payments and **Railway** for hosting, and every open-source library we depend on is **permissively licensed**: React is MIT, Django and the REST Framework are BSD. There is no GPL or other strong-copyleft code in our tree, which means we can legally hand this over to the client as a private commercial product. We verified that with a licence checker and recorded it in an ADR."

**✅ COVERS:** architecture of the system · ADRs (the "ARDs" item) · third-party systems · live URL visible · open-source licensing (Lecture 6).

---

## SEGMENT 4 — Demo, part 1: the commerce spine (customer view)
**⏱ 4:15 – 6:00 (1:45) · Presenter: Frontend Lead narrates · Frontend Developer 1 drives the screen**

**🎬 SHOW (Frontend Developer 1 clicks through, live URL visible throughout):**
1. `/atelier` cinematic landing → click **"Enter the shop."**
2. **Register or log in** as a customer (use the Sidebar area, not the header avatar).
3. Browse `/gallery` (the lookbook) and `/categories` — show the category tree, search, and filters.
4. Open a product at `/product/:id` — show images, reviews, add to cart.
5. Go to `/cart` → `/checkout` → this redirects to **Paystack (test mode)** → pay with the **test card** → land back on `/payment/callback` → arrive at the **order** in `/orders`.

**🎙 SAY (Frontend Lead):**
> "Here is the system in the customer's hands. The front door is our **Atelier** landing page — a cinematic brand introduction — and from there the customer enters the shop.
>
> Everything you see is live data from the API. The catalogue is organised as a **category tree**, and the customer can search, filter by things like price or gender, and open any piece. We separate **ready-to-wear products**, which have stock and can be bought directly, from **made-to-order styles**, which we will come to in a moment.
>
> Watch the buying flow. The cart is **owned by the server** — every change is saved through the API, so it survives a refresh or a new device. At checkout, the front end creates the order, then hands off to **Paystack** to take payment securely — we never touch card details ourselves. Paystack sends the customer back, we verify the payment, and the order appears in their order history. This is the core commerce path, and it works end to end."

**🎙 SAY (Frontend Developer 1, short, while clicking):**
> "I'm paying with a Paystack **test card** here so you can see the full round trip — initialise, redirect, verify, and confirm — without a real charge."

**✅ COVERS:** demonstrate how the system is used · showcase important features · third-party system (Paystack) in action · live URL visible.

---

## SEGMENT 5 — Demo, part 2: the fashion differentiators (measurements, 3D, made-to-measure)
**⏱ 6:00 – 7:30 (1:30) · Presenter: UI Designer narrates · Frontend Developer 1 drives**

**🎬 SHOW:**
1. Sidebar → **`/measure`** — add a "person" (e.g. yourself or a family member), enter body measurements, toggle **cm/inches**, and show the **3D dress-form figure** rendering (three.js) alongside the form.
2. Open a **style** → `/styles/order/:id` — walk through the 7-section request accordion (recipient, measurements, fabric, urgency tier, consultation slot, contact, notes) → **submit** → show the "Request sent" confirmation.

**🎙 SAY (UI Designer):**
> "This is where the platform earns its place in a tailoring business. Under **Measurements**, a customer keeps measurement profiles — not just for themselves, but for the people they order for, like family members. Every measurement set is **versioned**, so when a body changes, the history is kept rather than overwritten.
>
> On the design side, we wanted measurements to feel approachable, not like a form full of jargon, so we render a **real 3D figure** using three.js that responds as you fill it in, with an SVG fallback for weaker devices. You will also notice the whole interface uses one considered design system — a **white, black, and gold** palette that matches the brand, glassmorphic surfaces, and a **dark and light theme** you can toggle. That consistency is a deliberate **usability** requirement, not decoration.
>
> To request a custom garment, the customer opens a style and fills this guided request — recipient, measurements, fabric, how urgently they need it, and a consultation slot. Importantly, submitting this **does not charge them**. It sends a request to the studio. Payment comes later, only once the tailor has sent back a formal quote — which is exactly how a real bespoke order works, and it is the next thing we will show."

**✅ COVERS:** important features · usability NFR and design rationale · shows a genuinely domain-specific solution (proves you solved *this client's* problem).

---

## SEGMENT 6 — Demo, part 3: the two-sided proposal & agreement workflow (the standout)
**⏱ 7:30 – 9:00 (1:30) · Frontend Developer 2 (customer side) · Backend Developer 1 (explains the server side)**

**🎬 SHOW:** As the customer, open `/appointments/:id` and go to the **Agreement** tab. Show a proposal the studio has sent: version, garment type, reference images, total price, deposit, balance due date, completion date. Click **Accept** → the screen navigates to a newly created **order** at `/orders/:id`.

**🎙 SAY (Frontend Developer 2):**
> "This is the heart of the system — the negotiation between customer and studio, done properly. On the **Agreement** tab, the customer sees the studio's **proposal**: the garment, reference images, the total price, the required deposit, and the promised completion date. Proposals are **versioned** — if the customer asks for changes, the studio issues a new version, and the whole back-and-forth is recorded.
>
> When the customer is happy, they hit **Accept** — and watch: the system immediately turns that agreement into a real **order**."

**🎙 SAY (Backend Developer 1):**
> "And that single click does a lot on the server, all inside one **atomic transaction** so it can never half-complete. Accepting a proposal automatically **creates the order, creates the order item with the full garment specification snapshotted into it, and generates the payment schedule** — the deposit and the balance, each with its own due date. It also links the order back to the proposal it came from, for traceability. We also built a **payment gate**: until the deposit is actually paid, the detailed workshop information on the order stays hidden. So the business rule — 'no work starts without a deposit' — is enforced in code, not on trust."

**✅ COVERS:** important features · demonstrates multiple roles interacting (customer ↔ studio) · shows real business-logic depth.

---

## SEGMENT 7 — Demo, part 4: the staff and admin roles
**⏱ 9:00 – 10:30 (1:30) · Presenter: Backend Developer 2**

**🎬 SHOW:** Log out (via the Sidebar), log back in as **admin@squallyline.com**. Land on `/admin`. Show, briefly: the **dashboard**, the **catalogue CMS** (create/edit a product or style with an image upload), **Consultations**, the **Proposal Editor** (compose the very proposal the customer accepted in Segment 6 — close the loop), the **Production Queue**, and the **Analytics** dashboard. Mention the apprentice role's narrower view.

**🎙 SAY:**
> "The system has **three roles**, and each sees a different world. A **customer** sees the shop, their measurements, and their orders. An **apprentice** — a member of the tailoring staff — can run day-to-day shop-floor operations. And an **admin** — the studio owner — can do everything, including pricing and analytics.
>
> Here is the admin side. From the catalogue manager, the studio adds and edits products and styles and uploads images — and on upload, the back end automatically validates and converts every image to an optimised **WebP** to keep the site fast. Under Consultations, staff review incoming requests, and in the **Proposal Editor** the studio composes the quote — this is the other end of the agreement the customer accepted a moment ago.
>
> The **Production Queue** is where bespoke work is tracked: every garment moves through real stages — pattern-making, cutting, sewing, fitting, finishing, quality check — and the queue is **sorted by deadline and flags at-risk orders**, like ones whose payment is overdue or whose delivery date is close. Finally, the **Analytics** dashboard gives the owner revenue over time, top-selling pieces, production stats, and customer retention. This is the role-based control the brief asked us to demonstrate."

**✅ COVERS:** *"if the system has multiple roles, show what every person can see and act"* · important features · demonstrates the admin/staff workflow and closes the proposal loop from Segment 6.

---

## SEGMENT 8 — Security and non-functional requirements
**⏱ 10:30 – 11:15 (0:45) · Presenter: Backend Developer 1**

**🎬 SHOW:** Back to the architecture slide, or a short bullet slide titled "Non-functional requirements." No live `settings.py`.

**🎙 SAY:**
> "Because this system handles people's money and personal data, we treated the non-functional requirements as first-class. On **security**: authentication is JWT with rotating, blacklistable refresh tokens; every admin action is protected by **role-based permissions** on the server, not just hidden in the UI; registration enforces a strong password policy; and every Paystack webhook is **cryptographically signature-verified** before we trust it. On **performance**, we paginate list endpoints, optimise images to WebP, and let the front end refresh its own token silently. On **reliability**, the critical operations — checkout, accepting a proposal — run in **atomic database transactions**, and our payment webhook is **idempotent**, so a repeated callback can't double-charge or double-process. Those are the qualities behind the features you just saw."

**✅ COVERS:** deepens architecture · explicitly ties back to the non-functional requirement categories named in Segment 2.

---

## SEGMENT 9 — Limitations and problems we faced
**⏱ 11:15 – 12:05 (0:50) · Presenter: UI Designer**

**🎬 SHOW:** A plain, honest bullet slide: two columns — "Current limitations" and "Challenges we faced."

**🎙 SAY:**
> "No honest demo is complete without its limits. **What isn't done yet:** the system doesn't send email or SMS notifications — that's configured but not wired up. Refunds are modelled in the data but don't have a full workflow yet. Some product detail copy, like care and return policies, is still static rather than per-item. And a couple of interface pieces, like the top navigation profile menu, are still on placeholder data — which is exactly why we've been using the sidebar in this demo.
>
> **The problems we faced** were as much about engineering practice as code. Coordinating **seven people on one codebase** meant living in Git branches and resolving real merge conflicts. Learning **three.js** for the 3D figure took time. **Deploying to Railway** taught us hard lessons about environment configuration, CORS, and serving static files in production. And the biggest project-management challenge was **scope creep** — the client always has one more idea — which we controlled with MoSCoW prioritisation and a scope freeze on the MVP. Testing payments without spending money pushed us to work entirely in **Paystack's test mode**."

**✅ COVERS:** limitations and problems faced (both product limitations *and* the engineering challenges the lecturer wants to hear about).

---

## SEGMENT 10 — What comes next, and is it scalable?
**⏱ 12:05 – 12:50 (0:45) · Presenter: Backend Lead, handing to Project Manager**

**🎬 SHOW:** A "Scaling path" slide with the sequence: harden → optimise → scale vertically → scale horizontally → decompose. Then a short "Roadmap" bullet slide.

**🎙 SAY (Backend Lead):**
> "Is it scalable? Yes — and we can be specific about *how*, because the course taught us that the signal to scale is real demand, not ambition. If we asked 'what breaks first at ten thousand users?', the honest answer is that we'd **harden the production configuration first** — move secrets and debug settings into environment variables. Then the sequence is textbook: **optimise** with database indexes and caching, **scale vertically** on a bigger Railway instance, then **scale horizontally** — and because our JWT auth is already stateless, we can run many API instances behind a load balancer with no redesign. The pieces we'd **decompose** first are media storage, moving images off local disk onto object storage and a CDN, and adding a background worker with a task queue for notifications and webhooks."

**🎙 SAY (Project Manager):**
> "On the roadmap after that: real email, SMS, and WhatsApp notifications; a full refund flow; and eventually a mobile app. And commercially, because all seven of us are joint authors under Ghana's Copyright Act, the plan is to **assign the intellectual property to the client on final payment**, hand over a signed MVP acceptance, and continue on a small hosting-and-support retainer."

**✅ COVERS:** *"what comes after this, is it scalable, what can we change to increase [scale]"* · brings in the business-of-software-engineering material (IP, handover) for extra course credibility.

---

## SEGMENT 11 — Close
**⏱ 12:50 – 13:20 (0:30) · Presenter: Project Manager**

**🎬 SHOW:** Return to the team-with-client photo / studio clip. Final title card with the **live URL** and the team name. Live site visible one last time.

**🎙 SAY:**
> "That's Squally Line — a real problem, for a real client, solved with a real engineering process from requirements to deployment. Our thanks to `[CLIENT FULL NAME]` for trusting us with his studio. You can try the live platform yourself at `squallyline-frontend-production.up.railway.app`. Thank you for watching."

**✅ COVERS:** pictorial evidence with the client (reprise) · live URL visible · clean ending inside the time budget.

---
---

# APPENDICES

## Appendix A — Demo run-of-show (film this as one clean take)

Record this whole click-through once, cleanly, with the URL bar visible, then edit narration over it:

1. `/atelier` → "Enter the shop."
2. Log in as a **customer**.
3. `/gallery` → `/categories` (show tree + filters) → open `/product/:id` → **add to cart**.
4. `/cart` → `/checkout` → **Paystack test** → test card → `/payment/callback` → `/orders`.
5. Open a **style** → `/styles/order/:id` → submit a made-to-measure **request** (no charge).
6. `/measure` → add a person, enter measurements, show the **3D figure**, save.
7. `/appointments/:id` → **Agreement** tab → **Accept** proposal → becomes an **order**.
8. Log out → log in as **admin@squallyline.com / Admin@123** → `/admin` → dashboard, catalogue CMS (upload image), Consultations, **Proposal Editor**, **Production Queue**, **Analytics**.
9. Toggle **dark/gold theme** from the Sidebar to end the demo.

**Golden rules on camera:** URL bar always visible · Sidebar for profile/logout (never the header avatar) · never open `settings.py` · Paystack in test mode only.

---

## Appendix B — What your architecture diagram must show (for Segment 3)

Draw a left-to-right diagram with these boxes and label the arrows:

```
[ Customer / Staff browser ]
          │  HTTPS
          ▼
[ React SPA  (React 19 + React Router) ]      ← hosted on Railway
          │  REST / JSON over HTTPS,  JWT Bearer token
          ▼
[ Django + Django REST Framework API ]        ← hosted on Railway (Gunicorn + WhiteNoise)
     │                     │
     ▼                     ▼
[ PostgreSQL ]        [ Paystack API ]  ← external 3rd-party (payments, GHS)
 (Railway)             initialise / verify / webhook (HMAC-SHA512 verified)
```

Call out on the diagram: **stateless JWT auth**, **server-owned cart**, **image pipeline → WebP**, and the four API domains — **accounts, shop (products), appointments, orders/analytics**.

---

## Appendix C — Architecture Decision Records (your "ADRs" / "ARDs" deliverable)

Present these as a short decision log. Each is: *decision — why — trade-off.*

- **ADR-001 — Separate React SPA + Django REST API (not a Django-rendered monolith).** Why: independent front-end/back-end development for a split 7-person team, and a clean path to a future mobile client. Trade-off: two deployments to manage.
- **ADR-002 — Stateless JWT authentication (SimpleJWT), not server sessions.** Why: enables horizontal scaling with no sticky sessions; simple for an API. Trade-off: token revocation needs a blacklist (which we enabled).
- **ADR-003 — Paystack as the payment gateway.** Why: built for the Ghanaian market, settles in cedis (GHS), supports mobile money and cards. Trade-off: vendor lock-in to one provider.
- **ADR-004 — PostgreSQL in production (SQLite only in local dev).** Why: concurrency, reliability, and Railway support. Trade-off: heavier local setup.
- **ADR-005 — Railway as the hosting platform for both tiers.** Why: fast to deploy, managed Postgres, fits a student budget and timeline. Trade-off: less control than raw cloud VMs.
- **ADR-006 — Permissive-licence-only dependency policy.** Why: the product is delivered as a private commercial system to the client, so no strong-copyleft (GPL/AGPL) code is allowed. All dependencies are MIT/BSD/ISC. Trade-off: occasionally rules out a copyleft library. *Verified with `npx license-checker --summary` (frontend) and `pip-licenses` (backend).*

---

## Appendix D — Software-engineering vocabulary cheat-sheet (so every speaker is consistent)

- **SDLC phases:** Problem definition → Requirements gathering & analysis → Planning & design → Implementation → Testing → Deployment → Maintenance.
- **Requirements elicitation methods you used:** (1) semi-structured **stakeholder interviews** (primary), (2) **observation / contextual inquiry** (primary), (3) **document analysis** (paper measurement books, WhatsApp chats), (4) **iterative prototyping** (mock-ups reviewed with the client).
- **Functional requirement** = *what the system does* (a feature). **Non-functional requirement** = *how well it does it* (a quality).
- **Non-functional requirement categories:** Security · Performance & Scalability · Availability & Reliability · Usability · Compliance & Regulations.
- **Methodology:** Agile, iterative & incremental; **MoSCoW** prioritisation (Must / Should / Could / Won't); MVP-first; weekly client check-ins.
- **Scaling sequence:** harden config → optimise (indexes, caching) → scale vertically → scale horizontally (stateless JWT helps here) → decompose (media to object storage/CDN, background worker for notifications).
- **Business / IP (Ghana):** all 7 developers are **joint authors** under the **Copyright Act 2005 (Act 690)**; IP is **assigned to the client on final payment** via a written contract; delivery is an **MVP with an acceptance form**, followed by a **hosting & support retainer**.

---

## Appendix E — Accuracy guardrails (do NOT say these on camera)

- ❌ "The system emails/texts customers." — It does **not** (console backend only; no messages are sent). Say it's planned.
- ❌ "You can get a refund in the app." — Refunds are modelled but **have no working flow** yet.
- ❌ "Buy your custom outfit here" on the style-request page. — That page **submits a request; it does not charge**.
- ❌ Opening the **top-right header avatar / its logout**. — Placeholder data; logout not wired. Use the **Sidebar**.
- ❌ Clicking the home page **"Measurements" marketing banner** CTA. — Dead route. Use the sidebar → `/measure`.
- ❌ Showing **`settings.py`** or any secret. — `DEBUG=True`, hard-coded `SECRET_KEY` and DB password, `ALLOWED_HOSTS=['*']` are visible there.
- ❌ Claiming a feature that needs live Paystack keys works, if you haven't set test keys. — Set **test keys** or **pre-record** the payment.

---

*End of script. Fill every `[SQUARE BRACKET]`, resolve the three "Decisions to lock" items, then rehearse once against the clock before the final take.*
