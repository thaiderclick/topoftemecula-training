export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Module {
  id: string;
  day: number;
  title: string;
  subtitle: string;
  description: string;
  duration: string;
  slides: {
    title: string;
    content?: string[];
    highlight?: string;
    type?: 'text' | 'script' | 'objection' | 'dosdonts' | 'recall' | 'ladder' | 'scenario';
    scripts?: { label: string; text: string }[];
    items?: { label: string; text: string; bad?: boolean; rung?: string }[];
    recallPrompts?: { prompt: string; answer: string }[];
    ladderRungs?: { rung: number; title: string; description: string }[];
  }[];
  quiz: Question[];
  assignment: {
    title: string;
    description: string;
    placeholder: string;
    type: 'text' | 'upload' | 'roleplay';
    rubric?: string[];
  };
}

export const trainingModules: Module[] = [
  // ─── DAY 1 ───────────────────────────────────────────────────────────────────
  {
    id: 'day1',
    day: 1,
    title: 'The Platform & Local Ecosystem',
    subtitle: 'Understand the mission, what we offer, and how we compare to the tech giants.',
    description: 'Learn the core value proposition of Top of Temecula, hands-on platform exploration, and how to represent the brand professionally.',
    duration: '4 Hours (Paid)',
    slides: [
      {
        title: 'Welcome to the Team!',
        content: [
          "You're joining a hyper-local community platform built to help people across the Temecula Valley discover the best local businesses, events, deals, jobs, and guides.",
          "We cover Temecula, Murrieta, Menifee, Wildomar, Lake Elsinore, French Valley, and nearby areas.",
          "Your role is simple but incredibly important: You help local businesses discover, verify, and claim the free profiles we already created for them on Top of Temecula."
        ],
        highlight: "You are not a pushy salesperson. You don't pressure owners, argue, or hard-close. You represent the brand professionally, explain the free claim clearly, and stay safe."
      },
      {
        title: 'Your One-Sentence Mission',
        content: [
          "If anyone asks what you do, or if you need to ground yourself, memorize this one sentence:",
          "\"Top of Temecula helps local residents discover local businesses, events, deals, and jobs — and my job is to help businesses claim the free profiles we already created for them.\""
        ],
        highlight: "Read that out loud once. If you can explain that clearly, you understand the core of the role."
      },
      {
        title: 'What Winning Looks Like',
        content: [
          "A successful shift is not 'everyone upgraded.' It is a combination of clean operations, professionalism, and capturing useful local information:",
          "1. You drove your route and visited every scheduled business on time.",
          "2. You were polite, professional, and made the brand look trustworthy.",
          "3. You got the profile claimed OR captured the owner's email so we can send an invite.",
          "4. You logged every visit accurately before leaving the parking lot.",
          "5. You stayed safe and followed all rules."
        ],
        highlight: "Goal 1: Free Claim. Goal 2: Flag interest in the dashboard/paid upgrades. Goal 3: Collect local notes."
      },
      {
        title: 'What You Are Offering',
        content: [
          "You are not walking in cold asking for money. You are delivering value:",
          "\"We already created a free starter profile for your business on Top of Temecula. I'm just stopping by with your claim card so you can review it, make sure the information is accurate, and claim it for free.\"",
          "Claiming is 100% free and unlocks their local marketing command center — the dashboard."
        ],
        highlight: "Claiming is free. It takes under 2 minutes. No credit card required."
      },
      {
        title: 'Top of Temecula vs. The Giants',
        content: [
          "How do we compare to the big platforms? Here is the honest breakdown:",
          "Google: Worldwide and algorithm-driven. We add a curated, local-first discovery channel.",
          "Yelp: Review-heavy and transactional. We show businesses in a warm, community guide context.",
          "Social Media: Great for temporary posts that disappear. We provide a lasting local directory profile.",
          "Their Website: Great, but customers have to find it first. We drive local traffic to it."
        ]
      },
      {
        title: 'Active Recall: Day 1 Check',
        type: 'recall',
        recallPrompts: [
          {
            prompt: "What is your one-sentence mission?",
            answer: "Top of Temecula helps local residents discover local businesses, events, deals, and jobs — and your job is to help businesses claim the free profiles already created for them."
          },
          {
            prompt: "What does a successful shift look like? (Name 3 of the 5 goals)",
            answer: "Drove the full route on time; was polite and professional; got a claim OR captured an owner email; logged every visit before leaving the lot; stayed safe."
          },
          {
            prompt: "How do you position Top of Temecula against Google?",
            answer: "We don't replace Google. We add a hyper-local discovery channel for valley residents. The free claim ensures their local info is accurate and unlocks a free dashboard."
          }
        ]
      }
    ],
    quiz: [
      {
        id: 'q1_1',
        text: 'What is the primary goal of your field visits?',
        options: [
          'To sell expensive monthly marketing packages',
          'To help businesses claim the free profiles already created for them and unlock their dashboard',
          'To convince businesses to stop using Google and Yelp',
          'To take photos of customers inside the business'
        ],
        correctAnswer: 1,
        explanation: 'Your primary goal is getting the free profile claimed. This builds trust, gets them in our ecosystem, and unlocks their free dashboard.'
      },
      {
        id: 'q1_2',
        text: 'Which communities does Top of Temecula cover?',
        options: [
          'Only the city of Temecula',
          'All of Southern California',
          'The entire Temecula Valley (Temecula, Murrieta, Menifee, Wildomar, Lake Elsinore, French Valley, etc.)',
          'San Diego County'
        ],
        correctAnswer: 2,
        explanation: 'Top of Temecula is a regional guide covering the entire Temecula Valley.'
      },
      {
        id: 'q1_3',
        text: 'A business owner asks: "Why do I need this when I already have Google?" What is the correct response?',
        options: [
          '"Google is outdated and local businesses are leaving it."',
          '"We don\'t replace Google. We add a local discovery channel for valley residents, and the free claim confirms your info is accurate and unlocks a free dashboard."',
          '"Our platform guarantees you will rank higher on Google search results."',
          '"You have to claim this or your Google listing will be affected."'
        ],
        correctAnswer: 1,
        explanation: 'Always position Top of Temecula as a complementary local channel, never make false guarantees about Google, and focus on the free claim/dashboard.'
      }
    ],
    assignment: {
      title: 'Day 1 Assignment: Insurance Agency Audit',
      description: 'Your first field batch is Insurance Agencies. Find three real Temecula Valley insurance agencies (search on Google Maps or online), look each up on topoftemecula.com, and perform a quick audit. Are they listed? Claimed or unclaimed? Is their name/phone/website accurate? Do they have photos? How would they benefit from claiming their profile and unlocking the AI-citation dashboard?',
      placeholder: 'Agency 1 Name:\nListed on Top of Temecula? (Yes/No):\nClaimed? (Yes/No):\nAccuracy Issues Found:\nHow they would benefit:\n\nAgency 2 Name:\n...\n\nAgency 3 Name:\n...',
      type: 'text'
    }
  },

  // ─── DAY 2 ───────────────────────────────────────────────────────────────────
  {
    id: 'day2',
    day: 2,
    title: 'Why Claiming Matters: The Dashboard & The Upgrades',
    subtitle: 'Learn the real value hook — the AI-citation tracker and the free marketing platform — plus the upgrade ladder.',
    description: 'Understand the free local marketing command center every business unlocks, the a la carte tools they get even at $0, the paid upgrade ladder, and how to present it confidently without pressure.',
    duration: '4 Hours (Paid)',
    slides: [
      {
        title: 'The Dashboard: The Real Value Hook',
        content: [
          "Why does an owner actually care about claiming a free profile? Because it unlocks their free local marketing command center.",
          "The absolute biggest hook is the AI-Citation Tracker:",
          "\"Our dashboard tracks how often AI tools like ChatGPT, Gemini, and Perplexity are recommending and citing your business. That's the new search engine — and our tool shows you if you're showing up.\"",
          "Most local business owners have no idea how AI views them. This is incredibly unique and valuable."
        ],
        highlight: "Lead with the claim and the AI dashboard. It is a modern, high-value tool that is completely free to unlock. It's software — it pulls what AI tools are recommending and shows it to them on screen."
      },
      {
        title: 'The Dashboard Is a Free Marketing Platform (Even at $0)',
        content: [
          "The dashboard is an active local marketing platform the owner gets for free, just by claiming. Once claimed, the business owner can:",
          "Monitor their local presence and AI-citation data.",
          "Edit their profile details (hours, services, social links, photos).",
          "Track local visitor traffic and profile views.",
          "Use a la carte marketing options with no subscription and no commitment — they only pay for what they use, one time:",
          "Got an event coming up? Promote it on our platform.",
          "Want a press release? Order one and we'll create and syndicate it for them.",
          "Hiring? Feature their job listings to attract Temecula talent."
        ],
        highlight: "Even if they never upgrade, claiming gives them a real, free marketing toolkit. \"Even if you never upgrade, you've got a free marketing platform.\""
      },
      {
        title: 'The Upgrade Ladder (The Big Idea, Not the Specs)',
        content: [
          "You do NOT need to memorize feature lists. When the owner is on the claim/upgrade screen, every deliverable is listed right there in bullets — let them read it for themselves. Your job is the big-idea difference between the tiers.",
          "Free Claim ($0): Claim and control your profile, and unlock the dashboard — a free local marketing platform with AI-citation data and pay-as-you-go a la carte tools. No credit card, no commitment.",
          "Enhanced ($49/mo): Get more out of Top of Temecula — stronger presence and visibility on our platform.",
          "Premium ($79/mo): The main upgrade — the most visibility and presence on Top of Temecula. This is what you steer an engaged owner toward.",
          "Growth Partner ($299/mo): A full done-for-you AEO service — not automated. Everything in Premium, plus a dedicated representative who works every month to grow how often AI tools recommend you — and it reaches across the entire AI landscape, not just Top of Temecula. Built for ambitious businesses with high customer lifetime value."
        ],
        highlight: "Enhanced and Premium are about getting the most out of Top of Temecula itself. Growth Partner is a different animal — a real human-run AEO service that works everywhere AI looks, not just on our platform."
      },
      {
        title: 'How to Present the Upgrades (Without Being Pushy)',
        content: [
          "Premium is always the goal. When an owner is engaged and the claim is done, present the upgrades confidently and steer toward Premium as the natural next step. Then present Growth Partner for what it is, and let the owner decide between them. Never pressure.",
          "When is Growth Partner the right fit? For businesses that are ambitious, have a high customer lifetime value, or already buy expensive marketing services. For a typical small shop, Premium is the right call.",
          "You never handle the transaction. Every upgrade happens on the website, on the owner's own device. You walk them to it, explain the big-idea difference, let the screen show the deliverables, and encourage Premium — but the owner completes the purchase themselves. You never take a card, cash, or payment of any kind."
        ],
        highlight: "Lead with free. Steer engaged owners to Premium. Present Growth Partner honestly for the right businesses. Let them decide. Never pressure, never handle payment."
      },
      {
        title: 'Pricing Scripts',
        type: 'script',
        scripts: [
          {
            label: "If they ask: \"How much does this cost?\"",
            text: "\"The claim and the dashboard are 100% free — no credit card required, and you've got free a la carte marketing tools in there too. If you ever want more visibility, there are optional paid tiers — Premium is the popular one — but the free claim is the main thing today to make sure your info is correct.\""
          },
          {
            label: "If an engaged owner asks \"What's the upgrade?\"",
            text: "\"Premium gets you the most visibility and presence on Top of Temecula — it's what most owners go with when they want more. Right here on the screen you can see exactly what's included. There's also a Growth Partner option, which is a full done-for-you service with a dedicated rep growing your AI recommendations across the board — that one's for businesses really leaning into marketing.\""
          },
          {
            label: "If they ask for exact features of a tier:",
            text: "\"It's all listed right here on the screen so you can see exactly what each one includes. If you want a deeper breakdown, you can always email questions@topoftemecula.com and someone will walk you through it.\""
          },
          {
            label: "If they want to buy an upgrade:",
            text: "\"Awesome — you can grab that right here on the site on your phone. The free claim is done, so you're all set up; just pick the tier on the screen. I'll hang out in case you have any quick questions.\" (You never enter payment info or touch their card.)"
          }
        ]
      },
      {
        title: "Do's and Don'ts of Product Talk",
        type: 'dosdonts',
        items: [
          { label: "DON'T Say", text: "\"This will guarantee you rank #1 on Google search.\"", bad: true },
          { label: "DO Say", text: "\"This gives you a dedicated local presence and shows you how AI tools like ChatGPT recommend you.\"" },
          { label: "DON'T Say", text: "\"You have to upgrade today or your listing will be deleted.\"", bad: true },
          { label: "DO Say", text: "\"Upgrades are completely optional. The free claim is yours forever.\"" },
          { label: "DON'T Say", text: "\"I need your credit card to activate the free dashboard.\"", bad: true },
          { label: "DO Say", text: "\"The claim is free and requires no credit card or payment info at all.\"" },
          { label: "DON'T", text: "Take a card, cash, check, or enter payment info for any upgrade.", bad: true },
          { label: "DO", text: "Let the owner complete any purchase themselves on the website, on their own device." },
          { label: "DON'T", text: "Make up a feature or a price to answer a tough question.", bad: true },
          { label: "DO", text: "Point to the deliverables on the screen, or send them to questions@topoftemecula.com." }
        ]
      },
      {
        title: 'Active Recall: Day 2 Check',
        type: 'recall',
        recallPrompts: [
          {
            prompt: "What is the AI-Citation Tracker and why do owners care?",
            answer: "It tracks how often AI tools like ChatGPT, Gemini, and Perplexity are recommending and citing their business. Most owners have no idea how AI views them — this is a unique, high-value free tool."
          },
          {
            prompt: "Name two free a la carte marketing tools an owner gets just by claiming.",
            answer: "Any two of: promote an upcoming event, order a syndicated press release, feature their job listings to attract local talent — all pay-as-you-go, no subscription."
          },
          {
            prompt: "Which paid tier do you steer an engaged owner toward, and what's the one above it?",
            answer: "Premium ($79/mo) is the main upgrade you steer toward. Growth Partner ($299/mo) is the done-for-you AEO service with a dedicated rep, working across the whole AI landscape — present it for what it is and let them decide."
          },
          {
            prompt: "Do you ever handle the payment for an upgrade?",
            answer: "Never. Every upgrade happens on the website, on the owner's own device. You guide and encourage, but the owner completes the purchase themselves."
          }
        ]
      }
    ],
    quiz: [
      {
        id: 'q2_1',
        text: 'What is the "genius hook" of the free dashboard that owners find most interesting?',
        options: [
          'It lets them play video games in their browser',
          'It tracks how often AI tools like ChatGPT, Gemini, and Perplexity are recommending and citing their business',
          'It automatically files their taxes with the state',
          'It replaces their company website entirely'
        ],
        correctAnswer: 1,
        explanation: 'The AI-Citation Tracker is our most unique, high-value free feature. It shows owners how modern AI search engines view their business.'
      },
      {
        id: 'q2_2',
        text: 'Which paid tier do you steer an engaged, interested owner toward by default?',
        options: [
          'Enhanced ($49/mo)',
          'Premium ($79/mo)',
          'Growth Partner ($299/mo)',
          'You never mention any upgrade'
        ],
        correctAnswer: 1,
        explanation: 'Premium is the main goal. Present Growth Partner ($299/mo) honestly for ambitious, high-value businesses, but let the owner decide — never pressure.'
      },
      {
        id: 'q2_3',
        text: 'What does a business get for free, just by claiming, even if they never upgrade?',
        options: [
          'Nothing until they pay',
          'Profile control plus the dashboard — a free marketing platform with AI-citation data and pay-as-you-go a la carte tools (event promotion, press releases, featured job listings)',
          'A free company website',
          'A guaranteed #1 Google ranking'
        ],
        correctAnswer: 1,
        explanation: 'The free claim unlocks a real marketing toolkit. Owners only pay for a la carte pieces they choose — no subscription, no commitment.'
      },
      {
        id: 'q2_4',
        text: 'What is "Growth Partner" ($299/mo)?',
        options: [
          'An automated software setting they toggle on',
          'A cheaper version of the free claim',
          'A full done-for-you AEO service with a dedicated rep who grows their AI recommendations every month, across the whole AI landscape — not just Top of Temecula',
          'A one-time press release'
        ],
        correctAnswer: 2,
        explanation: 'Growth Partner is human-run, not automated. It includes everything in Premium plus a dedicated rep and reaches beyond Top of Temecula.'
      },
      {
        id: 'q2_5',
        text: 'Do you ever collect payment for an upgrade?',
        options: [
          'Yes, cash only',
          'Yes, you can take their card number and enter it for them',
          'No — every upgrade happens on the website on the owner\'s own device; you never handle payment',
          'Only for the Growth Partner tier'
        ],
        correctAnswer: 2,
        explanation: 'You guide and encourage, but the owner always completes the purchase themselves on the website. You never take a card, cash, or payment of any kind.'
      }
    ],
    assignment: {
      title: 'Day 2 Assignment: Write Your Value Pitch',
      description: 'Write a short, 4-5 sentence pitch explaining why a local insurance agency should claim its free profile on Top of Temecula. Include: the free claim (no credit card), the AI-citation tracker, the free a la carte marketing tools they get even at $0, and a soft mention that Premium is there if they ever want more visibility.',
      placeholder: 'Example: "Hi, we already created a free starter profile for your agency on Top of Temecula to help local residents find you. Claiming it is completely free and takes about a minute, with no credit card required. Once claimed, you unlock a free dashboard that tracks how often AI tools like ChatGPT are recommending your business — plus free marketing tools you can use whenever you want, like promoting an event or featuring a job listing, paying only if you use them. And if you ever want more presence on the platform, there\'s an optional Premium upgrade — but the free claim is the main thing today."',
      type: 'text'
    }
  },

  // ─── DAY 3 ───────────────────────────────────────────────────────────────────
  {
    id: 'day3',
    day: 3,
    title: 'Field Operations, The Claim, Safety & Roleplay',
    subtitle: 'Master the outcome ladder, conduct the in-person claim and upgrade, handle every scenario, log your data, and stay safe.',
    description: 'Get fully prepared for the field. Learn the full ladder of outcomes from best to fallback, how to walk an owner through claiming and upgrading on the spot, how to handle every scenario, strict safety and compliance rules, and how to record and self-assess your pitch.',
    duration: '4 Hours (Paid)',
    slides: [
      {
        title: 'The Outcome Ladder (Your Mental Model)',
        type: 'ladder',
        content: [
          "Every visit, you try to climb as high as you can, and you only step down as reality forces you to. Memorize the ladder — it turns dozens of situations into one simple idea: always aim for Rung 1; step down only when you have to."
        ],
        highlight: "Safety overrides every rung. If anyone is aggressive or makes you uncomfortable, you leave immediately — no matter how high on the ladder you were.",
        ladderRungs: [
          { rung: 1, title: "Full Win", description: "Owner is present. You walk them through the claim on the spot, and they choose an upgrade (Premium, or Growth Partner). This is the target." },
          { rung: 2, title: "Claim + Hot Lead", description: "Owner present, claim done in person, upgrade-curious but not today. Flag it and set a follow-up." },
          { rung: 3, title: "Clean Claim", description: "Owner present, claim done in person, free only. Still a win." },
          { rung: 4, title: "Committed Deferral", description: "Owner present but won't claim right now. Get a verbal commitment, capture their email, leave the card, log it." },
          { rung: 5, title: "Email Invite", description: "Owner is out; a helpful gatekeeper gives you the owner's email. Send the invite, leave the card, log it." },
          { rung: 6, title: "Card Drop + Intel", description: "Owner out, gatekeeper won't share an email. Get the owner's name and best time to return. Leave the card, log it." },
          { rung: 7, title: "Logged Touch", description: "Hard no, not interested, or unwelcoming. Leave the card if welcome, log it, move on." },
          { rung: 8, title: "Data Correction", description: "No sale possible (closed, moved, wrong info, duplicate listing, or franchise with no local authority). Don't pitch — log what you found so we can fix the profile." }
        ]
      },
      {
        title: 'The Script: Your Field Playbook',
        content: [
          "Depending on how busy the business is, you will use one of three script lengths. Practice these until they feel natural and conversational:",
          "10-Second (Very Busy): \"Hi, I'm [Your Name] with Top of Temecula. We created a free starter profile for your business, and I'm just dropping off your claim card so the owner can review and claim it for free.\"",
          "30-Second (Standard): \"Hi, I'm [Your Name] with Top of Temecula — a local community guide. We already created a free starter profile for your business. I'm stopping by with your claim card so you can scan it, check the info, and claim it free. Takes about a minute and makes sure locals see the right details.\"",
          "Full Pitch (Engaged Owner): See next slide for the complete script."
        ]
      },
      {
        title: 'The Full Pitch & The AI Hook',
        type: 'script',
        scripts: [
          {
            label: "The Full Pitch Script",
            text: "\"Hi, I'm [Your Name] with Top of Temecula. We help valley residents discover local businesses, events, deals, and guides. We already created a free starter profile for your business — this QR card goes straight to it so you can review it and claim it free. Once you claim, you also get a free dashboard that shows how often AI tools like ChatGPT are recommending your business to local searchers, plus free marketing tools you can use whenever you want. No credit card required to claim.\""
          }
        ],
        highlight: "Practice delivering this with a warm, friendly, confident, and low-pressure tone."
      },
      {
        title: 'The Ultimate Goal: The In-Person Claim & Upgrade Walkthrough',
        content: [
          "This is the highest rung and your best possible outcome. When the owner is present and willing, don't just hand them a card — do the claim with them, right there.",
          "Step 1 — Get into the flow together. Hand them the QR card and have them scan it with their phone camera, or pull it up and lean in shoulder-to-shoulder. The card opens their business profile.",
          "Step 2 — Walk the claim. Guide them through the on-screen claim steps — the screen prompts each step, so you just point, encourage, and keep it easy: \"Tap there... yep, confirm your info looks right... and that's it.\" Stay at their shoulder.",
          "Step 3 — Land on the dashboard. Once it says claimed, they're in their dashboard. Show them the AI-citation data and point out the free a la carte tools. This is the \"wow\" moment — let them see the value for themselves.",
          "Step 4 — Tee up the upgrade. The upgrade options are right there on screen. Walk the big-idea difference: \"The free version is yours forever. Premium gets you the most visibility on the platform — most owners who want more go with that. There's also Growth Partner, a full done-for-you service if you're really pushing growth.\" Let the screen show the deliverables. Let them decide.",
          "Step 5 — Hand off the transaction. If they want to upgrade, they complete it themselves on the website, on their own device. You never touch payment. Then log everything."
        ],
        highlight: "Your superpower is being the friendly person at their shoulder who makes a slightly intimidating thing feel easy. Walk it with them — don't just point at a card and leave."
      },
      {
        title: 'When the Claim Hits a Snag (Recovery)',
        content: [
          "Two things go wrong most often. Handle them smoothly:",
          "The QR code won't scan: \"No worries — these sometimes need good light. You can also just go to [their profile URL], or I can pull it up for you right here.\" Don't let a finicky camera kill the claim.",
          "The owner gets pulled away mid-claim: \"Totally fine — want me to send you an email invite so you can finish whenever you have a minute?\" Capture the email, leave the card, log it as a hot follow-up. You've stepped down from Rung 1 to Rung 4/5 cleanly instead of losing the visit."
        ],
        highlight: "A snag is not a no. Recover to the highest rung still available — finish later by email rather than walking away empty-handed."
      },
      {
        title: 'Field Scenarios (Objection & Situation Cards)',
        type: 'scenario',
        items: [
          { label: "\"Is this really free?\" (Rungs 1-3)", text: "\"Yes, the basic claim is completely free — no credit card required. You even get free marketing tools in the dashboard. There are optional paid tiers if you ever want more visibility, but the claim and dashboard are free.\"" },
          { label: "\"Is this a scam? / Who are you really with?\" (Cross-cutting)", text: "\"Totally fair to ask. I'm [Your Name], a local summer ambassador with Top of Temecula — we're a Temecula Valley business guide. Your profile is already live; you can pull it up on your phone right now, and claiming it is free. Anything you want to verify, you can email questions@topoftemecula.com.\"" },
          { label: "\"Are you on commission? / What's your cut?\" (Cross-cutting)", text: "\"I'm a local summer ambassador — I'm just here to help businesses claim their free profile and see the dashboard. The claim costs you nothing either way.\"" },
          { label: "\"We already have Google / Yelp.\" (Rungs 1-3)", text: "\"That's great — we don't replace Google. We add a hyper-local discovery channel for Temecula Valley residents, and our dashboard shows you how often AI search tools recommend you. The claim just ensures your local info is accurate.\"" },
          { label: "\"I'll do it later.\" (Rung 4)", text: "\"Totally understand — it honestly takes about a minute, want to knock it out now while I'm here so it's done? ... No problem at all — what's the best email for you? I'll have a claim invite sent so you can finish whenever, and I'll leave this card too.\" (Get the commitment, then the email, then leave the card. Log it.)" },
          { label: "\"It's too expensive.\" (upgrade) (Rungs 1-2)", text: "\"No pressure at all — the free claim and dashboard are yours regardless, and those free a la carte tools mean you only ever pay for what you actually use. Premium is just there if you ever want more visibility down the road.\"" },
          { label: "\"Let me think about it.\" (upgrade) (Rung 2)", text: "\"Of course. The free claim is yours now either way. The upgrade options live right in your dashboard whenever you're ready — no rush at all.\"" },
          { label: "\"I need to ask my partner.\" (upgrade) (Rung 2)", text: "\"Makes sense. Let's get the free claim done now so you control the profile, and you two can look at the upgrade options together in the dashboard anytime.\"" },
          { label: "\"We already claimed it.\" (Cross-cutting)", text: "\"That's great — you're ahead of the game! Mind if I make sure the info's accurate while I'm here? And have you checked out the AI-citation dashboard yet? Happy to point you to it.\" (Verify info, add value, log it.)" },
          { label: "\"The owner is not here.\" (Rungs 5-6)", text: "\"No problem! Would it help if we emailed the owner an invitation to claim their free profile? If you have their best email, we can send the invite directly. I'll leave this card for them too.\" (If no email: get the owner's name and best time to return, leave the card, log both.)" },
          { label: "\"We are not interested.\" (Rung 7)", text: "\"No problem at all! I'll leave the card in case you want to review the free profile later. Have a wonderful day!\" (Then exit politely — never argue.)" },
          { label: "Language barrier (Any rung)", text: "Keep it simple and visual — smile, show the card and QR, point to the business name on the profile, and offer the email invite. If you can't communicate the claim, leave the card, capture an email if possible, and log it for follow-up." }
        ]
      },
      {
        title: 'The Gatekeeper Playbook',
        type: 'script',
        content: [
          "The most common situation you will face: the owner is NOT there. A front-desk employee, receptionist, or manager greets you instead. This is the Gatekeeper.",
          "Your goal shifts: Win the gatekeeper's trust so they help you get the owner's email (Rung 5). If they won't share it, get the owner's name and best time to return (Rung 6).",
          "Key mindset: The gatekeeper is not your obstacle — they are your ally. Make it easy and appealing for them to help you."
        ],
        highlight: "Capturing a valid owner email is a high-value lead. Treat it like a claim win. If you can't get the email, getting the owner's name and best visit time is still a real win — log it so we can plan a smart return.",
        scripts: [
          {
            label: "Opening to a gatekeeper",
            text: "\"Hi! I'm [Your Name] with Top of Temecula. We created a free local profile for this business and I'm stopping by to make sure the owner knows about it. Is the owner or manager available today?\""
          },
          {
            label: "If they say the owner is out",
            text: "\"No problem! Could I get the owner's best email so we can send them a direct invitation to claim their free profile? It's a quick link — no commitment, completely free. It would be a great thing for them to see.\""
          },
          {
            label: "If they're hesitant to share the email (Rung 6)",
            text: "\"Totally understand — I'll leave this claim card for them too. Who's the best person to ask for, and when's usually a good time to catch them? I'd love to swing back and walk them through it.\" (Log the name and best time.)"
          }
        ]
      },
      {
        title: 'Edge Cases & Data Correction (Rung 8)',
        content: [
          "Sometimes there's no sale to be made — and that's still useful. If the business is closed, has moved, is under new ownership, has wrong info on the profile, is a duplicate listing, or is a franchise where the local staff has no authority to claim — don't pitch.",
          "Instead, log exactly what you found so we can correct the profile."
        ],
        highlight: "Accurate data is a real win. A correction keeps our directory trustworthy, which is the whole point. Log it clearly and move on."
      },
      {
        title: "When You Don't Know the Answer",
        content: [
          "You will get questions you can't answer. That's expected, and there's one right move every time: defer — never improvise.",
          "\"Great question — the full details are right here on the screen so you can see exactly what's included.\"",
          "\"I want to make sure you get the exact right answer, so I'd point you to questions@topoftemecula.com — they'll walk you through it.\"",
          "\"Let me flag that for my supervisor and we'll follow up with you.\""
        ],
        highlight: "Making up a feature, a price, or a promise to fill a silence is the one thing that can get you and the brand in trouble. A confident \"here's where to get the exact answer\" is always better than a guess."
      },
      {
        title: 'Safety & Compliance (Non-Negotiable)',
        content: [
          "Your safety is 100x more important than any business claim. Follow these rules strictly:",
          "1. Driving: You are authorized to drive your personal vehicle between routes. Obey all traffic laws. NO PHONE USE while moving. Pull over safely to check routes or log visits.",
          "2. Public Storefronts Only: Only enter public commercial spaces during regular business hours. Never enter private homes, warehouses, back rooms, or employee-only areas.",
          "3. No Cash/Checks/Payment: Never accept cash, checks, or write down credit card numbers, and never enter payment for an upgrade. All upgrades happen securely online, completed by the owner themselves.",
          "4. Location Sharing: You must share your live location with your supervisor at the start of every shift and check out at the end."
        ],
        highlight: "If anyone is rude, aggressive, or makes you uncomfortable, leave immediately. No questions asked. Call your supervisor. This overrides every rung of the Outcome Ladder."
      },
      {
        title: "CRM Logging: If It Isn't Logged, It Didn't Happen",
        type: 'dosdonts',
        content: [
          "Log every visit before you leave the parking lot. Capture: business name, category, address, date/time, who you spoke to and their role, which rung you reached (1-8), owner available?, owner email captured for invite?, owner name + best time to return?, card left?, claimed on-site?, upgrade interest (none / Premium / Growth Partner / follow-up)?, content captured?, and a specific note."
        ],
        items: [
          { label: "Good CRM Note", text: "\"Rung 2. Owner Mike claimed on-site, walked the dashboard, loved the AI tracker. Curious about Premium but wants to check budget — follow up Friday. Left card.\"" },
          { label: "Good CRM Note", text: "\"Rung 5. Owner out. Spoke with Sarah (front desk). Got owner email (mike@valleyins.com) for claim invite. Left card. Sarah says owner is in mornings.\"" },
          { label: "Useless CRM Note", text: "\"Went there. Talked to someone. Busy.\"", bad: true }
        ]
      },
      {
        title: 'Content Capture Checklist',
        type: 'dosdonts',
        items: [
          { label: "Film Vertically", text: "Hold your phone portrait (vertical) for all clips. Horizontal video is not usable for our social platforms." },
          { label: "Good Natural Light", text: "Stand near a window or outside. Avoid dark rooms, harsh overhead lighting, or shooting into the sun." },
          { label: "Steady Shot", text: "Hold the phone with both hands or prop it against something stable. Shaky footage is unusable." },
          { label: "5-10 Seconds Per Clip", text: "Short, focused clips are ideal. Capture one subject per clip — a storefront sign, a product display, a team member (with permission)." },
          { label: "Always Get Permission First", text: "Before filming inside a business, ask the owner or manager: \"Would it be okay if I captured a quick clip of your storefront for our local guide?\"" },
          { label: "NEVER Film", text: "Customers, payment areas, registers, employee-only areas, or anyone who hasn't given permission. This is a hard rule.", bad: true },
          { label: "Log It", text: "Note in your CRM that you captured content and what you filmed. Your supervisor reviews all content before it goes live." }
        ],
        highlight: "Content capture is optional and only happens when the owner enthusiastically agrees. When in doubt, skip it and focus on the claim."
      },
      {
        title: 'Adapting Across Business Types',
        content: [
          "Your training examples use insurance agencies, but your route may include restaurants, salons, auto shops, med spas, and more. The pitch is the same — only the example you reach for changes:",
          "Restaurants/cafes: Lead with events and reservations; \"feature your happy hour or live music event.\"",
          "Salons/med spas: Lead with visibility and reviews; \"show up when locals ask AI for the best spa nearby.\"",
          "Auto/trades: Lead with trust and accurate info; \"make sure your hours and services are right when someone's in a pinch.\"",
          "Any business hiring: Lead with featured job listings to reach Temecula talent."
        ],
        highlight: "Same ladder, same claim, same dashboard. Just pick the one free benefit that lands hardest for that type of business as your opener."
      },
      {
        title: 'Active Recall: Day 3 Check',
        type: 'recall',
        recallPrompts: [
          {
            prompt: "What is the Outcome Ladder, and what is Rung 1?",
            answer: "It's the best-to-fallback list of visit outcomes. Rung 1 is the Full Win: the owner is present, you walk them through the claim on the spot, and they choose an upgrade. Always aim for Rung 1; step down only as reality forces you."
          },
          {
            prompt: "What are the five steps of the in-person claim & upgrade walkthrough?",
            answer: "Get into the flow together (scan/lean in), walk the on-screen claim steps, land on the dashboard and show the value, tee up the upgrade (steer to Premium, present Growth Partner), and hand off the transaction to the owner on the website."
          },
          {
            prompt: "The QR won't scan or the owner gets pulled away mid-claim. What do you do?",
            answer: "Recover to the highest rung still available. For the QR: use the profile URL or pull it up yourself. If they're pulled away: offer to email an invite so they finish later, capture the email, leave the card, log it."
          },
          {
            prompt: "What is the strict rule about phone use while driving?",
            answer: "Zero phone use while moving. Pull over safely to check routes, text, or log visits in the CRM. No exceptions."
          },
          {
            prompt: "What do you do if a business owner is aggressive or tells you to leave?",
            answer: "Leave immediately. No arguing, no second pitch. Walk safely to your car and call your supervisor. Safety overrides every rung."
          },
          {
            prompt: "You don't know the answer to a question. What do you do?",
            answer: "Defer, never improvise — point to the deliverables on the screen, send them to questions@topoftemecula.com, or flag it for your supervisor."
          }
        ]
      }
    ],
    quiz: [
      {
        id: 'q3_1',
        text: 'What should you do if the owner is not available when you visit?',
        options: [
          'Leave immediately without speaking to anyone',
          'Ask for their best email to send a direct claim invitation, leave the physical claim card, and log the visit',
          'Wait in the lobby until they return',
          'Try to guess their password and claim it for them'
        ],
        correctAnswer: 1,
        explanation: 'The email-invite play is incredibly powerful. Capturing a valid owner email is a high-value lead that lets us follow up digitally.'
      },
      {
        id: 'q3_2',
        text: 'What is the strict rule regarding phone use while driving between routes?',
        options: [
          'You can log visits while driving slowly',
          'You can text your supervisor while stopped at red lights',
          'Zero phone use while moving. You must pull over safely to check routes, text, or log visits in the CRM.',
          'Only use voice-to-text while driving'
        ],
        correctAnswer: 2,
        explanation: 'Safety is non-negotiable. Absolutely zero phone interaction is permitted while the vehicle is in motion.'
      },
      {
        id: 'q3_3',
        text: 'What should you do if a business owner is aggressive, rude, or makes you feel uncomfortable?',
        options: [
          'Argue back and defend the brand',
          'Stay and try to convince them to claim anyway',
          'Leave the premises immediately, walk safely to your car, and call your supervisor',
          'Record them on your phone without permission'
        ],
        correctAnswer: 2,
        explanation: 'Your safety is the absolute priority. Exit immediately and escalate to your supervisor. Never argue or escalate a conflict.'
      },
      {
        id: 'q3_4',
        text: 'What is the ultimate goal (Rung 1) when an owner is present and willing?',
        options: [
          'Hand them a card and leave quickly',
          'Walk them through the claim on the spot, show them the dashboard, and present the upgrade — steering toward Premium',
          'Sign them up for Growth Partner whether they want it or not',
          'Collect their credit card for the upgrade'
        ],
        correctAnswer: 1,
        explanation: 'The best outcome is conducting the claim in person, showing the value live, and teeing up Premium — letting the owner decide and complete any purchase themselves.'
      },
      {
        id: 'q3_5',
        text: 'During an in-person upgrade, who completes the purchase?',
        options: [
          'You enter their card for them to save time',
          'The owner completes it themselves on the website, on their own device — you never handle payment',
          'You collect cash and submit it later',
          'Your supervisor calls them for the card number on the spot'
        ],
        correctAnswer: 1,
        explanation: 'You guide and encourage, but every transaction happens on the website, completed by the owner. You never take payment of any kind.'
      },
      {
        id: 'q3_6',
        text: "An interested owner says \"I'll do it later.\" What's the best move?",
        options: [
          'Insist they do it now or leave',
          'Just drop a card and walk away',
          "Encourage doing it now since it's quick; if not, capture their email for a claim invite, leave the card, and log it",
          'Mark them as not interested'
        ],
        correctAnswer: 2,
        explanation: "That's Rung 4 — a committed deferral. Get the commitment, capture the email so we can follow up, and leave the card as backup."
      },
      {
        id: 'q3_7',
        text: "The owner's QR code won't scan. What do you do?",
        options: [
          'Give up and mark the visit as failed',
          'Use the profile URL or pull the profile up yourself, then continue the claim',
          'Tell them their phone is broken',
          'Reschedule for another day'
        ],
        correctAnswer: 1,
        explanation: "A snag is not a no. Recover smoothly so a finicky camera doesn't cost you the claim."
      }
    ],
    assignment: {
      title: 'Day 3 Assignment: Roleplay Recording',
      description: 'Practice the scripts and objection handling. Then record a short audio or video clip (1-2 minutes) of yourself delivering the full pitch as if you just walked into a local insurance agency. Include: (1) Intro, (2) Free Claim & AI Dashboard Pitch with a free a la carte tool, (3) Response to "Is this really free?" or "We already have Google", (4) A soft tee-up of the Premium upgrade, (5) Polite Close. Upload to Google Drive or YouTube (unlisted) and paste the link below. Then score yourself honestly using the rubric.',
      placeholder: 'Paste your Google Drive or YouTube link here...',
      type: 'roleplay',
      rubric: [
        'I led with the free claim, not the cost.',
        'I hit the dashboard / AI-citation hook and at least one free a la carte tool.',
        'I handled the objection without any forbidden claim (no Google-ranking guarantee, no false partnership, no deletion threat, no credit-card-for-free-claim).',
        'I teed up Premium confidently without pressuring, and made clear the owner decides.',
        'I had a clean, friendly close and stayed low-pressure throughout.'
      ]
    }
  }
];

// ─── FINAL READINESS TEST QUESTION BANK ──────────────────────────────────────
// 20 questions. On each attempt, 10 are randomly selected and answer options are
// shuffled. A score of 10/10 is required to pass and unlock the Field Clearance Certificate.
export const finalReadinessTestBank: Question[] = [
  {
    id: 'f1',
    text: 'What is Top of Temecula?',
    options: [
      'A national search engine competing with Google',
      'A hyper-local discovery platform and guide for the Temecula Valley helping residents find local businesses, events, deals, and jobs',
      'A social media app for teenagers',
      'A software company that sells AI models'
    ],
    correctAnswer: 1,
    explanation: 'Top of Temecula is a hyper-local community guide and discovery platform.'
  },
  {
    id: 'f2',
    text: 'What is the main goal of a field visit?',
    options: [
      'To collect cash payments for advertising',
      'To help the business claim their free profile, unlock their dashboard, or capture their email for a digital invite',
      'To audit their physical building for safety compliance',
      'To convince them to delete their Yelp profile'
    ],
    correctAnswer: 1,
    explanation: 'The free claim and dashboard unlock is your primary mission. Capturing an email is your primary backup.'
  },
  {
    id: 'f3',
    text: 'Is the basic profile claim really free?',
    options: [
      'Yes, 100% free with no credit card or payment info required',
      'Free for the first 7 days, then we charge them automatically',
      'Only free if they agree to buy a press release',
      'No, it costs $5'
    ],
    correctAnswer: 0,
    explanation: 'The basic claim is completely free forever and requires no credit card. This is a key trust-builder.'
  },
  {
    id: 'f4',
    text: 'What is the "AI-Citation Tracker" in the dashboard?',
    options: [
      'A tool that writes automated reviews for the business',
      'A feature that tracks how often AI search engines like ChatGPT, Gemini, and Perplexity are recommending and citing their business',
      'A tool that posts automatically to their Instagram account',
      'An AI chat bot that answers their phone calls'
    ],
    correctAnswer: 1,
    explanation: 'It tracks how modern AI search tools cite and recommend their business, giving them unique visibility.'
  },
  {
    id: 'f5',
    text: 'What should you say if an owner says, "We already have Google"?',
    options: [
      '"Google is blocking local businesses, so you need to switch to us."',
      '"We don\'t replace Google. We add a local-first channel for valley residents, and our dashboard shows you how often AI tools recommend you. The free claim just ensures your info is accurate."',
      '"Our platform is owned by Google, so they work together."',
      '"Google is going out of business soon anyway."'
    ],
    correctAnswer: 1,
    explanation: 'Always position Top of Temecula as a complementary local channel, never make false claims or disparage other platforms.'
  },
  {
    id: 'f6',
    text: 'What is the "email-invite play" when the owner or manager is not available?',
    options: [
      'Leave immediately without saying anything',
      'Ask the front desk for the owner\'s best email so we can send a direct digital claim invite, leave the physical card, and log the visit',
      'Call the business repeatedly until they answer',
      'Sign up the business using a fake email address'
    ],
    correctAnswer: 1,
    explanation: 'Capturing the owner\'s email is a highly valuable lead that lets us follow up with a direct digital invitation.'
  },
  {
    id: 'f7',
    text: 'Which of the following is a strict "NEVER SAY" rule?',
    options: [
      '"This is free to claim."',
      '"We are officially partnered with Google/Yelp/the City/the Chamber."',
      '"The free dashboard tracks ChatGPT recommendations."',
      '"There are optional paid services if you want extra visibility."'
    ],
    correctAnswer: 1,
    explanation: 'Never claim false partnerships. It destroys brand credibility and carries legal liability.'
  },
  {
    id: 'f8',
    text: 'When must a field visit be logged in the CRM?',
    options: [
      'At the end of the week',
      'Only if the business successfully claimed their profile',
      'Before you leave the parking lot of that business — immediately after the visit',
      'Only if the owner was rude'
    ],
    correctAnswer: 2,
    explanation: 'Logging immediately before leaving the lot ensures your notes are fresh, accurate, and no visits are forgotten.'
  },
  {
    id: 'f9',
    text: 'What is the safe driving policy while on company time?',
    options: [
      'You can look at your route sheet while driving if you are careful',
      'Absolutely zero phone use while moving. You must pull over safely to check routes, text, or log visits.',
      'You can text your supervisor if you are stopped at a red light',
      'Only use phone mounts'
    ],
    correctAnswer: 1,
    explanation: 'Safety is absolute. No phone interaction is permitted while the vehicle is in motion under any circumstances.'
  },
  {
    id: 'f10',
    text: 'What are the paid upgrade tiers above the free claim?',
    options: [
      'There is only one $10/month tier',
      'Enhanced ($49/mo), Premium ($79/mo), and Growth Partner ($299/mo) — the basic claim is always free',
      'A single $500 one-time fee',
      'There are no paid tiers'
    ],
    correctAnswer: 1,
    explanation: 'The free claim is $0. Paid tiers are Enhanced ($49), Premium ($79), and Growth Partner ($299/mo).'
  },
  {
    id: 'f11',
    text: 'When an owner is present and willing, what is the ideal outcome (Rung 1)?',
    options: [
      'Leave a card and move to the next stop',
      'Walk them through the claim in person, show them the dashboard, and tee up the Premium upgrade — letting them decide',
      'Force them onto Growth Partner',
      'Take their phone and claim it for them while they work'
    ],
    correctAnswer: 1,
    explanation: 'The Full Win is conducting the claim on the spot, showing live value, and steering toward Premium without pressure.'
  },
  {
    id: 'f12',
    text: 'Which paid tier do you steer an engaged owner toward by default?',
    options: [
      'Enhanced ($49/mo)',
      'Premium ($79/mo)',
      'Growth Partner ($299/mo)',
      'You never mention any upgrade'
    ],
    correctAnswer: 1,
    explanation: 'Premium is the main goal. Growth Partner is presented honestly for ambitious, high-value businesses, but the owner decides.'
  },
  {
    id: 'f13',
    text: 'What is "Growth Partner" ($299/mo)?',
    options: [
      'A cheaper version of the free claim',
      'A full done-for-you AEO service with a dedicated rep who grows the business\'s AI recommendations every month, across the whole AI landscape — not just Top of Temecula',
      'An automated toggle in the dashboard',
      'A one-time event promotion'
    ],
    correctAnswer: 1,
    explanation: 'Growth Partner is human-run and reaches beyond our platform. It includes everything in Premium plus a dedicated rep.'
  },
  {
    id: 'f14',
    text: 'During an in-person upgrade, who completes the purchase?',
    options: [
      'You enter their card to be helpful',
      'The owner completes it themselves on the website, on their own device — you never handle payment',
      'You collect cash and submit it later',
      'The gatekeeper handles it'
    ],
    correctAnswer: 1,
    explanation: 'Every transaction happens on the website, completed by the owner. You guide and encourage but never take payment of any kind.'
  },
  {
    id: 'f15',
    text: 'What does a business get for free, just by claiming, even if they never upgrade?',
    options: [
      'Nothing until they pay',
      'Profile control plus the dashboard — a free marketing platform with AI-citation data and pay-as-you-go a la carte tools (event promotion, press releases, featured job listings)',
      'A guaranteed #1 Google ranking',
      'A free company website'
    ],
    correctAnswer: 1,
    explanation: 'The free claim unlocks a real marketing toolkit. Owners only pay for a la carte pieces they choose — no subscription, no commitment.'
  },
  {
    id: 'f16',
    text: "An interested owner says \"I'll do it later.\" What's the best move?",
    options: [
      'Insist they do it now or leave',
      "Encourage doing it now since it's quick; if not, capture their email for a claim invite, leave the card, and log it",
      'Mark them as not interested and move on',
      'Just leave a card without saying anything'
    ],
    correctAnswer: 1,
    explanation: "That's a committed deferral (Rung 4) — get the commitment, capture the email, leave the card as backup."
  },
  {
    id: 'f17',
    text: "The owner's QR code won't scan during the claim. What do you do?",
    options: [
      'Give up and mark the visit failed',
      'Use the profile URL or pull the profile up yourself, then continue the claim',
      'Tell them their phone is broken',
      'Reschedule for next week'
    ],
    correctAnswer: 1,
    explanation: "A snag is not a no. Recover smoothly so a finicky camera doesn't cost you the claim."
  },
  {
    id: 'f18',
    text: 'An owner asks, "Is this a scam? Who are you really with?" What\'s the best response?',
    options: [
      "Get defensive and insist you're legitimate",
      "Stay calm: introduce yourself as a local Top of Temecula ambassador, point out their profile is already live and free to claim, and offer questions@topoftemecula.com to verify",
      'Walk away immediately',
      "Tell them you're with Google"
    ],
    correctAnswer: 1,
    explanation: 'A calm, transparent answer plus an easy way to verify builds trust. Never claim a false affiliation.'
  },
  {
    id: 'f19',
    text: "You get a question you don't know the answer to. What do you do?",
    options: [
      'Make up a reasonable-sounding answer',
      "Guess at a price so you don't look unsure",
      'Defer — point to the deliverables on the screen, send them to questions@topoftemecula.com, or flag it for your supervisor',
      'Promise a feature and hope it exists'
    ],
    correctAnswer: 2,
    explanation: 'Never improvise a feature, price, or promise. Deferring to the screen or questions@ is always the right move.'
  },
  {
    id: 'f20',
    text: 'You arrive and the business is closed/moved, or the listing info is clearly wrong. What do you do?',
    options: [
      'Pitch the empty storefront anyway',
      "Don't pitch — log exactly what you found (closed, moved, wrong info, duplicate, etc.) so we can correct the profile",
      'Skip it and log nothing',
      'Mark it as a successful claim'
    ],
    correctAnswer: 1,
    explanation: "That's a data correction (Rung 8). Accurate data keeps the directory trustworthy — logging the correction is still a real win."
  }
];

// Legacy export — kept so existing imports don't break.
// The Final Test now uses finalReadinessTestBank with randomized selection.
export const finalReadinessTest = finalReadinessTestBank;
