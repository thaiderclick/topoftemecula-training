# Top of Temecula — Ambassador Training Curriculum

> **How to use this file:**
> This is the single source of truth for all training content. Edit this file to update lessons, scripts, quizzes, assignments, recall prompts, or facilitator activities. When you are ready to push changes into the live app, a developer can parse this file and update `client/src/data/trainingData.ts` accordingly.
>
> **Structure rules:**
> - Each Day is a Module. Keep the Day/Module structure intact.
> - Quiz answers are marked with a ✅ on the correct option. Keep one correct option per question.
> - Active Recall prompts use `**Prompt:**` / `**Answer:**` pairs.
> - Script blocks use `**Label:**` / `**Script:**` pairs.
> - Do's & Don'ts use `✅ DO:` / `❌ DON'T:` prefixes.
> - Field Scenario cards use `**Scenario:**` / `**Rung:**` / `**Script:**` (Rung ties the scenario to the Outcome Ladder in Day 3).
> - **Activity blocks** use `**Activity:**` / `**Time:**` / `**Goal:**` / `**Steps:**` / `**Done when:**`. These are facilitator-led, hands-on, and are what make each day a real working day rather than a read-through.
> - **Drill blocks** use `**Drill:**` / `**Time:**` / `**How:**`. Drills are repeated practice reps (partner roleplay, rapid-fire objections).
> - **Facilitator notes** use `> **Facilitator:**` and are guidance for whoever is running the session, not trainee-facing content.
> - Each Day opens with a **Run-of-Day** time block so the facilitator can pace a real ~4-hour session.

---

# FOUNDATIONS — Answer Engine & Generative Engine Optimization (AEO/GEO)
**Subtitle:** The vendor-neutral knowledge base behind the job: how AI answer engines decide who to recommend, and the structured-data, entity, and authority concepts that make a business findable by machines.
**Duration:** 2.5 Hours (Self-Paced Knowledge Module — complete before Day 1)
**Description:** This module is a real, standalone foundation in Answer Engine Optimization (AEO) and Generative Engine Optimization (GEO) — an emerging discipline in digital marketing. You'll learn how large language models and answer engines actually work, what structured data and schema.org markup are, how entities and knowledge graphs drive recommendations, and how to measure AI visibility. The concepts here are not specific to Top of Temecula — they're the same ideas a search strategist, SEO specialist, or AI-marketing consultant works with. Once you understand them, the rest of your training (and your conversations with business owners) will make far more sense, and you'll be able to speak about this field with genuine credibility.

### Run-of-Day (Facilitator Pacing)
| Block | Topic | Time |
|---|---|---|
| 1 | Why this module / the field & the credential (Slides 1–2) | 20 min |
| 2 | How answer engines work: training vs. retrieval (Slides 3–4) | 35 min |
| 3 | Structured data & schema.org deep-dive (Slides 5–6) | 35 min |
| — | Break | 10 min |
| 4 | Entities, knowledge graph & E-E-A-T (Slides 7–8) | 30 min |
| 5 | **Activity F1 — Read Real Schema Markup** (hands-on) | 25 min |
| 6 | GEO tactics, measuring + how the engines differ (Slides 9–11) | 35 min |
| 7 | Owner-translation + how ToT implements this (Slides 12–13) | 20 min |
| 8 | Active Recall + Foundations Quiz | 25 min |

> **Facilitator:** This is heavier than the field days — it's deliberately a real course. Don't rush it. The payoff is ambassadors who sound like they actually understand the field, not people reciting a script. If trainees push back that it's "too technical," remind them this is exactly the knowledge that makes the certification worth putting on a résumé.

---

### Slide 1 — What This Module Is (and Why It's Worth Your Time)

AEO and GEO are new enough that very few people can explain them well. That's the opportunity. By the end of this module you'll understand a genuinely emerging field in digital marketing — the same concepts that SEO specialists, content strategists, and AI-visibility consultants are scrambling to learn right now.

This matters for two reasons:

1. **For the job:** When you understand *why* a claimed, structured, consistent profile makes a business recommendable by AI, you can explain Top of Temecula's value to an owner with real conviction instead of a memorized line.
2. **For you:** "Answer Engine Optimization" and "Generative Engine Optimization" are real, growing specialties. Understanding them — and being able to prove it — is a legitimate, current skill. This module is built to give you that knowledge for keeps, whether or not you stay in this exact role.

We'll keep it honest throughout. Nobody can *guarantee* an AI will name a specific business. What you *can* do is understand the signals that make a business more likely to be recommended, and influence those signals. That's the whole discipline.

> **Key Callout:** This is a real foundation in an emerging field, not platform trivia. Learn it for keeps — it's knowledge that travels with you.

---

### Slide 2 — The Three-Letter Shift: SEO → AEO → GEO

These three acronyms describe twenty years of how people find things online, and where it's headed. Know them precisely:

- **SEO — Search Engine Optimization.** Optimizing so a *web page ranks* in a list of results (the classic Google "ten blue links"). The unit of success is a ranking position.
- **AEO — Answer Engine Optimization.** Optimizing to be the *answer* an answer engine gives — voice assistants (Siri, Alexa), Google's AI Overviews, featured snippets. The unit of success is *being the spoken or featured answer*, often with no list at all.
- **GEO — Generative Engine Optimization.** Optimizing to be *named and cited inside the generated response* of a large language model — ChatGPT, Gemini, Claude, Perplexity. The unit of success is appearing in the AI's actual recommendation.

The throughline: **SEO is about ranking; AEO and GEO are about being chosen.** A list gives the user ten options and lets them pick. An answer engine picks one (or a few) on the user's behalf. That single change — from a list to a recommendation — is the entire reason this field exists.

> **Key Callout:** SEO = rank in a list. AEO = be the answer. GEO = be the name the AI generates and cites. The shift is from ranking to being chosen.

---

### Slide 3 — How Answer Engines Work, Part 1: Two Kinds of Knowledge

To influence AI recommendations you have to know where the AI's "knowledge" comes from. A modern AI tool draws on two very different sources:

1. **Parametric knowledge (training).** A large language model (LLM) is trained on an enormous snapshot of text. Whatever it absorbed during training is baked into its parameters — its "memory." This knowledge is frozen at a **training cutoff date** and is fuzzy: the model has a general sense of who's well-known, but it doesn't store a clean, current database of every local business.
2. **Retrieved knowledge (live lookup).** Increasingly, AI tools don't rely on memory alone. When you ask "best insurance agent in Temecula," the tool can *retrieve* fresh information from the web or a connected data source at the moment you ask, then write its answer using what it just found.

Why this distinction matters for a local business: a small Temecula shop is almost never famous enough to live in the model's frozen training memory. So the *only* realistic way for it to show up is through **retrieval** — the AI finding clean, current, trustworthy information about it at answer time. That's the door a local business actually walks through.

> **Key Callout:** Training memory favors the already-famous. Local businesses get recommended through *retrieval* — so giving AI clean, current, findable information is the whole game.

---

### Slide 4 — How Answer Engines Work, Part 2: RAG, Grounding & Citations

The technique behind "look it up while answering" has a name: **RAG — Retrieval-Augmented Generation.** It's worth understanding because it explains *exactly* why structured, consistent data wins.

@video https://www.youtube.com/watch?v=T-D1OfcDW1M | What is Retrieval-Augmented Generation (RAG)? — IBM Technology (~6 min)

Here's the loop, in plain terms:

1. **Retrieve.** The system searches its sources for material relevant to the question and pulls back the most relevant passages.
2. **Augment.** Those retrieved passages are handed to the language model alongside the user's question.
3. **Generate.** The model writes its answer **grounded** in that retrieved material — and often shows **citations** (the sources it leaned on).

Two consequences follow directly:

- **The AI can only recommend what it can retrieve and trust.** If a business's information is missing, contradictory, or buried, it won't make it into the retrieved set — so it can't be in the answer. It's not punished; it's simply invisible.
- **Clean, structured, consistent sources get retrieved more reliably.** Machine-readable facts (covered next) and consistent details across the web make a business *easy to retrieve and easy to trust* — which is precisely what RAG rewards.

> **Key Callout:** RAG = Retrieve → Augment → Generate. The AI grounds its answer in what it can pull at that moment. If your data isn't clean and findable, you're not in the retrieval set — and you can't be the answer.

---

### Slide 5 — Structured Data & schema.org: Teaching Machines What Your Page Means

Humans read a web page and instantly understand "this is a med spa in Murrieta, open till 7, phone number right there." A machine sees a wall of text. **Structured data** fixes that: it's a standardized way to label the meaning of information so machines read it cleanly and confidently.

The shared vocabulary everyone uses is **schema.org** — a standard, backed by Google, Microsoft, and others, that defines types (like `LocalBusiness`, `Restaurant`, `Product`, `Event`) and properties (like `name`, `address`, `telephone`, `openingHours`).

@video https://www.youtube.com/watch?v=tYfCjbvaOYg | Structured data for beginners — Google Search Central (~6 min)

The most common format for expressing it is **JSON-LD** (JSON for Linking Data) — a small block of code placed in a page's HTML. Here's a real, simplified example for a local business:

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Valley Auto Care",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Front St",
    "addressLocality": "Temecula",
    "addressRegion": "CA",
    "postalCode": "92590"
  },
  "telephone": "+1-951-555-0123",
  "openingHours": "Mo-Fr 08:00-17:00",
  "priceRange": "$$",
  "url": "https://valleyautocare.example.com"
}
```

You don't have to write this by hand — but you should recognize it and know what it does. That block tells any machine, unambiguously: *this is a local business, here's its exact name, address, phone, hours, and price range.* No guessing required.

> **Key Callout:** Structured data = labeling meaning for machines. schema.org is the shared vocabulary; JSON-LD is the code format. It turns a fuzzy page into facts an AI can trust.

---

### Slide 6 — The LocalBusiness Schema: The Properties That Matter

`LocalBusiness` is the schema.org type that matters most for the businesses you'll work with. Knowing its key properties makes you genuinely conversant. The high-value ones:

- **`name`** — the exact, canonical business name.
- **`address`** (a `PostalAddress`) — street, city, region, postal code.
- **`telephone`** — the business phone, ideally in a consistent format.
- **`openingHours`** — when they're open.
- **`geo`** — latitude/longitude, so "near me" queries can place them.
- **`priceRange`** — a rough price signal (e.g., `$$`).
- **`sameAs`** — links to the business's other official profiles (their website, Google profile, social pages). This is how a machine confirms "all these listings are the *same* entity."
- **`aggregateRating`** / **`review`** — structured review and rating data.

Two ideas to lock in: first, **more complete and accurate structured data = a stronger, more trustworthy signal.** Second, the `sameAs` property is the bridge to the next concept — *entities* — because it's literally how a business says "these scattered listings are all me."

> **Key Callout:** For local, `LocalBusiness` is the type that counts. Name, address, phone, hours, geo, and `sameAs` are the workhorses. Complete + accurate = trusted.

---

### Slide 7 — Entities, the Knowledge Graph & NAP Consistency

Search and AI systems increasingly think in terms of **entities**, not keywords. An entity is a distinct real-world thing — a specific business, person, or place — that the system recognizes and stores facts about in a **knowledge graph** (a giant web of "this thing is related to that thing"). Google's knowledge panels are the visible tip of this.

For a local business, two related ideas decide whether it's a clean entity:

- **NAP consistency.** NAP = **N**ame, **A**ddress, **P**hone. When these are *identical* everywhere the business appears online, machines confidently merge all those listings into one trusted entity. When they conflict — "Suite 5" on one site, "#5" on another, an old phone number on a third — the system can't tell if it's one business or several, and trust drops. **Inconsistency is the silent killer of machine trust.**
- **Entity disambiguation.** Helping systems tell *this* "Valley Auto" (in Temecula) apart from a dozen others nationwide. Consistent NAP plus `sameAs` links plus a clear local context is how disambiguation happens.

This is why "claiming and correcting a profile" isn't busywork — it's directly strengthening the business's entity so machines stop second-guessing it.

> **Key Callout:** AI thinks in entities, not keywords. Consistent Name/Address/Phone everywhere = one trusted entity. Conflicting info = confusion and lost trust.

---

### Slide 8 — E-E-A-T: Why Trust Is a Ranking and Recommendation Signal

AI and search systems don't just ask "is this findable?" — they ask "is this *trustworthy*?" The framework for that, drawn from Google's own quality guidelines, is **E-E-A-T**:

- **Experience** — is there genuine first-hand experience behind the content (real reviews, real photos, a real track record)?
- **Expertise** — does the source actually know the subject?
- **Authoritativeness** — is this a recognized, referenced source in its space?
- **Trustworthiness** — is the information accurate, consistent, and verifiable?

For a local business, E-E-A-T shows up as: authentic reviews, consistent and accurate information, a complete profile, and being referenced by *authoritative local sources*. A trusted, hyper-local directory that clearly covers a specific region is exactly the kind of authoritative, location-specific source these systems weight heavily — which is why *where* a business is listed matters, not just *that* it's listed.

> **Key Callout:** E-E-A-T = Experience, Expertise, Authoritativeness, Trust. AI recommends what it trusts. Accurate info, real reviews, and authoritative local mentions all build that trust.

---

### Activity F1 — Read Real Schema Markup

**Activity:** Read Real Schema Markup
**Time:** 25 min
**Goal:** Make structured data concrete by finding it in the wild, so you can say "I've actually looked at this" with confidence.
**Steps:**
1. Pick a well-known business with a good website (a chain restaurant or a polished local site works well).
2. Open the page, right-click, and choose "View Page Source." Use Find (Ctrl/Cmd-F) to search the source for `schema.org`.
3. When you find a JSON-LD block, read it. Identify the `@type` and as many properties as you can (name, address, telephone, openingHours).
4. Now try a site with little or no structured data (often a small, un-maintained local business). Notice the difference.
5. Optional: paste a page's URL into Google's Rich Results Test (search "Google Rich Results Test") to see the structured data a machine detects.

**Template:**
```
Business 1 (has schema):
  @type found:
  Properties you spotted:
Business 2 (little/no schema):
  What was missing:
One sentence: why would an AI trust Business 1 more?
```

**Done when:** You've located a real JSON-LD block, named its type and at least three properties, and can explain in one sentence why structured data makes a business easier for AI to trust.

> **Facilitator:** This is the "it's real" moment. Once a trainee sees actual `LocalBusiness` JSON-LD in a page they use every day, the abstract becomes concrete and the whole module clicks. Walk anyone through View Source who's never done it.

---

### Slide 9 — GEO Tactics: How You Actually Influence a Generative Answer

Put the pieces together. You can't *make* an AI name a business, but the discipline of GEO is about stacking the signals that make it likely. The honest, effective levers:

1. **Be retrievable.** Have clear, factual, up-to-date information in places AI tools pull from. (Remember RAG — if you're not findable, you're not in the answer.)
2. **Be structured.** Use schema.org / JSON-LD so machines read the facts cleanly instead of guessing.
3. **Be consistent.** Lock NAP consistency so the business reads as one trusted entity.
4. **Be authoritative-adjacent.** Be present and accurate in trusted, relevant, local sources — the kind of citations a grounded answer is built from.
5. **Be substantive.** Real reviews, complete details, genuine specifics (E-E-A-T) beat thin, empty listings.

Notice none of these are tricks. There's no "hack the AI." GEO is mostly **making a business genuinely clear, consistent, complete, and trustworthy to machines** — and then being present in the sources those machines read.

> **Key Callout:** GEO levers: be retrievable, structured, consistent, authoritative-adjacent, and substantive. No tricks — just making a business genuinely clear and trustworthy to machines.

---

### Slide 10 — Measuring AI Visibility: You Can't Improve What You Don't Track

A real discipline needs measurement. Here's how AI visibility is actually assessed — and it's something you can do by hand today:

- **Prompt testing.** Ask the same realistic question across multiple engines — "Who are the best [category] in [city]?" — in **ChatGPT, Gemini, Claude, and Perplexity.** Record which businesses get named and cited. Different engines retrieve differently, so test more than one.
- **Share of voice.** Across a set of relevant prompts, how often does a given business appear versus its competitors? That percentage is its "share of voice" in AI answers — the AEO/GEO equivalent of a ranking.
- **Tracking over time.** A single check is a snapshot. Real insight comes from running the same prompts on a schedule and watching the trend as a business improves its signals.
- **Citations.** Note not just whether a business is *named* but whether it's *cited* (linked as a source). Citations are the strongest form of AI visibility.

This is exactly the workflow a professional AI-visibility analyst runs — and it's the workflow that turns "AI is recommending businesses now" from a claim into a measurable number.

> **Key Callout:** Measure AI visibility by prompt-testing the same questions across ChatGPT, Gemini, Claude, and Perplexity, tracking who gets named/cited, and watching share-of-voice over time.

---

### Slide 11 — The Engines Aren't the Same (and Why Results Move)

A beginner thinks "the AI" is one thing. A foundation-level understanding knows the major engines retrieve and decide *differently* — which is exactly why you test all of them and why no one can promise a result. As a general picture (the specifics shift over time, so hold them loosely):

- **Perplexity** is built as an "answer engine" first — it almost always searches the live web at query time and shows its sources prominently. Fresh, findable, citable information matters most here.
- **Google's Gemini / AI Overviews** lean heavily on Google's own search index and Knowledge Graph. Strong traditional search presence and a clean entity tend to carry over.
- **ChatGPT** uses integrated web search when it decides browsing is needed; otherwise it can fall back on its training memory. So both live findability *and* general reputation play in.
- **Claude** reasons carefully over whatever context it's given or retrieves, with web access that's more conditional. It rewards clear, unambiguous, well-structured information.

Two honest truths fall out of this:

1. **The same question gives different answers on different engines** — and a business can show up on one but not another. That's normal, not a bug. It's why measurement spans all four.
2. **Results move over time.** Retrieval sources and rankings change week to week, and models can even mis-cite or hallucinate a source. You influence the *inputs* — clean, consistent, findable, structured data — but you never control the model's output. That's the real reason "guaranteed #1" is a lie no honest practitioner makes.

> **Key Callout:** The engines retrieve differently (Perplexity = live web, Gemini = Google's index, ChatGPT = browse-or-memory, Claude = reasoned over context), and results shift over time. You shape the inputs; you don't control the output.

---

### Slide 12 — The Owner-Translation Layer (and the Ethics Line)

Knowing the concepts is half the skill. The other half is translating them so a busy owner *feels* it in one sentence — without jargon, and without overpromising. Keep these conversions ready:

- **"Structured data / schema" →** "We make sure your business info is written in a way computers read perfectly, so AI doesn't get your hours or address wrong."
- **"NAP consistency / entity" →** "AI gets confused when your info doesn't match across the web. We make it consistent so it's clear you're one real, trusted business."
- **"RAG / retrieval" →** "When someone asks AI for the best [business type] around here, the AI looks things up on the spot. We make sure you're findable and clear when it looks."
- **"Measuring visibility" →** "We actually track how often AI tools mention you, so you can see it working instead of guessing."

**The ethics line — never cross it:** You may say a business will be *more likely* to be found and recommended. You may **never** guarantee a #1 spot, a specific ranking, or that a particular AI "will" recommend them. The systems are probabilistic and outside anyone's control. Honesty here protects the business, the brand, and you.

> **Key Callout:** Translate every concept into one plain sentence an owner feels. And never guarantee rankings or a specific AI result — "more likely," never "guaranteed."

---

### Slide 13 — How Top of Temecula Puts This Into Practice

Now connect the entire field to what you'll actually offer. Top of Temecula is, in concrete terms, an AEO/GEO asset built on every concept in this module:

- **It emits structured data.** Claimed profiles output schema.org `LocalBusiness` markup (JSON-LD) — the exact machine-readable signal from Slides 5–6 — so AI reads the business's facts cleanly.
- **It's a hyper-local authoritative source.** A directory that clearly and specifically covers the Temecula Valley is the kind of trusted, location-specific source (Slide 8) that grounded AI answers are built from.
- **It strengthens the entity.** Claiming and correcting a profile fixes NAP consistency and adds `sameAs`-style links — turning scattered listings into one trusted entity (Slide 7).
- **It measures visibility for them.** The **AI-Citation Tracker** runs the prompt-testing workflow from Slide 10 across **ChatGPT, Claude, Perplexity, and Gemini**, and **refreshes the data monthly** — so the owner sees their AI visibility as real numbers, trending over time.

So when you help an owner claim and complete their profile, you're not "adding a listing." You're applying real AEO/GEO practice on their behalf: clean structured data, a stronger entity, presence in an authoritative local source, and measurable tracking.

> **Key Callout:** ToT is AEO/GEO in practice: it emits LocalBusiness JSON-LD, is a trusted hyper-local source, strengthens the business's entity, and tracks AI citations across ChatGPT, Claude, Perplexity & Gemini — refreshed monthly.

---

### Slide 14 — Active Recall: Foundations Check

**Prompt:** What do SEO, AEO, and GEO each optimize for?
**Answer:** SEO optimizes to rank a page in a list of results. AEO optimizes to be the answer an answer engine gives (voice, AI Overviews). GEO optimizes to be named and cited inside a generative AI's response. SEO is about ranking; AEO/GEO are about being chosen.

**Prompt:** What are the two kinds of knowledge an AI tool uses, and which one gets local businesses recommended?
**Answer:** Parametric (frozen training memory) and retrieved (live lookup at answer time). Local businesses are almost never in training memory, so they get recommended through retrieval — by being clean, current, and findable.

**Prompt:** What does RAG stand for and what are its three steps?
**Answer:** Retrieval-Augmented Generation: Retrieve relevant sources, Augment the prompt with them, Generate a grounded, often-cited answer. The AI can only recommend what it can retrieve and trust.

**Prompt:** What is structured data, what's the vocabulary, and what's the format?
**Answer:** A standardized way to label the meaning of information for machines. The vocabulary is schema.org; the common format is JSON-LD. For local businesses the key type is LocalBusiness.

**Prompt:** What is NAP consistency and why does it matter?
**Answer:** Name, Address, Phone being identical everywhere online. Consistency lets machines merge listings into one trusted entity; conflicting info causes confusion and lost trust.

**Prompt:** What does E-E-A-T stand for?
**Answer:** Experience, Expertise, Authoritativeness, Trustworthiness — the qualities that make AI and search trust a source.

**Prompt:** How do you measure a business's AI visibility?
**Answer:** Prompt-test the same questions across ChatGPT, Gemini, Claude, and Perplexity; record who gets named and cited; track share-of-voice over time.

**Prompt:** Why can the same question give different answers on different engines?
**Answer:** The engines retrieve and decide differently — Perplexity searches the live web, Gemini leans on Google's index, ChatGPT browses or uses memory, Claude reasons over given context. Results also shift over time, so you test all of them and never promise a fixed result.

**Prompt:** What's the one thing you must never promise an owner?
**Answer:** A guaranteed ranking or that a specific AI will recommend them. You can say "more likely to be found and recommended," never "guaranteed."

---

### Foundations Quiz

**Q1.** What is the key difference between SEO and AEO/GEO?
- A) SEO is free and AEO/GEO are paid
- B) ✅ SEO is about ranking in a list; AEO/GEO are about being the chosen answer or recommendation
- C) SEO is for websites and AEO/GEO are only for social media
- D) There is no real difference; they're the same thing

*Explanation: SEO optimizes for ranking position in a list. AEO and GEO optimize for being the single answer an engine gives or the business a generative AI names and cites — being chosen, not just ranked.*

---

**Q2.** Why are local businesses usually recommended through *retrieval* rather than an AI's training memory?
- A) Retrieval is cheaper for the AI company
- B) Training memory is illegal to use for businesses
- C) ✅ Small local businesses are rarely "famous" enough to be in the model's frozen training data, so the AI finds them by looking up clean, current information at answer time
- D) AI tools never use training memory at all

*Explanation: Parametric (training) memory favors well-known entities and is frozen at a cutoff. A local shop realistically appears only when the AI retrieves clean, current, findable information about it.*

---

**Q3.** What does RAG (Retrieval-Augmented Generation) describe?
- A) A way to rank websites in Google
- B) ✅ The loop where an AI retrieves relevant sources, augments the prompt with them, and generates a grounded, often-cited answer
- C) A type of structured data format
- D) A paid advertising program for AI tools

*Explanation: RAG = Retrieve → Augment → Generate. It's why findable, structured, trustworthy data wins: the AI can only recommend what it can retrieve and trust.*

---

**Q4.** What is JSON-LD?
- A) A programming language for building websites
- B) A type of AI model
- C) ✅ A code format for expressing structured data (schema.org) so machines can read a page's meaning cleanly
- D) A social media scheduling tool

*Explanation: JSON-LD (JSON for Linking Data) is the common format for placing schema.org structured data in a page, labeling facts like name, address, and hours for machines.*

---

**Q5.** Which schema.org type matters most for the businesses you'll work with?
- A) Product
- B) ✅ LocalBusiness
- C) Article
- D) VideoObject

*Explanation: LocalBusiness (and its properties like name, address, telephone, openingHours, geo, and sameAs) is the type that describes the local businesses an ambassador helps.*

---

**Q6.** What is "NAP consistency" and why does it matter?
- A) A nap schedule for productivity; it doesn't matter for AI
- B) ✅ Identical Name, Address, and Phone across the web, which lets machines merge listings into one trusted entity instead of getting confused
- C) A type of AI citation
- D) The number of pages a website has

*Explanation: When NAP is consistent everywhere, systems confidently recognize one trusted entity. Conflicting info causes disambiguation problems and erodes machine trust.*

---

**Q7.** What does E-E-A-T stand for?
- A) Engagement, Email, Ads, Traffic
- B) Entities, Engines, Answers, Tracking
- C) ✅ Experience, Expertise, Authoritativeness, Trustworthiness
- D) Efficiency, Economy, Accuracy, Timing

*Explanation: E-E-A-T is the quality framework — Experience, Expertise, Authoritativeness, Trustworthiness — that drives whether AI and search trust a source enough to recommend it.*

---

**Q8.** How should you measure a business's AI visibility?
- A) Count its Instagram followers
- B) Check its Google ad spend
- C) ✅ Prompt-test the same realistic questions across ChatGPT, Gemini, Claude, and Perplexity, record who gets named and cited, and track share-of-voice over time
- D) Ask the business owner to guess

*Explanation: AI visibility is measured by running consistent prompts across multiple engines, tracking which businesses are named and cited, and watching the trend — exactly what Top of Temecula's AI-Citation Tracker does monthly.*

---

**Q9.** Which of the following is an acceptable thing to tell a business owner?
- A) "We guarantee you'll be the #1 result in ChatGPT."
- B) "We can make sure a specific AI will always recommend you."
- C) ✅ "Doing this makes you more likely to be found and recommended by AI tools."
- D) "We can delete your competitors from AI answers."

*Explanation: AI systems are probabilistic and outside anyone's control. You may honestly say a business is "more likely" to be found and recommended — never guarantee a ranking or a specific AI outcome.*

---

**Q10.** In concrete terms, how does Top of Temecula apply these AEO/GEO concepts for an owner?
- A) It writes their website for them
- B) ✅ It emits schema.org LocalBusiness structured data, acts as a trusted hyper-local source, strengthens the business's entity/NAP consistency, and tracks AI citations across major engines monthly
- C) It pays AI companies to rank the business first
- D) It only stores a phone number and nothing else

*Explanation: A claimed ToT profile outputs LocalBusiness JSON-LD, is an authoritative local source AI can ground answers in, cleans up the business's entity, and measures AI visibility via the AI-Citation Tracker (ChatGPT, Claude, Perplexity, Gemini — refreshed monthly).*

---

**Q11.** A Temecula bakery is listed three ways online: "Sweet Spot Bakery, 100 Main St" on its website, "Sweet Spot Bakery LLC, 100 Main Street #B" on a directory, and an old phone number on a third site. From an AEO/GEO standpoint, what's the core problem and the fix?
- A) Nothing's wrong; more listings is always better
- B) The problem is too few photos; the fix is to add images
- C) ✅ The Name/Address/Phone are inconsistent, so machines may not recognize it as one trusted entity — the fix is to make NAP identical everywhere and link the profiles (sameAs)
- D) The problem is the bakery isn't paying for ads; the fix is to buy placement

*Explanation: This is a NAP-consistency failure. Conflicting Name/Address/Phone make entity disambiguation harder and erode trust. The fix is identical NAP across the web plus sameAs links so the listings resolve to one entity.*

---

**Q12.** You prompt-test "best taco shop in Temecula." A business appears and is cited in Perplexity but never shows up in ChatGPT. What's the most likely explanation?
- A) ChatGPT has secretly banned the business
- B) ✅ The engines retrieve differently — Perplexity searches the live web by default, while ChatGPT may not have browsed for that query or weighted different sources — so showing up on one but not another is normal
- C) The business must have deleted its website
- D) Perplexity is the only real AI; the others don't count

*Explanation: Different engines retrieve and decide differently, so cross-engine differences are expected. It's exactly why you test all four and track share-of-voice rather than trusting a single check.*

---

**Q13.** Two competing auto shops both claim and complete their profiles. Shop A also gets a dozen genuine recent reviews and is referenced in a local "best mechanics" guide; Shop B has no reviews and no outside mentions. Using E-E-A-T, who is an AI more likely to trust and recommend, and why?
- A) Shop B, because fewer reviews means less to verify
- B) They're exactly equal; reviews and mentions don't matter to AI
- C) ✅ Shop A, because real reviews (Experience) and an authoritative local reference (Authoritativeness/Trust) are stronger trust signals than a complete-but-bare profile alone
- D) Whichever shop pays the AI company more

*Explanation: A complete profile is the baseline. Genuine reviews and authoritative local mentions add Experience, Authoritativeness, and Trust — the E-E-A-T signals that make AI more confident recommending a business.*

---

### Foundations Assignment — Audit a Real Business & Teach It Back

Pick **one real local business in the Temecula Valley** (a genuine independent shop, restaurant, salon, contractor — *not* a national chain, and not Top of Temecula). You'll investigate how AI currently "sees" it, then explain what you found. This is the same thing you'll do in the field — do it for real, not from memory.

**Part 1 — The live query.** Ask a real answer engine (ChatGPT, Perplexity, or Google's AI overview) a natural question a customer would ask — e.g. "best taco shop in Old Town Temecula" or "is [business name] open on Sundays?" Paste the exact question you asked and what the AI actually answered. Did it mention your business? Did it get anything wrong, or say it didn't know?

**Part 2 — The consistency check.** Look the business up in 2–3 places (its Google listing, its own website, and Yelp or Facebook). In a short list, note any place the name, address, phone, or hours don't match, or any key info that's missing entirely.

**Part 3 — Connect it to the concepts (3–4 sentences).** Using what you found — not the slides — explain why the AI answered the way it did. Tie it to retrieval and structured data: what is helping or hurting this business's chances of being the AI's answer?

**Part 4 — The owner pitch (2–3 sentences).** Now pitch this specific owner, out loud in their shop, referencing the actual gap you found. Plain English, no acronyms, no guarantees, end with why it's worth doing now.

**Example (Part 4):** "When someone asks ChatGPT or Siri for the best shop like yours around here, the AI looks your info up on the spot — and it can only recommend you if your details are clear, correct, and consistent. Right now your hours are different on Google than on your own site, so it hedges. We fix that and actually track how often AI mentions you. It's free to set up, and the businesses that get clear now are the ones AI learns to trust first."

**Score yourself — you've nailed it when:**
- [ ] You used a **real** local business and a **real** AI query (exact question and answer pasted in)
- [ ] You found and listed at least one concrete inconsistency or gap (or noted it's already clean, with evidence)
- [ ] Your Part 3 explains this business's result using retrieval and structured data, not a generic definition
- [ ] Your pitch names the specific gap you found — it couldn't be copy-pasted for any other business

---

# DAY 1 — The Platform, The Ecosystem & The New Search Landscape
**Subtitle:** Understand the mission, who we serve, how we compare to the tech giants, and why AI is rewriting local search right now.
**Duration:** 4 Hours (Paid)
**Description:** Learn the core value proposition of Top of Temecula, get hands-on with the platform, understand the Temecula Valley business ecosystem you'll be working in, and master the single most important idea behind the whole job: local search is shifting from a list of links to a single AI answer, and the businesses that get in early win.

### Run-of-Day (Facilitator Pacing)
| Block | Activity | Time |
|---|---|---|
| 1 | Welcome, mission, what winning looks like (Slides 1–4) | 35 min |
| 2 | The local ecosystem + ToT vs the Giants (Slides 5–6) | 30 min |
| 3 | **Activity 1A — Platform Safari** (hands-on site exploration) | 40 min |
| — | Break | 15 min |
| 4 | The New Search Landscape: AEO/GEO (Slides 7–12) | 50 min |
| 5 | **Activity 1B — Insurance Agency Audit** (in-session) | 50 min |
| 6 | Active Recall + Day 1 Quiz | 30 min |
| 7 | Wrap, questions, preview Day 2 | 10 min |

---

### Slide 1 — Welcome to the Team!

You're joining a hyper-local community platform built to help people across the Temecula Valley discover the best local businesses, events, deals, jobs, and guides. We cover Temecula, Murrieta, Menifee, Wildomar, Lake Elsinore, French Valley, and nearby areas.

Here's the heart of it: a huge number of great local businesses are nearly invisible online. Their info is scattered, out of date, or buried under national chains. Meanwhile, the people who live here genuinely want to support local. Top of Temecula closes that gap by giving every local business a clean, accurate, discoverable home base, and by giving residents one trustworthy place to find them.

Your role is simple but genuinely important: **you help local businesses discover, verify, and claim the free profiles we already created for them.** You are the friendly human bridge between a busy owner and a tool that can help them, at no cost and no risk to them.

> **Key Callout:** You are not a pushy salesperson. You don't pressure owners, argue, or hard-close. You represent the brand professionally, explain the free claim clearly, and stay safe.

> **Facilitator:** Open with introductions. Ask each trainee why they wanted this job and one local business they personally love. This anchors the "we're rooting for local" mindset and warms up the room before content.

---

### Slide 2 — Your One-Sentence Mission

If anyone asks what you do, or if you need to ground yourself, memorize this one sentence:

> *"Top of Temecula helps local residents discover local businesses, events, deals, and jobs — and my job is to help businesses claim the free profiles we already created for them."*

Read that out loud once. If you can explain that clearly, you understand the core of the role. Everything else in this training is detail layered on top of that one sentence.

---

### Slide 3 — What Winning Looks Like

A successful shift is not "everyone upgraded." Most owners won't upgrade on the first visit, and that's completely fine. Winning is a combination of clean operations, professionalism, and capturing useful local information:

1. You drove your route and visited every scheduled business on time.
2. You were polite, professional, and made the brand look trustworthy.
3. You got the profile claimed **OR** captured the owner's email so we can send an invite.
4. You logged every visit accurately before leaving the parking lot.
5. You stayed safe and followed all rules.

Notice that three of the five have nothing to do with sales. A shift where you claimed zero profiles but captured ten owner emails, logged everything cleanly, and stayed safe is a **good shift**. The leads compound. We follow up digitally on every email you bring back.

> **Key Callout:** Goal 1: Free Claim. Goal 2: Flag interest in the dashboard/paid upgrades. Goal 3: Collect local notes. A captured owner email counts as a win.

---

### Slide 4 — What You Are Offering

You are not walking in cold asking for money. You are delivering value, for free:

> *"We already created a free starter profile for your business on Top of Temecula. I'm just stopping by with your claim card so you can review it, make sure the information is accurate, and claim it for free."*

Sit with how different that is from a normal sales pitch. You're not asking the owner to buy, sign up, or commit to anything. You're handing them something that already exists, that's theirs, that's free, and that takes under two minutes to control. That framing is your superpower — lead with it every single time.

Claiming is 100% free and unlocks their local marketing command center: the dashboard (covered in depth on Day 2).

> **Key Callout:** Claiming is free. It takes under 2 minutes. No credit card required.

---

### Slide 5 — The Local Ecosystem You'll Be Working In

You'll visit a wide range of businesses, and knowing the lay of the land makes you credible. Across the Temecula Valley you'll find:

- **Food & drink:** restaurants, cafes, breweries, wineries, taquerias.
- **Personal care:** salons, barbers, med spas, nail studios, fitness studios.
- **Trades & auto:** auto repair, HVAC, plumbers, landscapers, contractors.
- **Professional services:** insurance agencies, real estate, accountants, law offices, clinics.
- **Retail & specialty:** boutiques, pet stores, florists, specialty shops.

Most of these are owner-operated or small-team businesses. The owner is often on-site and wearing five hats. That's why your approach is short, respectful of their time, and value-first. You're not interrupting a corporate marketing department — you're talking to someone who is simultaneously running the register, answering the phone, and managing staff.

> **Key Callout:** Every business type benefits from the same free claim and dashboard. Only the *example* you lead with changes (more on that in Day 3, "Adapting Across Business Types").

---

### Slide 6 — Top of Temecula vs. The Giants

Owners will compare us to what they already know. Here is the honest breakdown — never disparage the other platforms, just position us as complementary:

- **Google:** Worldwide and algorithm-driven. We add a curated, local-first discovery channel and show how AI tools view them.
- **Yelp:** Review-heavy and transactional. We show businesses in a warm, community-guide context.
- **Social Media:** Great for temporary posts that disappear in a feed. We provide a lasting, structured local directory profile.
- **Their Own Website:** Great, but customers have to find it first. We help local residents and AI tools discover it.

> **Key Callout:** We never say "leave Google." We say "Google and Yelp are great — we're the local-first layer on top, plus we show you something they don't: how AI recommends you."

---

### Slide 7 — How People Used to Find a Local Business (and What Just Changed)

For 20 years, finding a local business meant one thing: you typed "insurance agent near me" into Google and got a list of ten blue links plus a map. The business that did the most SEO work climbed that list. Whoever ranked highest usually won the customer.

That's still happening — but a second behavior is taking over fast. Instead of *searching* a list, people now *ask* and get a single answer:

- "Hey ChatGPT, who's the best insurance agent in Temecula?"
- "Siri, find me a highly-rated med spa in Murrieta."
- A Google search now opens with an **AI Overview** that answers the question before any blue links appear.

The big shift: **ten choices became one recommendation.** When AI hands the customer a single name, being "on page one" no longer matters as much. Being *the answer* is what matters.

> **Key Callout:** The customer used to pick from a list. Now AI increasingly picks for them. Your job is to get the business into the small set of names AI trusts enough to recommend.

---

### Slide 8 — The New Vocabulary: SEO → AEO → GEO

You don't need to be a marketing expert, but knowing these three terms makes you sound like one, and owners respect that:

- **SEO — Search Engine Optimization.** The old game: ranking your website higher in Google's blue links.
- **AEO — Answer Engine Optimization.** Being the business that voice assistants and AI Overviews name when someone asks a question out loud.
- **GEO — Generative Engine Optimization.** Being the business that generative AI tools — ChatGPT, Gemini, Perplexity — actually recommend and cite inside their answers.

SEO was about *ranking*. AEO and GEO are about *being chosen*. Most local owners have never heard these words. When you explain them simply, you instantly become the most informed person who's walked through their door this year.

> **Key Callout:** SEO = show up in a list. AEO/GEO = be the one answer. That one sentence is enough to teach an owner the whole shift.

---

### Slide 9 — How AI Actually Decides Who to Recommend

This is the part that makes the whole pitch make sense. AI tools don't guess. They recommend businesses they can find clear, consistent, trustworthy information about. They lean on:

- **Consistent business facts everywhere online** — the same name, address, and phone number across every site. (Marketers call this "NAP consistency.") Conflicting info makes AI distrust a business and skip it.
- **Structured data** — information labeled in a format machines can read cleanly (hours, services, category, location). A claimed, complete profile feeds this.
- **Authoritative local sources** — AI weights trusted, location-specific directories and guides. A hyper-local platform that clearly covers the Temecula Valley is exactly the kind of source these tools pull from.
- **Mentions and citations** — the more credible places that reference a business consistently, the more confident AI is recommending it.

An unclaimed, half-blank, possibly-inaccurate profile gives AI almost nothing to work with. A **claimed, accurate, complete** profile on a trusted local platform is a clean, machine-readable signal that says: *this business is real, it's here, and here's what it does.*

> **Key Callout:** AI recommends what it can trust. Claiming a profile turns a vague, unverified business into a clean signal AI can confidently put in front of a customer.

---

### Slide 10 — Why Top of Temecula Is an AEO/GEO Asset (Not Just a Listing)

Tie it together. Claiming a Top of Temecula profile isn't about "another directory." It's about giving the business a strong, structured, local presence in exactly the kind of source AI trusts, *and* a dashboard that shows them how it's working:

- We're a **hyper-local, Temecula Valley-specific** source — the kind of authoritative local signal AI leans on for "near me" answers.
- A claimed profile is **structured and complete** — machine-readable facts AI can pull cleanly.
- The **AI-Citation Tracker** shows the owner, in plain numbers, how often AI tools are recommending and citing them. No other person walking into their shop can show them that.

So the free claim isn't a favor we're asking — it's the owner planting a flag in the new search landscape, for free, in under two minutes.

> **Key Callout:** Claiming = a clean local signal in a source AI trusts, plus a dashboard that proves it's happening. That's the real product.

---

### Slide 11 — Why Now: The Window You're Actually Selling

This is your urgency, and it's honest — no hype required. AI tools are forming their "answers" *right now*, while this is all still new:

- **The defaults are being set today.** As AI learns who the trusted businesses are in each local category, those names become the go-to answer. A business that establishes a clean, claimed, consistent presence early becomes one of those defaults.
- **Early is easier than late.** Once AI has settled on the top few names it recommends for "best auto shop in Temecula," it's much harder for a latecomer to break in. The businesses that show up clearly now get a head start that compounds.
- **Most owners have no idea this is happening.** That's the opportunity. The ones who act while it's early get an advantage; the ones who wait until "everyone's doing it" are already behind.

The honest framing: *This is the early-Google moment for AI search. The businesses that got on Google early owned their categories for years. The same window is open right now for AI — and it's free to step through it today.*

> **Key Callout:** You're not selling fear, you're selling timing. Early movers become the answer. It costs nothing to be early, and it gets harder every month they wait.

---

### Slide 12 — Translating It for a Busy Owner (Jargon → Plain English)

A shop owner doesn't care about acronyms. Your skill is turning this into one or two sentences they feel in their gut. Keep these ready:

- **Instead of "GEO/AEO":** "More and more people don't scroll through a list anymore — they ask ChatGPT or Siri 'who's the best [your business] in Temecula' and get one answer. This makes sure you're in the running to *be* that answer."
- **Instead of "NAP consistency / structured data":** "AI only recommends businesses it has clear, correct info about. Claiming makes sure your info is right so you don't get skipped."
- **Instead of "the urgency":** "This stuff is brand new. The businesses that get set up now are the ones AI will recommend later. It's free to get ahead of it today."
- **The whole thing in one breath:** "Search is becoming AI giving one answer instead of a list. Claiming your free profile helps make sure that answer can be you — and the dashboard shows you how you're doing. Costs nothing, takes a minute."

> **Key Callout:** You know the concepts so you sound credible. You speak in plain English so the owner actually gets it. That combination is what makes you persuasive.

---

### Activity 1A — Platform Safari

**Activity:** Platform Safari
**Time:** 40 min
**Goal:** Every trainee gets comfortable navigating topoftemecula.com so they can speak about it naturally and pull up a profile in the field without fumbling.
**Steps:**
1. On your phone or laptop, open topoftemecula.com. Spend 5 minutes just browsing — categories, events, deals, guides.
2. Find 5 local businesses you know personally. For each, note: Are they listed? Is the profile claimed or unclaimed? Is the info accurate? Do they have photos?
3. Find one *claimed* profile and one *unclaimed* profile and screenshot both. Notice the visible differences.
4. Pull up the public profile of a business as if you were standing next to its owner. Practice saying out loud: "This is your profile, right here on your phone."
5. Share with the group: what surprised you about how many local businesses are unclaimed?

**Done when:** Each trainee can, unprompted, open the site, navigate to a category, and pull up a specific business profile in under 30 seconds.

> **Facilitator:** Walk the room. The goal isn't a worksheet, it's muscle memory. If someone can't find the search or fumbles loading a profile, drill that specific motion until it's smooth. They'll be doing this in front of owners.

---

### Activity 1B — Insurance Agency Audit

**Activity:** Insurance Agency Audit
**Time:** 50 min
**Goal:** Connect the AEO/GEO concepts to a real business by auditing how three actual agencies show up.
**Steps:**
1. Find three real Temecula Valley insurance agencies (Google Maps or online).
2. Look each one up on topoftemecula.com and complete the template below.
3. **Then go further:** open ChatGPT (or Google's AI Overview) and ask, "Who are the best insurance agents in Temecula?" Note whether any of your three agencies appear in the AI's answer. This is the AEO/GEO concept made real.
4. Write one sentence per agency on how claiming + an accurate profile could improve their standing.
5. Present your most interesting finding to the group.

**Template:**
```
Agency 1 Name:
Listed on Top of Temecula? (Yes/No):
Claimed? (Yes/No):
Accuracy Issues Found:
Did AI mention them when asked for "best in Temecula"? (Yes/No):
How claiming would help them:

Agency 2 Name:
...
```

**Done when:** Each trainee has audited 3 agencies and can articulate, using a real example, why a claimed/accurate profile matters for AI recommendations.

> **Facilitator:** The ChatGPT step is the payoff. When a trainee sees that AI named two competitors but not the third agency, the whole "why now" argument lands permanently. Debrief on that moment.

---

### Slide 13 — Active Recall: Day 1 Check

**Prompt:** What is your one-sentence mission?
**Answer:** Top of Temecula helps local residents discover local businesses, events, deals, and jobs — and your job is to help businesses claim the free profiles already created for them.

**Prompt:** What does a successful shift look like? (Name 3 of the 5 goals)
**Answer:** Drove the full route on time; was polite and professional; got a claim OR captured an owner email; logged every visit before leaving the lot; stayed safe.

**Prompt:** How do you position Top of Temecula against Google?
**Answer:** We don't replace Google. We add a hyper-local discovery channel for valley residents, and we show how AI tools recommend them. The free claim ensures their info is accurate and unlocks a free dashboard.

**Prompt:** What's the big shift happening in how people find local businesses?
**Answer:** From searching a list of ten links to asking AI and getting one recommendation. Being "the answer" now matters more than ranking in a list.

**Prompt:** What do SEO, AEO, and GEO mean?
**Answer:** SEO = ranking in search results. AEO = being the business answer engines name. GEO = being recommended and cited by generative AI. SEO is about ranking; AEO/GEO are about being chosen.

**Prompt:** What's the honest "why now" argument?
**Answer:** AI is setting its default recommendations now while it's early. Businesses that establish a clean, claimed presence early become the go-to answer, and it gets harder to break in later. It's the early-Google moment, and it's free.

---

### Day 1 Quiz

**Q1.** What is the primary goal of your field visits?
- A) To sell expensive monthly marketing packages
- B) ✅ To help businesses claim the free profiles already created for them and unlock their dashboard
- C) To convince businesses to stop using Google and Yelp
- D) To take photos of customers inside the business

*Explanation: Your primary goal is getting the free profile claimed. This builds trust, gets them in our ecosystem, and unlocks their free dashboard.*

---

**Q2.** Which communities does Top of Temecula cover?
- A) Only the city of Temecula
- B) All of Southern California
- C) ✅ The entire Temecula Valley (Temecula, Murrieta, Menifee, Wildomar, Lake Elsinore, French Valley, etc.)
- D) San Diego County

*Explanation: Top of Temecula is a regional guide covering the entire Temecula Valley.*

---

**Q3.** A business owner asks: "Why do I need this when I already have Google?" What is the correct response?
- A) "Google is outdated and local businesses are leaving it."
- B) ✅ "We don't replace Google. We add a local discovery channel for valley residents, show you how AI tools recommend you, and the free claim confirms your info is accurate."
- C) "Our platform guarantees you will rank higher on Google search results."
- D) "You have to claim this or your Google listing will be affected."

*Explanation: Always position Top of Temecula as a complementary local channel, never make false guarantees about Google, and focus on the free claim/dashboard.*

---

**Q4.** What is the core change in local search that makes claiming urgent?
- A) Google is shutting down
- B) ✅ People increasingly ask AI for one recommendation instead of choosing from a list of links
- C) Yelp now charges customers to read reviews
- D) Printed phone books are coming back

*Explanation: The shift from "ten choices" to "one AI answer" is why being a clear, trusted, claimed business matters more than ever.*

---

**Q5.** What does GEO (Generative Engine Optimization) refer to?
- A) Mapping a business's GPS coordinates
- B) A paid Google advertising program
- C) ✅ Being recommended and cited by generative AI tools like ChatGPT, Gemini, and Perplexity
- D) Translating a website into other languages

*Explanation: GEO is about being the business generative AI actually names in its answers — the new frontier beyond traditional SEO.*

---

**Q6.** Why does a claimed, accurate profile help a business with AI recommendations?
- A) It secretly pays the AI companies to rank them
- B) ✅ It gives AI clean, consistent, structured information it can trust — and AI recommends businesses it can trust
- C) It deletes the business's competitors from search
- D) It guarantees the #1 spot on Google

*Explanation: AI recommends what it can verify. A claimed, accurate, complete profile is a trustworthy signal; an unclaimed or inaccurate one gets skipped. Never promise guaranteed rankings.*

---

### Day 1 Assignment — Explain the Shift in Your Own Words

Write a short, plain-English explanation (3–4 sentences) you could say to a busy restaurant owner about why AI search matters and why claiming now is smart. No acronyms allowed — imagine the owner has never heard "SEO" in their life. Then write the one-sentence, ten-second version.

**Example (one-sentence):** "More people now ask ChatGPT or Siri 'who's the best taco spot in Temecula' and get one answer instead of a list — claiming your free profile helps make sure that answer can be you, and it takes about a minute."

---

# DAY 2 — The Value: Dashboard, Free Tools & The Upgrade Ladder
**Subtitle:** Learn the real value hook — the AI-citation tracker and the free marketing platform — plus the upgrade ladder you'll walk owners through, and how to present price without pressure.
**Duration:** 4 Hours (Paid)
**Description:** Understand the free local marketing command center every business unlocks, the à la carte tools they get even at $0, the paid upgrade ladder, and how to present it confidently without pressure. Then practice it through hands-on dashboard time, pitch-writing, and objection drills.

### Run-of-Day (Facilitator Pacing)
| Block | Activity | Time |
|---|---|---|
| 1 | The dashboard + AI-citation hook (Slides 1–2) | 35 min |
| 2 | **Activity 2A — Dashboard Walkthrough** (hands-on demo dashboard) | 40 min |
| 3 | The upgrade ladder + how to present it (Slides 3–4) | 35 min |
| — | Break | 15 min |
| 4 | Pricing scripts + Do's and Don'ts (Slides 5–6) | 30 min |
| 5 | **Activity 2B — Write Your Value Pitch** + read-aloud | 45 min |
| 6 | **Drill 2C — Rapid-Fire Pricing Objections** (partner reps) | 30 min |
| 7 | Active Recall + Day 2 Quiz | 30 min |

> **Facilitator — PRICING (read first):** The price numbers in this module live in ONE place: the **Pricing Master Reference** table in Slide 3 (Enhanced $29/mo, Premium Lite $49/mo, Premium $79/mo, Growth Partner $299/mo). Teach the *concepts* and have trainees point owners to the on-screen price rather than quote a number from memory — but you may use the table to answer trainee questions in session. If any tier's price ever changes, update the table in Slide 3 and re-run the curriculum parser; everything else points back to it.

---

### Slide 1 — The Dashboard: The Real Value Hook

Why does an owner actually care about claiming a free profile? Because it unlocks their free local marketing command center: the dashboard.

The absolute biggest hook is the AI-Citation Tracker:

> *"Our dashboard tracks how often AI tools like ChatGPT, Gemini, and Perplexity are recommending and citing your business. That's the new search engine — and our tool shows you if you're showing up."*

Most local business owners have no idea how AI views them. You spent Day 1 learning *why* that matters. The dashboard is the proof: it turns the abstract "AI is recommending businesses now" into a concrete number the owner can see about *their own* business. That's a moment no other rep walking into their shop can deliver.

> **Key Callout:** Lead with the claim and the AI dashboard. It's a modern, high-value tool that's completely free to unlock. It's software — it shows them what AI tools are doing with their business, right on screen.

---

### Slide 2 — The Dashboard Is a Free Marketing Platform (Even at $0)

The dashboard isn't just a place to *look* at an AI score — it's an active local marketing platform the owner gets for free, just by claiming. Once claimed, the owner can:

- Monitor their local presence and AI-citation data.
- Edit their profile details (hours, services, social links, photos).
- Track local visitor traffic and profile views.
- Use **à la carte marketing options with no subscription and no commitment** — they only pay for what they use, one time:
  - **Got an event coming up?** Promote it on our platform.
  - **Want a press release?** Order one and we'll create and syndicate it for them.
  - **Hiring?** Feature their job listings to attract Temecula talent.

> **Key Callout:** This is a huge part of the free pitch. Even if they never upgrade, claiming gives them a real, free marketing toolkit they can use whenever they want, paying only for the à la carte pieces they choose. "Even if you never upgrade, you've got a free marketing platform."

---

### Activity 2A — Dashboard Walkthrough

**Activity:** Dashboard Walkthrough
**Time:** 40 min
**Goal:** Every trainee has personally seen and clicked through the dashboard so they can guide an owner through it with confidence, and so the "wow moment" is real to them.
**Steps:**
1. Using the training/demo login the facilitator provides, log into a claimed business dashboard.
2. Find and open the AI-Citation Tracker. Read what it shows. Practice saying out loud what it means: "This shows how often AI tools are recommending you."
3. Find each à la carte tool (event promotion, press release, featured jobs). Open each one so you know exactly what the owner will see.
4. Find where the owner edits hours, services, and photos.
5. Find where the upgrade options live, so in the field you can say "they're right here" and point.
6. Pair up: one person plays owner, the other walks them through the dashboard in 90 seconds. Swap.

**Done when:** Each trainee can navigate to the AI tracker, name all three à la carte tools, and locate the upgrade screen without help.

> **Facilitator:** This is the most important activity of Day 2. If the demo dashboard shows real citation data, point it out — that's the wow moment they'll recreate in the field. If a trainee has never opened the dashboard before going to the field, they will fumble the highest-value rung. Don't skip this.

---

### Slide 3 — The Upgrade Ladder (The Big Idea, Not the Specs)

You do **not** need to memorize feature lists. When the owner is on the claim/upgrade screen, every deliverable is listed right there in bullets — let them read it for themselves. Your job is the **big-idea difference** between the tiers and the confidence to walk them through it. Specifics or tough questions go to the screen, or to **questions@topoftemecula.com**.

#### Pricing Master Reference (single source of truth — confirm before each cohort)

| Tier | Price | One big idea |
|---|---|---|
| **Free Claim** | $0, no card | Claim and control your profile; unlock the dashboard (AI data + à la carte tools). |
| **Enhanced** | **$29/mo** | Entry paid tier (not actively pitched): stronger presence and visibility on Top of Temecula. |
| **Premium Lite** | **$49/mo** | A lighter Premium for budget-conscious owners who still want more visibility. |
| **Premium** | **$79/mo** | The main upgrade: the most visibility and presence on Top of Temecula. *Steer engaged owners here.* |
| **Growth Partner** | **$299/mo** | A full **done-for-you AEO service** — a dedicated rep growing AI recommendations across the **entire AI landscape, not just Top of Temecula.** |

> **Facilitator:** These are the locked monthly prices. This table is the single source of truth — every price reference in this module points back to it. Trainees should still point owners to the on-screen price rather than quote from memory, but you may use these numbers to answer trainee questions in session.

> **Key Callout:** Enhanced and Premium are about getting the most out of Top of Temecula itself. Growth Partner is a different animal — a real human-run AEO service that works everywhere AI looks, not just on our platform.

---

### Slide 4 — How to Present the Upgrades (Without Being Pushy)

**Premium is always the goal.** When an owner is engaged and the claim is done, present the upgrades confidently and steer toward Premium as the natural next step. Then present Growth Partner for what it is, and let the owner decide between them. Never pressure.

**When is Growth Partner the right fit?** For businesses that are ambitious, have a high customer lifetime value, or already buy expensive marketing services. For a typical small shop, Premium is the right call.

**You never handle the transaction.** Every upgrade happens on the website, on the owner's own device. You walk them to it, explain the big-idea difference, let the screen show the deliverables, and encourage Premium — but the owner completes the purchase themselves. You never take a card, cash, or payment of any kind.

> **Key Callout:** Lead with free. Steer engaged owners to Premium. Present Growth Partner honestly for the right businesses. Let them decide. Never pressure, never handle payment.

---

### Slide 5 — Pricing Scripts

> **Note:** These scripts deliberately avoid stating exact numbers — they point the owner to the on-screen price. This keeps you accurate even if pricing changes, and it's good selling: the screen does the quoting, you do the explaining.

**Label:** If they ask: "How much does this cost?"
**Script:** "The claim and the dashboard are 100% free — no credit card required, and you've got free à la carte marketing tools in there too. If you ever want more visibility, there are optional paid tiers — Premium is the popular one — and the exact pricing's right on the screen. But the free claim is the main thing today, to make sure your info is correct."

**Label:** If an engaged owner asks "What's the upgrade?"
**Script:** "Premium gets you the most visibility and presence on Top of Temecula — it's what most owners go with when they want more. Right here on the screen you can see exactly what's included and the price. There's also a Growth Partner option, which is a full done-for-you service with a dedicated rep growing your AI recommendations across the board — that one's for businesses really leaning into marketing."

**Label:** If they ask for exact features or price of a tier:
**Script:** "It's all listed right here on the screen so you can see exactly what each one includes and costs. If you want a deeper breakdown, you can always email questions@topoftemecula.com and someone will walk you through it."

**Label:** If they want to buy an upgrade:
**Script:** "Awesome — you can grab that right here on the site on your phone. The free claim is done, so you're all set up; just pick the tier on the screen. I'll hang out in case you have any quick questions." *(You never enter payment info or touch their card.)*

---

### Slide 6 — Do's and Don'ts of Product Talk

❌ DON'T Say: "This will guarantee you rank #1 on Google search."
✅ DO Say: "This gives you a dedicated local presence and shows you how AI tools like ChatGPT recommend you."

❌ DON'T Say: "You have to upgrade today or your listing will be deleted."
✅ DO Say: "Upgrades are completely optional. The free claim is yours forever."

❌ DON'T Say: "I need your credit card to activate the free dashboard."
✅ DO Say: "The claim is free and requires no credit card or payment info at all."

❌ DON'T Say: "Premium is seventy-nine a month" (or any number from memory).
✅ DO Say: "The exact price is right here on the screen so you see precisely what it is."

❌ DON'T: Take a card, cash, check, or enter payment info for any upgrade.
✅ DO: Let the owner complete any purchase themselves on the website, on their own device.

❌ DON'T: Make up a feature or a price to answer a tough question.
✅ DO: Point to the deliverables on the screen, or send them to questions@topoftemecula.com.

---

### Activity 2B — Write Your Value Pitch

**Activity:** Write Your Value Pitch
**Time:** 45 min
**Goal:** Each trainee builds a natural, personal version of the pitch in their own words, then practices saying it out loud.
**Steps:**
1. Write a 4–5 sentence pitch for why a local insurance agency should claim its free profile. Work in: the free claim (no credit card), the AI-citation tracker, the free à la carte tools, and a soft mention that Premium exists if they want more visibility. Do **not** state a price — point to the screen.
2. Read it out loud to a partner. The partner scores it against the rubric below.
3. Rewrite it once based on the feedback. The second version should sound more like *you* talking, less like a script.
4. Volunteers read their best version to the group.

**Rubric (partner scores 1 pt each):**
- [ ] Led with the **free claim**, not cost.
- [ ] Hit the **AI-citation hook** and at least one free à la carte tool.
- [ ] No forbidden claims (no Google guarantee, no false partnership, no deletion threat, no price-from-memory).
- [ ] Soft, no-pressure mention of Premium.
- [ ] Sounded natural and human, not robotic.

**Done when:** Each trainee has a written pitch they can deliver from memory and a 4/5+ partner score.

---

### Drill 2C — Rapid-Fire Pricing Objections

**Drill:** Rapid-Fire Pricing Objections
**Time:** 30 min
**How:** In pairs, the "owner" fires one objection; the "ambassador" responds in real time, then they swap. Run through the full list at least twice. The point is reps — getting comfortable answering instantly without freezing. Objections to fire:
- "How much is this?"
- "Is there a catch?"
- "It's too expensive."
- "Let me think about it."
- "I need to ask my partner."
- "What's the upgrade get me?"
- "Why isn't it just free forever?"
- "Can you give me the price right now?" *(correct move: point to the screen, don't quote from memory)*

> **Facilitator:** Listen for two failure modes: (1) quoting a price from memory, and (2) getting defensive. Coach toward "the price is on the screen" and a relaxed, no-pressure tone. Do a few rounds in front of the room first to model it.

---

### Slide 7 — Active Recall: Day 2 Check

**Prompt:** What is the AI-Citation Tracker and why do owners care?
**Answer:** It tracks how often AI tools like ChatGPT, Gemini, and Perplexity are recommending and citing their business. Most owners have no idea how AI views them — this is a unique, high-value free tool, and it's the proof behind everything you taught on Day 1.

**Prompt:** Name two free à la carte marketing tools an owner gets just by claiming.
**Answer:** Any two of: promote an upcoming event, order a syndicated press release, feature their job listings — all pay-as-you-go, no subscription.

**Prompt:** Which paid tier do you steer an engaged owner toward, and what's the one above it?
**Answer:** Premium is the main upgrade you steer toward. Growth Partner is the done-for-you AEO service with a dedicated rep, working across the whole AI landscape — present it for what it is and let them decide.

**Prompt:** How do you answer "how much is it?" correctly?
**Answer:** Lead with "the claim and dashboard are free, no credit card." For paid tiers, point to the price on the screen — never quote a number from memory.

**Prompt:** Do you ever handle the payment for an upgrade?
**Answer:** Never. Every upgrade happens on the website, on the owner's own device. You guide and encourage, but the owner completes the purchase themselves.

---

### Day 2 Quiz

**Q1.** What is the "genius hook" of the free dashboard that owners find most interesting?
- A) It lets them play video games in their browser
- B) ✅ It tracks how often AI tools like ChatGPT, Gemini, and Perplexity are recommending and citing their business
- C) It automatically files their taxes with the state
- D) It replaces their company website entirely

*Explanation: The AI-Citation Tracker is our most unique, high-value free feature. It shows owners how modern AI search engines view their business.*

---

**Q2.** Which paid tier do you steer an engaged, interested owner toward by default?
- A) Enhanced
- B) ✅ Premium
- C) Growth Partner
- D) You never mention any upgrade

*Explanation: Premium is the main goal. Present Growth Partner honestly for ambitious, high-value businesses, but let the owner decide — never pressure.*

---

**Q3.** What does a business get for free, just by claiming, even if they never upgrade?
- A) Nothing until they pay
- B) ✅ Profile control plus the dashboard — a free marketing platform with AI-citation data and pay-as-you-go à la carte tools (event promotion, press releases, featured job listings)
- C) A free company website
- D) A guaranteed #1 Google ranking

*Explanation: The free claim unlocks a real marketing toolkit. Owners only pay for à la carte pieces they choose — no subscription, no commitment.*

---

**Q4.** What is "Growth Partner"?
- A) An automated software setting they toggle on
- B) A cheaper version of the free claim
- C) ✅ A full done-for-you AEO service with a dedicated rep who grows their AI recommendations every month, across the whole AI landscape — not just Top of Temecula
- D) A one-time press release

*Explanation: Growth Partner is human-run, not automated. It includes everything in Premium plus a dedicated rep and reaches beyond Top of Temecula. It's for ambitious, high-lifetime-value businesses.*

---

**Q5.** An owner asks for the exact price of Premium. What's the correct move?
- A) Quote the number you memorized in training
- B) ✅ Point to the price shown right on the screen so they see the exact, current number
- C) Guess a round number so you don't look unsure
- D) Tell them it's whatever they want to pay

*Explanation: Prices can change and can differ from what you remember. The on-screen price is always correct. Pointing to it keeps you accurate and builds trust.*

---

**Q6.** Do you ever collect payment for an upgrade?
- A) Yes, cash only
- B) Yes, you can take their card number and enter it for them
- C) ✅ No — every upgrade happens on the website on the owner's own device; you never handle payment
- D) Only for the Growth Partner tier

*Explanation: You guide and encourage, but the owner always completes the purchase themselves on the website. You never take a card, cash, or payment of any kind.*

---

### Day 2 Assignment — Record Your Dashboard Walkthrough

Record yourself (1–2 minutes, phone is fine) pretending to walk an owner through their dashboard after a successful claim. Show/say: where the AI-citation tracker is and what it means, name the three à la carte tools, and a soft tee-up of Premium that points to the on-screen price. Upload to Google Drive or YouTube (unlisted) and paste the link in the assignment box.

---

# DAY 3 — Field Operations, The Claim, Safety, Mindset & Roleplay
**Subtitle:** Master the outcome ladder, conduct the in-person claim, handle every scenario, stay safe, build the mindset to handle rejection, and prove it through live roleplay.
**Duration:** 4 Hours (Paid)
**Description:** Get fully prepared for the field. Learn the full ladder of outcomes, how to walk an owner through claiming and upgrading on the spot, how to handle every situation you'll meet, strict safety rules, the mindset to stay strong through a day of "no thanks," and how to record and self-assess your pitch. The day is built around practice: a hands-on claim and extended roleplay drills.

### Run-of-Day (Facilitator Pacing)
| Block | Activity | Time |
|---|---|---|
| 1 | Outcome Ladder + the 3 scripts (Slides 1–3) | 35 min |
| 2 | In-person claim walkthrough + recovery (Slides 4–5) | 25 min |
| 3 | **Activity 3A — Hands-On Claim** (real claim on a test listing) | 30 min |
| 4 | Field scenarios + gatekeeper + edge cases (Slides 6–10) | 40 min |
| — | Break | 15 min |
| 5 | Safety, CRM logging, content capture, adapting (Slides 11–14) | 35 min |
| 6 | Field mindset & rejection resilience (Slide 15) | 20 min |
| 7 | **Drill 3B — Live Roleplay Rounds** (paired scenario practice) | 45 min |
| 8 | Active Recall + Day 3 Quiz | 25 min |

---

### Slide 1 — The Outcome Ladder (Your Mental Model)

Every visit, you try to climb as high as you can, and you only step down as reality forces you to. Memorize the ladder — it turns dozens of situations into one simple idea: **always aim for Rung 1; step down only when you have to.**

1. **Full Win** — Owner is present. You walk them through the claim on the spot, and they choose an upgrade (Premium, or Growth Partner). *This is the target.*
2. **Claim + Hot Lead** — Owner present, claim done in person, upgrade-curious but not today. Flag it and set a follow-up.
3. **Clean Claim** — Owner present, claim done in person, free only. Still a win.
4. **Committed Deferral** — Owner present but won't claim right now ("I'll do it later"). Get a verbal commitment, capture their email, leave the card, log it.
5. **Email Invite** — Owner is out; a helpful gatekeeper gives you the owner's email. Send the invite, leave the card, log it.
6. **Card Drop + Intel** — Owner out, gatekeeper won't share an email. Get the owner's name and the best time to return. Leave the card, log it.
7. **Logged Touch** — Hard no, not interested, or unwelcoming. Leave the card if welcome, log it, move on.
8. **Data Correction** — No sale possible (closed, moved, wrong info, duplicate listing, or a franchise with no local authority). Don't pitch — log exactly what you found so we can fix the profile. Accurate data is still a win.

> **Key Callout:** Safety overrides every rung. If anyone is aggressive or makes you uncomfortable, you leave immediately — no matter how high on the ladder you were.

---

### Slide 2 — The Script: Your Field Playbook

Depending on how busy the business is, you will use one of three script lengths. Practice these until they feel natural and conversational:

- **10-Second (Very Busy):** "Hi, I'm [Your Name] with Top of Temecula. We created a free starter profile for your business, and I'm just dropping off your claim card so the owner can review and claim it for free."
- **30-Second (Standard):** "Hi, I'm [Your Name] with Top of Temecula — a local community guide. We already created a free starter profile for your business. I'm stopping by with your claim card so you can scan it, check the info, and claim it free. Takes about a minute and makes sure locals see the right details."
- **Full Pitch (Engaged Owner):** See Slide 3.

> **Key Callout:** Read the room first. A slammed lunch-rush restaurant gets the 10-second version. A quiet insurance office with the owner at the desk gets the full pitch. Matching your length to their availability is a skill — practice all three.

---

### Slide 3 — The Full Pitch & The AI Hook (Script)

**Label:** The Full Pitch Script
**Script:** "Hi, I'm [Your Name] with Top of Temecula. We help valley residents discover local businesses, events, deals, and guides. We already created a free starter profile for your business — this QR card goes straight to it so you can review it and claim it free. Once you claim, you also get a free dashboard that shows how often AI tools like ChatGPT are recommending your business to local searchers, plus free marketing tools you can use whenever you want. No credit card required to claim."

> **Key Callout:** Practice delivering this with a warm, friendly, confident, and low-pressure tone. The words matter less than the energy — relaxed and helpful beats polished and salesy.

---

### Slide 4 — The Ultimate Goal: The In-Person Claim & Upgrade Walkthrough

This is the highest rung and your best possible outcome. When the owner is present and willing, **don't just hand them a card — do the claim with them, right there.**

**Step 1 — Get into the flow together.** Hand them the QR card and have them scan it with their phone camera, or pull it up and lean in shoulder-to-shoulder. The card opens their business profile.

**Step 2 — Walk the claim.** Guide them through the on-screen claim steps — the screen prompts each step, so you just point, encourage, and keep it easy: "Tap there... yep, confirm your info looks right... and that's it." Stay at their shoulder. Answer the easy questions; send anything detailed to the screen or questions@topoftemecula.com.

**Step 3 — Land on the dashboard.** Once it says claimed, they're in their dashboard. Show them the AI-citation data and point out the free à la carte tools (event promotion, press releases, featured jobs). This is the "wow" moment — let them see the value for themselves.

**Step 4 — Tee up the upgrade.** The upgrade options are right there on screen. Walk the big-idea difference: "The free version is yours forever. Premium gets you the most visibility on the platform — most owners who want more go with that, and the price is right here. There's also Growth Partner, a full done-for-you service if you're really pushing growth." Encourage Premium for the typical business; present Growth Partner honestly for the ambitious one. **Let the screen show the deliverables and the price. Let them decide.**

**Step 5 — Hand off the transaction.** If they want to upgrade, they complete it themselves on the website, on their own device. You never touch payment. Then log everything.

> **Key Callout:** Your superpower is being the friendly person at their shoulder who makes a slightly intimidating thing feel easy. Walk it with them — don't just point at a card and leave.

---

### Slide 5 — When the Claim Hits a Snag (Recovery)

Two things go wrong most often. Handle them smoothly:

- **The QR code won't scan.** "No worries — these sometimes need good light. You can also just go to [their profile URL], or I can pull it up for you right here." Don't let a finicky camera kill the claim.
- **The owner gets pulled away mid-claim** (a customer walks in, the phone rings). "Totally fine — want me to send you an email invite so you can finish whenever you have a minute?" Capture the email, leave the card, log it as a hot follow-up. You've stepped down from Rung 1 to Rung 4/5 cleanly instead of losing the visit.

> **Key Callout:** A snag is not a no. Recover to the highest rung still available — finish later by email rather than walking away empty-handed.

---

### Activity 3A — Hands-On Claim

**Activity:** Hands-On Claim (on a test listing)
**Time:** 30 min
**Goal:** Every trainee performs a real, complete claim on a test listing so the first time they ever touch the claim flow is NOT in front of a live owner.
**Steps:**
1. The facilitator provides a test business listing and QR card for each trainee (or a shared set of test listings).
2. Scan the QR card with your phone, exactly as an owner would.
3. Complete the full claim flow end-to-end, reading each screen out loud as you go.
4. Land on the dashboard. Find the AI tracker, the à la carte tools, and the upgrade screen.
5. Pair up: run the claim a second time while *narrating it to your partner as if they're the owner* ("Okay, tap here, confirm your info..."). Swap.
6. Do it a third time solo, smoothly, start to finish.

**Done when:** Each trainee has completed the claim flow at least 3 times and can narrate it confidently while doing it.

> **Facilitator:** This is non-negotiable prep. An ambassador who has never done a claim will freeze or misclick at an owner's shoulder, which kills trust at the highest rung. Watch for the spots where people hesitate and have them repeat those steps. If the test environment isn't ready, build it before running this cohort.

---

### Slide 6 — Field Scenarios (Objection & Situation Cards)

Each card is tagged to a rung on the Outcome Ladder.

**Scenario:** "Is this really free?"
**Rung:** 1–3
**Script:** "Yes, the basic claim is completely free — no credit card required. You even get free marketing tools in the dashboard. There are optional paid tiers if you ever want more visibility, but the claim and dashboard are free."

**Scenario:** "Is this a scam? / Who are you really with?"
**Rung:** Cross-cutting
**Script:** "Totally fair to ask. I'm [Your Name], a local ambassador with Top of Temecula — we're a Temecula Valley business guide. Your profile is already live; you can pull it up on your phone right now, and claiming it is free. Anything you want to verify, you can email questions@topoftemecula.com."

**Scenario:** "Are you on commission? / What's your cut?"
**Rung:** Cross-cutting
**Script:** "I'm a local ambassador — I'm just here to help businesses claim their free profile and see the dashboard. The claim costs you nothing either way."

**Scenario:** "We already have Google / Yelp."
**Rung:** 1–3
**Script:** "That's great — we don't replace Google. We add a hyper-local discovery channel for Temecula Valley residents, and our dashboard shows you how often AI search tools recommend you. The claim just ensures your local info is accurate."

**Scenario:** "I'll do it later."
**Rung:** 4
**Script:** "Totally understand — it honestly takes about a minute, want to knock it out now while I'm here so it's done? ... No problem at all — what's the best email for you? I'll have a claim invite sent so you can finish whenever, and I'll leave this card too." *(Get the commitment, then the email, then leave the card. Log it.)*

**Scenario:** "It's too expensive." (upgrade)
**Rung:** 1–2
**Script:** "No pressure at all — the free claim and dashboard are yours regardless, and those free à la carte tools mean you only ever pay for what you actually use. Premium is just there if you ever want more visibility down the road."

**Scenario:** "Let me think about it." (upgrade)
**Rung:** 2
**Script:** "Of course. The free claim is yours now either way. The upgrade options live right in your dashboard whenever you're ready — no rush at all."

**Scenario:** "I need to ask my partner." (upgrade)
**Rung:** 2
**Script:** "Makes sense. Let's get the free claim done now so you control the profile, and you two can look at the upgrade options together in the dashboard anytime."

**Scenario:** "We already claimed it."
**Rung:** Cross-cutting
**Script:** "That's great — you're ahead of the game! Mind if I make sure the info's accurate while I'm here? And have you checked out the AI-citation dashboard yet? Happy to point you to it." *(Verify info, add value, log it.)*

**Scenario:** "Take my business off your site entirely."
**Rung:** 8 (data correction)
**Script:** "Absolutely, I can pass that along — no problem at all. So I get it to the right person, can I note your business name and your name? You can also email questions@topoftemecula.com directly. Sorry to have caught you at a busy time." *(Never argue. Log it as a removal request so the team can handle it. Do not keep pitching.)*

**Scenario:** Employee *wants* to claim but isn't the owner.
**Rung:** 4–5
**Script:** "Love the enthusiasm! The claim is tied to the owner since it's their business profile and dashboard — so the cleanest path is an invite straight to them. What's the owner's best email? I'll leave this card with you too so you can give them a heads-up." *(Don't let a non-owner claim it. Capture the owner email instead.)*

**Scenario:** Owner is hostile because a different "marketing" company scammed them before.
**Rung:** 1–3 or 7
**Script:** "I totally get it — there's a lot of junk out there, so being skeptical is smart. This is different: it's free, there's no card, and your profile is already live — you can pull it up right now and see for yourself. No commitment at all. And if you'd rather just verify us first, questions@topoftemecula.com is the place." *(If they stay hostile, drop to Rung 7: leave the card, log it, exit politely.)*

**Scenario:** Owner tries to hand you cash or a card for an upgrade.
**Rung:** 1–2
**Script:** "I appreciate that, but I never handle any payment — it keeps everything secure for you. You complete it right here on your own phone in about a minute, and I'll stand by if you have any questions." *(Never accept cash, check, or card. Ever.)*

**Scenario:** "The owner is not here."
**Rung:** 5–6
**Script:** "No problem! Would it help if we emailed the owner an invitation to claim their free profile? If you have their best email, we can send the invite directly. I'll leave this card for them too." *(If no email: get the owner's name and best time to return, leave the card, log both.)*

**Scenario:** "We are not interested."
**Rung:** 7
**Script:** "No problem at all! I'll leave the card in case you want to review the free profile later. Have a wonderful day!" *(Then exit politely — never argue.)*

**Scenario:** Language barrier.
**Rung:** Any
**Script:** Keep it simple and visual — smile, show the card and QR, point to the business name on the profile, and offer the email invite. If you can't communicate the claim, leave the card, capture an email if possible, and log it for follow-up.

---

### Slide 7 — The Gatekeeper Playbook

The most common situation you will face: the owner is NOT there. A front-desk employee, receptionist, or manager greets you instead. This is the Gatekeeper.

Your goal shifts: win the gatekeeper's trust so they help you get the owner's email (Rung 5). If they won't share it, get the owner's name and best time to return (Rung 6).

Key mindset: the gatekeeper is not your obstacle — they are your ally. Make it easy and appealing for them to help you.

The email-invite play: "No problem! Would it be okay if we sent the owner a direct email invitation to claim their free profile? It's a quick link they can review on their own time — no commitment. What's the best email to reach them?"

> **Key Callout:** Capturing a valid owner email is a high-value lead. Treat it like a claim win. If you can't get the email, getting the owner's name and best visit time is still a real win — log it so we can plan a smart return.

---

### Slide 8 — Gatekeeper Scripts

**Label:** Opening to a gatekeeper
**Script:** "Hi! I'm [Your Name] with Top of Temecula. We created a free local profile for this business and I'm stopping by to make sure the owner knows about it. Is the owner or manager available today?"

**Label:** If they say the owner is out
**Script:** "No problem! Could I get the owner's best email so we can send them a direct invitation to claim their free profile? It's a quick link — no commitment, completely free. It would be a great thing for them to see."

**Label:** If they're hesitant to share the email (Rung 6)
**Script:** "Totally understand — I'll leave this claim card for them too. Who's the best person to ask for, and when's usually a good time to catch them? I'd love to swing back and walk them through it." *(Log the name and best time.)*

---

### Slide 9 — Edge Cases & Data Correction (Rung 8)

Sometimes there's no sale to be made — and that's still useful. If the business is **closed, has moved, is under new ownership, has wrong info on the profile, is a duplicate listing, or is a franchise where the local staff has no authority to claim** — don't pitch. Instead, log exactly what you found so we can correct the profile.

> **Key Callout:** Accurate data is a real win. A correction keeps our directory trustworthy, which is the whole point. Log it clearly and move on.

---

### Slide 10 — When You Don't Know the Answer

You will get questions you can't answer. That's expected, and there's one right move every time: **defer — never improvise.**

- "Great question — the full details are right here on the screen so you can see exactly what's included."
- "I want to make sure you get the exact right answer, so I'd point you to questions@topoftemecula.com — they'll walk you through it."
- "Let me flag that for my supervisor and we'll follow up with you."

> **Key Callout:** Making up a feature, a price, or a promise to fill a silence is the one thing that can get you and the brand in trouble. A confident "here's where to get the exact answer" is always better than a guess.

---

### Slide 11 — Safety & Compliance (Non-Negotiable)

Your safety is 100x more important than any business claim. Follow these rules strictly:

1. **Driving:** You are authorized to drive your personal vehicle between routes. Obey all traffic laws. NO PHONE USE while moving. Pull over safely to check routes or log visits.
2. **Public Storefronts Only:** Only enter public commercial spaces during regular business hours. Never enter private homes, warehouses, back rooms, or employee-only areas.
3. **Respect "No Soliciting" and requests to leave.** If a business posts a "No Soliciting" sign or anyone asks you to leave, you leave immediately and politely. Log it and move on. This protects you legally and protects the brand.
4. **No Cash/Checks/Payment:** Never accept cash, checks, or write down credit card numbers, and never enter payment for an upgrade. All upgrades happen securely online, completed by the owner themselves.
5. **Handle owner emails respectfully.** When you capture an owner's email, it's only for sending the claim invite. Don't collect more than you need, and never share it outside the CRM.
6. **Location Sharing:** Share your live location with your supervisor at the start of every shift and check out at the end.

> **Key Callout:** If anyone is rude, aggressive, or makes you uncomfortable, leave immediately. No questions asked. Call your supervisor. This overrides every rung of the Outcome Ladder.

---

### Slide 12 — CRM Logging: If It Isn't Logged, It Didn't Happen

Log every visit before you leave the parking lot. Capture: business name, category, address, date/time, who you spoke to and their role, **which rung you reached (1–8)**, owner available?, **owner email captured for invite?**, **owner name + best time to return?**, card left?, claimed on-site?, **upgrade interest (none / Premium / Growth Partner / follow-up)?**, content captured?, and a specific note.

✅ Good CRM Note: "Rung 2. Owner Mike claimed on-site, walked the dashboard, loved the AI tracker. Curious about Premium but wants to check budget — follow up Friday. Left card."

✅ Good CRM Note: "Rung 5. Owner out. Spoke with Sarah (front desk). Got owner email (mike@valleyins.com) for claim invite. Left card. Sarah says owner is in mornings."

❌ Useless CRM Note: "Went there. Talked to someone. Busy."

> **Key Callout:** Log immediately, before you drive off. Notes written from memory at the end of the day are vague and useless. Fresh notes are what make your leads worth following up.

---

### Slide 13 — Content Capture Checklist

✅ Film Vertically: Hold your phone portrait (vertical) for all clips. Horizontal video is not usable for our social platforms.
✅ Good Natural Light: Stand near a window or outside. Avoid dark rooms, harsh overhead lighting, or shooting into the sun.
✅ Steady Shot: Hold the phone with both hands or prop it against something stable. Shaky footage is unusable.
✅ 5-10 Seconds Per Clip: Short, focused clips are ideal. Capture one subject per clip — a storefront sign, a product display, a team member (with permission).
✅ Always Get Permission First: Before filming inside a business, ask the owner or manager: "Would it be okay if I captured a quick clip of your storefront for our local guide?"
❌ NEVER Film: Customers, payment areas, registers, employee-only areas, or anyone who hasn't given permission. This is a hard rule.
✅ Log It: Note in your CRM that you captured content and what you filmed. Your supervisor reviews all content before it goes live.

> **Key Callout:** Content capture is optional and only happens when the owner enthusiastically agrees. When in doubt, skip it and focus on the claim.

---

### Slide 14 — Adapting Across Business Types

Your training examples use insurance agencies, but your route may include restaurants, salons, auto shops, med spas, and more. The pitch is the same — only the *example* you reach for changes:

- **Restaurants/cafes:** Lead with events and visibility; "feature your happy hour or live music event, and show up when locals ask AI for the best food nearby."
- **Salons/med spas:** Lead with visibility and discovery; "show up when locals ask AI for the best spa nearby."
- **Auto/trades:** Lead with trust and accurate info; "make sure your hours and services are right when someone's in a pinch and asking around."
- **Any business hiring:** Lead with featured job listings to reach Temecula talent.

> **Key Callout:** Same ladder, same claim, same dashboard. Just pick the one free benefit that lands hardest for *that* type of business as your opener.

---

### Slide 15 — Field Mindset: Handling Rejection Like a Pro

Here's the truth no one tells new ambassadors: **most visits will not end in an on-the-spot claim, and that is completely normal.** You'll hear "not interested," "I'm busy," and "leave it with me" all day long. The ambassadors who succeed aren't the ones who never get rejected — they're the ones who don't let rejection rattle them.

A few things to internalize:

- **A "no" is almost never about you.** The owner is busy, distracted, or has been burned before. You caught them mid-task. It's circumstance, not a verdict on you.
- **The math is on your side.** If even a handful of visits per route turn into a claim or a captured email, you're winning. A day of mostly "no's" with a few solid leads is a *good* day. Remember Day 1: three of the five marks of a winning shift have nothing to do with closing.
- **Reset between stops.** Before you walk into the next business, take a breath and let the last visit go. Each owner deserves your fresh, warm energy — not the residue of the last rejection.
- **Protect your tone.** Rejection makes people get clipped or defensive. Don't. Your polite, friendly exit on a "no" protects the brand and sometimes turns into a "you know what, actually..." as you're leaving.
- **Track wins that aren't sales.** Logged a clean data correction? Captured an owner email? Made someone smile? Those count. Celebrate them.

> **Key Callout:** You will hear "no" far more than "yes." That's the job, not a sign you're bad at it. Stay warm, reset between stops, and measure your day by leads and clean operations — not just claims.

> **Facilitator:** Be honest with the room about the hit rate so the first hard shift doesn't break their confidence. Ask: "If you knock on 20 doors and 3 say yes, did you fail?" Get them to the answer: no — that's a strong day. Normalize the no.

---

### Drill 3B — Live Roleplay Rounds

**Drill:** Live Roleplay Rounds
**Time:** 45 min
**How:** Pairs take turns as ambassador and owner. The facilitator hands the "owner" a scenario card from Slide 6 (or a curveball). The "ambassador" runs the visit start to finish: open, pitch, handle the objection, climb or step down the ladder, close, and state out loud what they'd log. Then swap. Run at least 6 rounds so everyone plays both roles multiple times across varied scenarios.

**Rotate these scenarios:** engaged owner (full win), "we already have Google," "I'll do it later," gatekeeper/owner-out, "is this a scam," hostile prior-scam owner, "take me off your site," QR won't scan, language barrier, employee-wants-to-claim.

**After each round, the "owner" gives 30 seconds of feedback:**
- Did they lead with *free*?
- Did the tone feel warm and low-pressure?
- Did they recover to the highest rung available?
- Did they avoid any forbidden claim or price-from-memory?

> **Facilitator:** This is the heart of Day 3 — reps build the reflexes that reading can't. Circulate, jump in to coach, and model a round or two yourself first. Toss in curveballs once pairs get comfortable. Aim for everyone to handle at least one scenario that genuinely catches them off guard, then debrief how they recovered.

---

### Slide 16 — Active Recall: Day 3 Check

**Prompt:** What is the Outcome Ladder, and what is Rung 1?
**Answer:** It's the best-to-fallback list of visit outcomes. Rung 1 is the Full Win: the owner is present, you walk them through the claim on the spot, and they choose an upgrade. Always aim for Rung 1; step down only as reality forces you.

**Prompt:** What are the five steps of the in-person claim & upgrade walkthrough?
**Answer:** Get into the flow together (scan/lean in), walk the on-screen claim steps, land on the dashboard and show the value, tee up the upgrade (steer to Premium, present Growth Partner), and hand off the transaction to the owner on the website.

**Prompt:** The QR won't scan or the owner gets pulled away mid-claim. What do you do?
**Answer:** Recover to the highest rung still available. For the QR: use the profile URL or pull it up yourself. If they're pulled away: offer to email an invite so they finish later, capture the email, leave the card, log it.

**Prompt:** An owner tries to hand you cash for an upgrade. What do you do?
**Answer:** Never accept it. Explain you don't handle payment for their security, and have them complete it on their own phone in a minute while you stand by.

**Prompt:** What's the strict rule about phone use while driving?
**Answer:** Zero phone use while moving. Pull over safely to check routes, text, or log visits. No exceptions.

**Prompt:** A business owner is aggressive or tells you to leave. What do you do?
**Answer:** Leave immediately. No arguing, no second pitch. Walk safely to your car and call your supervisor. Safety overrides every rung.

**Prompt:** You knock on 20 doors and 17 say no. Was it a bad shift?
**Answer:** Not necessarily. If you captured leads/emails, logged cleanly, stayed professional, and stayed safe, that's a winning shift. Most visits won't close, and that's normal.

---

### Day 3 Quiz

**Q1.** What should you do if the owner is not available when you visit?
- A) Leave immediately without speaking to anyone
- B) ✅ Ask for their best email to send a direct claim invitation, leave the physical claim card, and log the visit
- C) Wait in the lobby until they return
- D) Try to guess their password and claim it for them

*Explanation: The email-invite play is incredibly powerful. Capturing a valid owner email is a high-value lead that lets us follow up digitally.*

---

**Q2.** What is the strict rule regarding phone use while driving between routes?
- A) You can log visits while driving slowly
- B) You can text your supervisor while stopped at red lights
- C) ✅ Zero phone use while moving. You must pull over safely to check routes, text, or log visits.
- D) Only use voice-to-text while driving

*Explanation: Safety is non-negotiable. Absolutely zero phone interaction is permitted while the vehicle is in motion.*

---

**Q3.** What should you do if a business owner is aggressive, rude, or makes you feel uncomfortable?
- A) Argue back and defend the brand
- B) Stay and try to convince them to claim anyway
- C) ✅ Leave the premises immediately, walk safely to your car, and call your supervisor
- D) Record them on your phone without permission

*Explanation: Your safety is the absolute priority. Exit immediately and escalate to your supervisor. Never argue or escalate a conflict.*

---

**Q4.** What is the ultimate goal (Rung 1) when an owner is present and willing?
- A) Hand them a card and leave quickly
- B) ✅ Walk them through the claim on the spot, show them the dashboard, and present the upgrade — steering toward Premium
- C) Sign them up for Growth Partner whether they want it or not
- D) Collect their credit card for the upgrade

*Explanation: The best outcome is conducting the claim in person, showing the value live, and teeing up Premium — letting the owner decide and complete any purchase themselves.*

---

**Q5.** During an in-person upgrade, who completes the purchase?
- A) You enter their card for them to save time
- B) ✅ The owner completes it themselves on the website, on their own device — you never handle payment
- C) You collect cash and submit it later
- D) Your supervisor calls them for the card number on the spot

*Explanation: You guide and encourage, but every transaction happens on the website, completed by the owner. You never take payment of any kind.*

---

**Q6.** An interested owner says "I'll do it later." What's the best move?
- A) Insist they do it now or leave
- B) Just drop a card and walk away
- C) ✅ Encourage doing it now since it's quick; if not, capture their email for a claim invite, leave the card, and log it
- D) Mark them as not interested

*Explanation: That's Rung 4 — a committed deferral. Get the commitment, capture the email so we can follow up, and leave the card as backup.*

---

**Q7.** The owner's QR code won't scan. What do you do?
- A) Give up and mark the visit as failed
- B) ✅ Use the profile URL or pull the profile up yourself, then continue the claim
- C) Tell them their phone is broken
- D) Reschedule for another day

*Explanation: A snag is not a no. Recover smoothly so a finicky camera doesn't cost you the claim.*

---

**Q8.** An owner is hostile because a different marketing company scammed them before. What's the best approach?
- A) Argue that you're not like the others and push harder
- B) ✅ Acknowledge their skepticism, point out it's free with no card and their profile is already live to verify, and offer questions@ — and if they stay hostile, leave the card and exit politely
- C) Get offended and leave without a word
- D) Tell them their last company was stupid

*Explanation: Validate the skepticism, lower the stakes (free, no card, verifiable), and never get defensive. If they remain hostile, drop to a logged touch and move on.*

---

**Q9.** You knock on many doors and most say no. How should you read your shift?
- A) It was a failure; only claims count
- B) ✅ If you captured leads/emails, logged cleanly, stayed professional, and stayed safe, it was a winning shift — most visits won't close, and that's normal
- C) You should quit the route early
- D) You should start pressuring owners harder

*Explanation: Rejection is the norm, not a verdict on you. Measure your day by leads and clean operations, not just on-the-spot claims.*

---

### Day 3 Assignment — Roleplay Recording (with Self-Assessment Rubric)

Record a short audio or video clip (1–2 minutes) of yourself delivering the full pitch as if you just walked into a local insurance agency.

**Include:**
1. Intro
2. Free Claim & AI Dashboard Pitch (mention a free à la carte tool)
3. Response to "Is this really free?" or "We already have Google"
4. A soft tee-up of the Premium upgrade (point to on-screen price, don't quote from memory)
5. Polite Close

Upload to Google Drive or YouTube (unlisted) and paste the link in the assignment box.

**Score yourself honestly (1 point each — aim for 5/5):**
- [ ] I led with the **free claim**, not the cost.
- [ ] I hit the **dashboard / AI-citation hook** and at least one free à la carte tool.
- [ ] I handled the **objection without any forbidden claim** (no Google-ranking guarantee, no false partnership, no deletion threat, no credit-card-for-free-claim, no price-from-memory).
- [ ] I **teed up Premium** confidently without pressuring, and made clear the owner decides.
- [ ] I had a **clean, friendly close** and stayed low-pressure throughout.

---

## FINAL READINESS TEST

> **Developer note:** This is a question **bank**. On each attempt, randomly pull 12 questions from this bank and randomize the order of the answer options. A score of **12/12 is required to pass** and unlock the Field Readiness Certificate. On a retake, re-pull a fresh random set so the trainee is tested on *recall and judgment*, not on memorizing the order of a fixed test.

**F1.** What is Top of Temecula?
- A) A national search engine competing with Google
- B) ✅ A hyper-local discovery platform and guide for the Temecula Valley helping residents find local businesses, events, deals, and jobs
- C) A social media app for teenagers
- D) A software company that sells AI models

*Explanation: Top of Temecula is a hyper-local community guide and discovery platform.*

---

**F2.** What is the main goal of a field visit?
- A) To collect cash payments for advertising
- B) ✅ To help the business claim their free profile, unlock their dashboard, or capture their email for a digital invite
- C) To audit their physical building for safety compliance
- D) To convince them to delete their Yelp profile

*Explanation: The free claim and dashboard unlock is your primary mission. Capturing an email is your primary backup.*

---

**F3.** Is the basic profile claim really free?
- A) ✅ Yes, 100% free with no credit card or payment info required
- B) Free for the first 7 days, then we charge them automatically
- C) Only free if they agree to buy a press release
- D) No, it costs $5

*Explanation: The basic claim is completely free forever and requires no credit card. This is a key trust-builder.*

---

**F4.** What is the "AI-Citation Tracker" in the dashboard?
- A) A tool that writes automated reviews for the business
- B) ✅ A feature that tracks how often AI search engines like ChatGPT, Gemini, and Perplexity are recommending and citing their business
- C) A tool that posts automatically to their Instagram account
- D) An AI chat bot that answers their phone calls

*Explanation: It tracks how modern AI search tools cite and recommend their business, giving them unique visibility.*

---

**F5.** What should you say if an owner says, "We already have Google"?
- A) "Google is blocking local businesses, so you need to switch to us."
- B) ✅ "We don't replace Google. We add a local-first channel for valley residents, and our dashboard shows you how often AI tools recommend you. The free claim just ensures your info is accurate."
- C) "Our platform is owned by Google, so they work together."
- D) "Google is going out of business soon anyway."

*Explanation: Always position Top of Temecula as a complementary local channel, never make false claims or disparage other platforms.*

---

**F6.** What is the "email-invite play" when the owner or manager is not available?
- A) Leave immediately without saying anything
- B) ✅ Ask the front desk for the owner's best email so we can send a direct digital claim invite, leave the physical card, and log the visit
- C) Call the business repeatedly until they answer
- D) Sign up the business using a fake email address

*Explanation: Capturing the owner's email is a highly valuable lead that lets us follow up with a direct digital invitation.*

---

**F7.** Which of the following is a strict "NEVER SAY" rule?
- A) "This is free to claim."
- B) ✅ "We are officially partnered with Google/Yelp/the City/the Chamber."
- C) "The free dashboard tracks ChatGPT recommendations."
- D) "There are optional paid services if you want extra visibility."

*Explanation: Never claim false partnerships. It destroys brand credibility and carries legal liability.*

---

**F8.** When must a field visit be logged in the CRM?
- A) At the end of the week
- B) Only if the business successfully claimed their profile
- C) ✅ Before you leave the parking lot of that business — immediately after the visit
- D) Only if the owner was rude

*Explanation: Logging immediately before leaving the lot ensures your notes are fresh, accurate, and no visits are forgotten.*

---

**F9.** What is the safe driving policy while on company time?
- A) You can look at your route sheet while driving if you are careful
- B) ✅ Absolutely zero phone use while moving. You must pull over safely to check routes, text, or log visits.
- C) You can text your supervisor if you are stopped at a red light
- D) Only use phone mounts

*Explanation: Safety is absolute. No phone interaction is permitted while the vehicle is in motion under any circumstances.*

---

**F10.** What are the paid upgrade tiers above the free claim?
- A) There is only one $10/month tier
- B) ✅ Enhanced, Premium, and Growth Partner — the basic claim is always free, and exact prices are shown on the screen during claiming
- C) A single $500 one-time fee
- D) There are no paid tiers

*Explanation: The free claim is $0. The paid tiers are Enhanced, Premium, and Growth Partner. Always let the on-screen price show the exact, current number rather than quoting from memory.*

---

**F11.** When an owner is present and willing, what is the ideal outcome (Rung 1)?
- A) Leave a card and move to the next stop
- B) ✅ Walk them through the claim in person, show them the dashboard, and tee up the Premium upgrade — letting them decide
- C) Force them onto Growth Partner
- D) Take their phone and claim it for them while they work

*Explanation: The Full Win is conducting the claim on the spot, showing live value, and steering toward Premium without pressure.*

---

**F12.** Which paid tier do you steer an engaged owner toward by default?
- A) Enhanced
- B) ✅ Premium
- C) Growth Partner
- D) You never mention any upgrade

*Explanation: Premium is the main goal. Growth Partner is presented honestly for ambitious, high-value businesses, but the owner decides.*

---

**F13.** What is "Growth Partner"?
- A) A cheaper version of the free claim
- B) ✅ A full done-for-you AEO service with a dedicated rep who grows the business's AI recommendations every month, across the whole AI landscape — not just Top of Temecula
- C) An automated toggle in the dashboard
- D) A one-time event promotion

*Explanation: Growth Partner is human-run and reaches beyond our platform. It includes everything in Premium plus a dedicated rep.*

---

**F14.** During an in-person upgrade, who completes the purchase?
- A) You enter their card to be helpful
- B) ✅ The owner completes it themselves on the website, on their own device — you never handle payment
- C) You collect cash and submit it later
- D) The gatekeeper handles it

*Explanation: Every transaction happens on the website, completed by the owner. You guide and encourage but never take payment of any kind.*

---

**F15.** What does a business get for free, just by claiming, even if they never upgrade?
- A) Nothing until they pay
- B) ✅ Profile control plus the dashboard — a free marketing platform with AI-citation data and pay-as-you-go à la carte tools (event promotion, press releases, featured job listings)
- C) A guaranteed #1 Google ranking
- D) A free company website

*Explanation: The free claim unlocks a real marketing toolkit. Owners only pay for à la carte pieces they choose — no subscription, no commitment.*

---

**F16.** An interested owner says "I'll do it later." What's the best move?
- A) Insist they do it now or leave
- B) ✅ Encourage doing it now since it's quick; if not, capture their email for a claim invite, leave the card, and log it
- C) Mark them as not interested and move on
- D) Just leave a card without saying anything

*Explanation: That's a committed deferral (Rung 4) — get the commitment, capture the email, leave the card as backup.*

---

**F17.** The owner's QR code won't scan during the claim. What do you do?
- A) Give up and mark the visit failed
- B) ✅ Use the profile URL or pull the profile up yourself, then continue the claim
- C) Tell them their phone is broken
- D) Reschedule for next week

*Explanation: A snag is not a no. Recover smoothly so a finicky camera doesn't cost you the claim.*

---

**F18.** An owner asks, "Is this a scam? Who are you really with?" What's the best response?
- A) Get defensive and insist you're legitimate
- B) ✅ Stay calm: introduce yourself as a local Top of Temecula ambassador, point out their profile is already live and free to claim, and offer questions@topoftemecula.com to verify
- C) Walk away immediately
- D) Tell them you're with Google

*Explanation: A calm, transparent answer plus an easy way to verify builds trust. Never claim a false affiliation.*

---

**F19.** You get a question you don't know the answer to. What do you do?
- A) Make up a reasonable-sounding answer
- B) Guess at a price so you don't look unsure
- C) ✅ Defer — point to the deliverables on the screen, send them to questions@topoftemecula.com, or flag it for your supervisor
- D) Promise a feature and hope it exists

*Explanation: Never improvise a feature, price, or promise. Deferring to the screen or questions@ is always the right move.*

---

**F20.** You arrive and the business is closed/moved, or the listing info is clearly wrong. What do you do?
- A) Pitch the empty storefront anyway
- B) ✅ Don't pitch — log exactly what you found (closed, moved, wrong info, duplicate, etc.) so we can correct the profile
- C) Skip it and log nothing
- D) Mark it as a successful claim

*Explanation: That's a data correction (Rung 8). Accurate data keeps the directory trustworthy — logging the correction is still a real win.*

---

**F21.** What is the big shift in local search that the whole job is built around?
- A) People are switching from iPhones to Android
- B) ✅ People increasingly ask AI for a single recommendation instead of choosing from a list of search results
- C) Local newspapers are coming back
- D) Google is deleting all small-business listings

*Explanation: The move from "a list of ten links" to "one AI answer" is why a clean, claimed, trusted profile matters more than ever.*

---

**F22.** What does GEO (Generative Engine Optimization) mean?
- A) Tracking a business's GPS location
- B) ✅ Being recommended and cited by generative AI tools like ChatGPT, Gemini, and Perplexity
- C) A paid ad program on Google Maps
- D) Geo-fencing customers with notifications

*Explanation: GEO is about being the business that generative AI names in its answers — beyond traditional search ranking.*

---

**F23.** Why does claiming an accurate profile help with AI recommendations?
- A) It pays the AI companies to feature them
- B) ✅ It gives AI clean, consistent, structured info it can trust, and AI recommends businesses it can trust
- C) It removes their competitors from AI answers
- D) It guarantees a #1 ranking

*Explanation: AI recommends what it can verify. A claimed, accurate, complete profile is a trustworthy signal; vague or inconsistent info gets skipped. Never promise guaranteed results.*

---

**F24.** What is the honest "why now" urgency you give an owner?
- A) "Claim today or we delete your listing."
- B) "Pay us and AI will rank you #1 this month."
- C) ✅ "AI is setting its default recommendations now while it's early — getting in early helps you become the answer, and it's free to do today."
- D) "Everyone else already signed up, so you have to."

*Explanation: The urgency is real and honest: it's about timing and being early, never fear, false scarcity, or guaranteed results.*

---

**F25.** An owner tries to hand you cash to pay for an upgrade. What do you do?
- A) Accept it and pass it to your supervisor
- B) ✅ Politely decline — you never handle payment — and have them complete it themselves on their own phone while you stand by
- C) Take a photo of their card instead
- D) Tell them upgrades aren't available

*Explanation: You never accept cash, check, or card under any circumstances. The owner always completes payment themselves on the website.*

---

**F26.** A business posts a "No Soliciting" sign or someone asks you to leave. What do you do?
- A) Explain that you're not technically soliciting and continue
- B) ✅ Leave immediately and politely, then log it and move on
- C) Wait outside until they change their mind
- D) Slide a card under the door and hide

*Explanation: Respect "No Soliciting" signs and any request to leave. It protects you legally and protects the brand. Leave politely and log it.*

---

**F27.** Most of your visits on a shift end in "no thanks." How should you think about that?
- A) You're failing and should change careers
- B) ✅ It's completely normal — measure your shift by leads captured, clean logging, professionalism, and safety, not just on-the-spot claims
- C) You should start pressuring owners to close more
- D) You should stop logging the no's

*Explanation: Rejection is the job, not a verdict on you. A day of mostly no's with solid leads and clean operations is a winning shift.*

---

<!--
SHIFT 1 DEBRIEF is NOT generated from this file.
It is a post-field reflection form defined in client/src/pages/Home.tsx
(see handleShift1Submit / shift1DebriefAnswers). Edit it there, not here.
-->

---

*End of Curriculum — v4.0*
