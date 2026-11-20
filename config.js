/**
 * ============================================================================
 * THE STAR MAP OF US — PERSONALIZATION CONFIG (PAPI & NUNU)
 * ============================================================================
 * Edit anything inside this file to update text, dates, or photos.
 *
 * Tips:
 * - {{herName}} automatically fills in with "Nunu" (or whatever you set below).
 * - {{yourName}} automatically fills in with "Your Papi".
 * - Prefer editing visually? Open index.html?edit=1 (or press Shift + E)
 *   to customize everything right on the page, then click "Download config.js".
 * ============================================================================
 */

window.STAR_MAP_CONFIG = {
  // Her name (shown in the dedication, top sky bar, and letter salutation)
  herName: "Nunu",

  // Your name (shown in the letter signature)
  yourName: "Your Papi",

  // Optional special date in "YYYY-MM-DD" format (e.g., the day you started fresh).
  // When filled in, a live "Time Since Our Beginning" counter appears in the final letter.
  // Leave as "" to hide the counter.
  specialDate: "",

  // Visual atmosphere: "midnight-gold" | "velvet-rose" | "deep-aurora"
  theme: "midnight-gold",

  // Act I — Opening screen before she enters the sky
  opening: {
    dedication: "A sky written for {{herName}}",
    headline:
      "Even under two different roofs, every star in this sky belongs to you, {{herName}}.",
    subtext:
      "Most of our moments live through a phone screen right now, so I wanted to make you a sky you can hold in your hands. Touch all seven stars slowly.",
    cta: "Step Into Our Sky"
  },

  // Act II — The 7 constellation stars forming the heart
  stars: [
    {
      id: 1,
      roman: "I",
      title: "When I Was Too Blind to See What I Had",
      label: "My biggest wake-up call",
      message: [
        "I want to begin this sky with complete honesty. Earlier in our story, I was foolish — I had the most extraordinary girl right in front of me, and I wasn't loving you the way you always deserved.",
        "You were pure warmth, loyalty, and grace from the very start. The mistake was completely mine for being too blind to see the treasure I had and match the love you naturally carry in your heart."
      ],
      photo: "",
      photoCaption: ""
    },
    {
      id: 2,
      roman: "II",
      title: "The Strength and Beauty of Your Heart",
      label: "Why you are one of a kind",
      message: [
        "What amazes me most about you, {{herName}}, is how rare your heart is. You believed in what we could become with a quiet strength and sincerity I had never seen in anyone before.",
        "I was the stupid one who almost missed the greatest blessing of his life. Finally opening my eyes to who you really are — and how lucky I was to have you — changed me forever."
      ],
      photo: "",
      photoCaption: ""
    },
    {
      id: 3,
      roman: "III",
      title: "The Day I Asked to Start Again",
      label: "Our real beginning",
      message: [
        "I will never forget the day I finally woke up, came to you, apologized for every mistake I had made, and asked if we could start from the very beginning — with me as a completely different man.",
        "You didn't owe me another chance, yet you were generous enough to open your heart to a new beginning. Loving you properly and proving it every single day is the proudest thing I have ever done."
      ],
      photo: "",
      photoCaption: ""
    },
    {
      id: 4,
      roman: "IV",
      title: "Every Mile Disappears When You Call",
      label: "Love across the phone",
      message: [
        "We don't live under the same roof yet, and almost our entire world together lives through phone calls, voice notes, and late-night screens.",
        "Yet the second my phone lights up with your name and I hear your voice on the other end, every mile between us disappears. Even across a phone speaker, you still feel closer to my heart than anyone else on earth."
      ],
      photo: "",
      photoCaption: ""
    },
    {
      id: 5,
      roman: "V",
      title: "The Sound of 'Papi' in Your Voice",
      label: "Our own little world",
      message: [
        "There is nothing in the world that softens me faster than the way you say 'Papi,' or the warm, sweet feeling in my chest every time I call you my 'Nunu.'",
        "Those two little names carry an entire universe that belongs only to us — a quiet place where no distance, no screen, and no bad day can ever touch what we share."
      ],
      photo: "",
      photoCaption: ""
    },
    {
      id: 6,
      roman: "VI",
      title: "Why I Can't Imagine Life Without You",
      label: "Not a single day without my Nunu",
      message: [
        "Let me say this as clearly as I know how: you are the best thing that has ever happened to my life, and I honestly cannot live without you.",
        "I need your voice at the end of my day, your laugh when something makes you happy, and the peace of knowing you are mine. Everything good in my life feels brighter simply because you are in it."
      ],
      photo: "",
      photoCaption: ""
    },
    {
      id: 7,
      roman: "VII",
      title: "Until the Distance Is Finally Zero",
      label: "Always yours, {{herName}}",
      message: [
        "For now, we share our nights through a screen and look up at the same sky from two different places. Every single call brings us one day closer to never having to hang up and say goodnight from afar.",
        "All seven stars are shining for you now, my sweet {{herName}}. Whenever you're ready, open the letter I left waiting at the center of our sky."
      ],
      photo: "",
      photoCaption: ""
    }
  ],

  // Act III — The final love letter unlocked once all 7 stars are lit
  letter: {
    eyebrow: "From Papi to Nunu",
    title: "You Were Always Worth Everything",
    salutation: "My dearest {{herName}},",
    paragraphs: [
      "I look back at our past and shake my head at how blind and foolish I was. I had someone as rare, loving, and unforgettable as you right in front of me, and I didn't love you back the way you always deserved. Coming to you, owning my mistakes, and asking to start from the beginning as a different person was the smartest decision of my entire life.",
      "The truth is simple, {{herName}}: you are the best thing that has ever happened to me. Your heart is the reason we made it here, and loving you the right way has changed who I am from the inside out.",
      "I truly cannot imagine living my life without you. Even though we don't live under the same roof yet and most of our days are shared over the phone, your voice is my peace, your laugh through the speaker is my favorite sound, and hearing you call me Papi melts every worry away.",
      "You deserve to be adored, chosen effortlessly, and treated like the whole world — not just in words, but every single day. I promise to keep showing up as the man you deserve, protecting your smile, and counting down every call until there is zero distance left between us."
    ],
    closing: "Always, completely, and forever,"
  },

  // Gentle whispers revealed when she taps empty night sky
  skyWhispers: [
    "my sweet Nunu",
    "always your Papi",
    "same sky, different places",
    "my favorite phone call",
    "you deserve the whole world",
    "our new beginning",
    "can't live without you, Nunu",
    "the best thing in my life",
    "waiting for zero distance",
    "still choosing you every day"
  ]
};
