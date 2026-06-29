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
    type?: 'text' | 'script' | 'objection' | 'dosdonts' | 'recall';
    scripts?: { label: string; text: string }[];
    items?: { label: string; text: string; bad?: boolean }[];
    recallPrompts?: { prompt: string; answer: string }[];
  }[];
  quiz: Question[];
  assignment: {
    title: string;
    description: string;
    placeholder: string;
    type: 'text' | 'upload' | 'roleplay';
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
          "• Google: Worldwide and algorithm-driven. We add a curated, local-first discovery channel.",
          "• Yelp: Review-heavy and transactional. We show businesses in a warm, community guide context.",
          "• Social Media: Great for temporary posts that disappear. We provide a lasting local directory profile.",
          "• Their Website: Great, but customers have to find it first. We drive local traffic to it."
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
      description: 'Your first field batch is Insurance Agencies. Find three real Temecula Valley insurance agencies (search on Google Maps or online), look each up on topoftemecula.com, and perform a quick audit. Note: Are they listed? Claimed or unclaimed? Is their name/phone/website accurate? Do they have photos? How would they benefit from claiming their profile and unlocking the AI-citation dashboard?',
      placeholder: 'Agency 1 Name:\nListed on Top of Temecula? (Yes/No):\nClaimed? (Yes/No):\nAccuracy Issues Found:\nHow they would benefit:\n\nAgency 2 Name:\n...',
      type: 'text'
    }
  },

  // ─── DAY 2 ───────────────────────────────────────────────────────────────────
  {
    id: 'day2',
    day: 2,
    title: 'Why Claiming Matters: The Dashboard',
    subtitle: 'Learn the real value hook — the AI-citation tracker — and how to handle pricing.',
    description: 'Understand the free local marketing command center that businesses unlock, how to explain AI search recommendations, and how to handle pricing questions gracefully.',
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
        highlight: "Lead with the claim and the AI dashboard. It is a modern, high-value tool that is completely free to unlock."
      },
      {
        title: 'What Else Is in the Dashboard?',
        content: [
          "Once claimed, the business owner can:",
          "• Monitor their local presence and AI citation scores.",
          "• Edit their profile details (hours, services, social links, photos).",
          "• Access a la carte marketing tools whenever they want them — like press releases, email blasts, and featured placements.",
          "• Track local visitor traffic and profile views."
        ]
      },
      {
        title: 'Pricing: What You Need to Know',
        content: [
          "The free claim is your primary focus. If a business is highly interested and asks about paid options, here is what we offer:",
          "• Free Claim Tier ($0/mo): Basic profile control, business info, and access to the AI-citation dashboard. No credit card ever required.",
          "• Standard Featured Tier ($49/mo): Premium placement in their category, highlighted map pin, and a free social media shoutout on our highly engaged local platforms.",
          "• Elite Verified Tier ($79/mo): Top category ranking, verified local badge, priority email/newsletter placement, and quarterly social media features.",
          "IMPORTANT: You are NOT a salesperson. Do not push paid tiers. If they ask, explain briefly and keep the focus on the free claim. Any paid upgrade is handled by your supervisor directly — never collect payment yourself."
        ],
        highlight: "If they ask about cost: 'The claim and the dashboard are 100% free. There are optional featured tiers starting at $49/month if you ever want extra visibility, but the free claim is the main thing today.'"
      },
      {
        title: 'How to Handle Pricing Questions',
        type: 'script',
        scripts: [
          {
            label: "If they ask: \"How much does this cost?\"",
            text: "\"The claim and the dashboard are 100% free — no credit card required. There are optional featured tiers starting at $49 a month if you ever want extra visibility, but the free claim is the main thing today to make sure your info is correct.\""
          },
          {
            label: "If they ask for exact features of paid tiers:",
            text: "\"The free claim is the best place to start. Once you're in the dashboard, you can see all the optional tiers and features. I can also have someone follow up with you with a complete breakdown if you'd like!\""
          }
        ]
      },
      {
        title: 'Do\'s and Don\'ts of Product Talk',
        type: 'dosdonts',
        items: [
          { label: "DON'T Say", text: "\"This will guarantee you rank #1 on Google search.\"", bad: true },
          { label: "DO Say", text: "\"This gives you a dedicated local presence and shows you how AI tools like ChatGPT recommend you.\"" },
          { label: "DON'T Say", text: "\"You have to upgrade today or your listing will be deleted.\"", bad: true },
          { label: "DO Say", text: "\"Upgrades are completely optional. The free claim is yours forever.\"" },
          { label: "DON'T Say", text: "\"I need your credit card to activate the free dashboard.\"", bad: true },
          { label: "DO Say", text: "\"The claim is free and requires no credit card or payment info at all.\"" }
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
            prompt: "If an owner asks 'How much does this cost?' — what do you say?",
            answer: "The claim and the dashboard are 100% free — no credit card required. There are optional featured tiers starting at $49/month if they ever want extra visibility, but the free claim is the focus today."
          },
          {
            prompt: "What are the three pricing tiers?",
            answer: "Free Claim ($0/mo), Standard Featured ($49/mo), Elite Verified ($79/mo)."
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
        text: 'What is the starting price for the first paid featured tier?',
        options: [
          '$99/month',
          '$29/month',
          '$49/month',
          '$149/month'
        ],
        correctAnswer: 2,
        explanation: 'The Standard Featured Tier starts at $49/month. The Elite Verified Tier is $79/month. Always keep the focus on the free claim first.'
      },
      {
        id: 'q2_3',
        text: 'Does the free claim require a credit card?',
        options: [
          'Yes, for verification purposes',
          'No, the free claim is 100% free and requires zero payment information',
          'Only if they are located in Temecula',
          'Yes, but we refund it immediately'
        ],
        correctAnswer: 1,
        explanation: 'The free claim is completely free and never requires a credit card. Promising this builds high trust.'
      }
    ],
    assignment: {
      title: 'Day 2 Assignment: Write Your Value Pitch',
      description: 'Write a short, 4-sentence pitch explaining why a local insurance agency should claim its free profile on Top of Temecula. Make sure to work in the free claim, the AI-citation tracker in the dashboard, and the low-pressure/no credit card aspect.',
      placeholder: 'Example: "Hi, we already created a free starter profile for your agency on Top of Temecula to help local residents find you. Claiming it is completely free and takes about a minute, with no credit card required. Once claimed, you unlock a free dashboard that actually tracks how often AI tools like ChatGPT are recommending your business to locals. It\'s a great free tool to make sure your info is accurate and see your AI search visibility!"',
      type: 'text'
    }
  },

  // ─── DAY 3 ───────────────────────────────────────────────────────────────────
  {
    id: 'day3',
    day: 3,
    title: 'Field Operations, Safety & Roleplay',
    subtitle: 'Learn the scripts, handle objections, log your data, and master safety rules.',
    description: 'Get fully prepared for the field. Master the scripts, learn how to handle objections, understand strict safety and minor-employment compliance rules, and record your pitch.',
    duration: '4 Hours (Paid)',
    slides: [
      {
        title: 'The Script: Your Field Playbook',
        content: [
          "Depending on how busy the business is, you will use one of three script lengths. Practice these until they feel natural and conversational:",
          "• 10-Second (Very Busy): \"Hi, I'm [Your Name] with Top of Temecula. We created a free starter profile for your business, and I'm just dropping off your claim card so the owner can review and claim it for free.\"",
          "• 30-Second (Standard): \"Hi, I'm [Your Name] with Top of Temecula — a local community guide. We already created a free starter profile for your business. I'm stopping by with your claim card so you can scan it, check the info, and claim it free. Takes about a minute and makes sure locals see the right details.\"",
          "• Full Pitch (Engaged Owner): See next slide..."
        ]
      },
      {
        title: 'The Full Pitch & The AI Hook',
        type: 'script',
        scripts: [
          {
            label: "The Full Pitch Script",
            text: "\"Hi, I'm [Your Name] with Top of Temecula. We help valley residents discover local businesses, events, deals, and guides. We already created a free starter profile for your business — this QR card goes straight to it so you can review it and claim it free. Once you claim, you also get a free dashboard that shows how often AI tools like ChatGPT are recommending your business to local searchers. No credit card required to claim.\""
          }
        ],
        highlight: "Practice delivering this with a warm, friendly, confident, and low-pressure tone."
      },
      {
        title: 'Objection Handling Flashcards',
        type: 'objection',
        scripts: [
          {
            label: "\"Is this really free?\"",
            text: "\"Yes, the basic claim is completely free — no credit card required. There are optional paid featured tiers if you ever want extra visibility, but the claim and dashboard are free.\""
          },
          {
            label: "\"The owner is not here.\"",
            text: "\"No problem! Would it help if we emailed the owner an invitation to claim their free profile? If you have their best email, we can send the invite directly. I'll leave this card for them too.\""
          },
          {
            label: "\"We already have Google / Yelp.\"",
            text: "\"That's great — we don't replace Google. We add a hyper-local discovery channel for Temecula Valley residents, and our dashboard shows you how often AI search tools recommend you. The claim just ensures your local info is accurate.\""
          },
          {
            label: "\"We are not interested.\"",
            text: "\"No problem at all! I'll leave the card in case you want to review the free profile later. Have a wonderful day!\" (Then exit politely — never argue.)"
          }
        ]
      },
      {
        title: 'The Gatekeeper Playbook',
        content: [
          "The most common situation you will face: the owner is NOT there. A front-desk employee, receptionist, or manager greets you instead. This is the Gatekeeper.",
          "Your goal shifts: Win the gatekeeper's trust so they help you get the owner's email.",
          "Key mindset: The gatekeeper is not your obstacle — they are your ally. Make it easy and appealing for them to help you.",
          "The email-invite play: \"No problem! Would it be okay if we sent the owner a direct email invitation to claim their free profile? It's a quick link they can review on their own time — no commitment. What's the best email to reach them?\""
        ],
        highlight: "Capturing a valid owner email is a high-value lead. Treat it like a claim win."
      },
      {
        title: 'Gatekeeper Scripts',
        type: 'script',
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
            label: "If they're hesitant to share the email",
            text: "\"Totally understand — I'll leave this claim card for them too. If you do have a chance to mention it, the profile is already live and the claim is free. Have a great day!\""
          }
        ]
      },
      {
        title: 'Safety & Compliance (Non-Negotiable)',
        content: [
          "Your safety is 100x more important than any business claim. Follow these rules strictly:",
          "1. Driving: You are authorized to drive your personal vehicle between routes. Obey all traffic laws. NO PHONE USE while moving. Pull over safely to check routes or log visits.",
          "2. Public Storefronts Only: Only enter public commercial spaces during regular business hours. Never enter private homes, warehouses, back rooms, or employee-only areas.",
          "3. No Cash/Checks: Never accept cash, checks, or write down credit card numbers. All upgrades happen securely online.",
          "4. Location Sharing: You must share your live location with your supervisor at the start of every shift and check out at the end."
        ],
        highlight: "If anyone is rude, aggressive, or makes you uncomfortable, leave immediately. No questions asked. Call your supervisor."
      },
      {
        title: 'CRM Logging: If It Isn\'t Logged, It Didn\'t Happen',
        type: 'dosdonts',
        items: [
          { label: "Good CRM Note", text: "\"Owner out. Spoke with Sarah (front desk). Got owner email (mike@valleyins.com) for claim invite. Left card. Sarah says owner is in mornings. Interested in the AI dashboard.\"" },
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
          { label: "Always Get Permission First", text: "Before filming inside a business, ask the owner or manager: 'Would it be okay if I captured a quick clip of your storefront for our local guide?'" },
          { label: "NEVER Film", text: "Customers, payment areas, registers, employee-only areas, or anyone who hasn't given permission. This is a hard rule.", bad: true },
          { label: "Log It", text: "Note in your CRM that you captured content and what you filmed. Your supervisor reviews all content before it goes live." }
        ],
        highlight: "Content capture is optional and only happens when the owner enthusiastically agrees. When in doubt, skip it and focus on the claim."
      },
      {
        title: 'Active Recall: Day 3 Check',
        type: 'recall',
        recallPrompts: [
          {
            prompt: "What is the Gatekeeper Playbook? What is your goal when the owner isn't there?",
            answer: "Win the gatekeeper's trust so they help you get the owner's email. The email-invite play: ask if you can send the owner a direct invitation to claim their free profile."
          },
          {
            prompt: "What is the strict rule about phone use while driving?",
            answer: "Zero phone use while moving. Pull over safely to check routes, text, or log visits in the CRM. No exceptions."
          },
          {
            prompt: "What do you do if a business owner is aggressive or tells you to leave?",
            answer: "Leave immediately. No arguing, no second pitch. Walk safely to your car and call your supervisor. Your safety is the absolute priority."
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
      }
    ],
    assignment: {
      title: 'Day 3 Assignment: Roleplay Recording',
      description: 'Practice the scripts and objection handling. Then, record a short audio or video clip (1-2 minutes) of yourself delivering the full pitch as if you just walked into a local insurance agency. Include: Intro -> Free Claim & AI Dashboard Pitch -> Response to "Is this really free?" or "We already have Google" -> Polite Close. Upload the recording to Google Drive or YouTube (unlisted) and paste the link below.',
      placeholder: 'Paste your Google Drive, Dropbox, or Loom recording link here...',
      type: 'roleplay'
    }
  }
];

export const finalReadinessTest: Question[] = [
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
    text: 'What is the correct starting price for the Standard Featured paid tier?',
    options: [
      '$29/month',
      '$99/month',
      '$49/month',
      '$79/month'
    ],
    correctAnswer: 2,
    explanation: 'The Standard Featured Tier is $49/month. The Elite Verified Tier is $79/month. The basic claim is always free.'
  }
];
