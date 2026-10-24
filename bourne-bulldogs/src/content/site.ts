/**
 * Every word on the site lives here. Edit text in this file, push to main,
 * and Railway redeploys. Components never hard-code copy.
 *
 * Anything marked TODO is a placeholder waiting on the club to confirm.
 */

export const club = {
  name: "Bourne Bulldogs Basketball Club",
  shortName: "Bourne Bulldogs",
  tagline: "Welcome ballers",
  heroLine: "Youth basketball in Bourne, Lincolnshire. Ages 8 to 16. All abilities.",
  footerTagline: "Basketball England registered youth club. Every Saturday at Bourne Leisure Centre.",
  ages: "ages 8 to 16",
  foundedYear: 2022,
  email: "bournebulldogs@gmail.com",
  phoneDisplay: "07590 421 183",
  phoneHref: "tel:+447590421183",
  phoneE164: "+447590421183",
  basketballEngland: "https://www.basketballengland.co.uk/",
  venue: {
    name: "Bourne Leisure Centre",
    street: "Queen's Rd",
    town: "Bourne",
    county: "Lincolnshire",
    postcode: "PE10 9DX",
    full: "Bourne Leisure Centre, Queen's Rd, Bourne, PE10 9DX",
    mapEmbed: "https://www.google.com/maps?q=Bourne+Leisure+Centre+PE10+9DX&output=embed",
    directions: "https://www.google.com/maps/dir/?api=1&destination=Bourne+Leisure+Centre+Queen%27s+Rd+Bourne+PE10+9DX",
  },
} as const;

export type Session = {
  id: "session-1" | "session-2";
  label: string;
  start: string; // 24h, used for the calendar file
  end: string;
  startDisplay: string;
  endDisplay: string;
};

export const sessions: Session[] = [
  { id: "session-1", label: "Session 1", start: "13:00", end: "14:30", startDisplay: "1:00", endDisplay: "2:30pm" },
  { id: "session-2", label: "Session 2", start: "14:30", end: "16:00", startDisplay: "2:30", endDisplay: "4:00pm" },
];

export const training = {
  day: "Every Saturday",
  length: "1.5 hour sessions",
  summary:
    "Fun, competitive 1.5 hour sessions built around skills and game-led scenarios. Every session includes individual skill development and in-game scenarios, and finishes with a friendly game.",
  steps: [
    { title: "Skill development", body: "Individual work on the fundamentals, pitched at each player's level." },
    { title: "In-game scenarios", body: "Game-led drills that put those skills under real pressure." },
    { title: "Friendly game", body: "Every session finishes with a game. Learning, competition and fun in one." },
  ],
};

export const nav = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/club-overview", label: "Club Overview" },
  { href: "/merch", label: "Merch" },
  { href: "/contact", label: "Contact" },
] as const;

export const home = {
  marquee: [
    "Basketball England registered",
    "Ages 8 to 16",
    "All abilities welcome",
    "DBS checked coaches",
    "NSPCC certified",
    "Every Saturday",
  ],
  ctaPrimary: "Join the pack",
  ctaSecondary: "Training times",
  // Short version for the big scroll-scrubbed intro.
  introLead:
    "A Basketball England registered club in Bourne, Lincolnshire, delivering first-class basketball training for ages 8 to 16. Complete beginner or experienced player, there's a place on court for your child.",
  // Full original welcome copy, tightened.
  welcome: [
    "Located in Bourne, Lincolnshire, our Basketball England registered club is dedicated to delivering first-class basketball training for youth, ages 8 to 16. Whether your child is a complete beginner or an experienced player, we offer an inclusive and supportive environment to learn new skills, improve fitness and learn to work as a team in a fun community environment.",
    "Led by Martin Read, a former national league player and Great Britain Ladies' coach, our training focuses on skills and game-led scenarios, delivered as fun, competitive 1.5 hour sessions. Since opening our doors we've seen tremendous growth in our players, who have developed as individuals (skills and confidence) and as teammates and new friends.",
    "At Bourne Bulldogs we emphasise fitness, skill development and fun, offering a safe local space for our young athletes to thrive through competition and camaraderie within our community.",
    "We welcome you to join our basketball family and be part of a community that's passionate about the game.",
  ],
  stats: [
    { value: 35, label: "Years coaching experience" },
    { value: 8, to: 16, label: "Age range" },
    { value: 2, label: "Saturday sessions" },
    { value: 1.5, decimals: 1, label: "Hour sessions" },
    { value: 2022, from: 1990, label: "The year Bourne got its club" },
  ],
  sessionsHeading: "Training",
  sessionsSub: "Every Saturday at Bourne Leisure Centre",
  coach: {
    eyebrow: "Head coach",
    name: "Martin Read",
    credentials: [
      "Basketball England Level 2 coach",
      "Former national league player",
      "Great Britain ladies' team coach",
      "35 years in the game",
    ],
    link: "Meet the team",
  },
  galleryHeading: "On court",
  safetyHeading: "Safe hands",
  safetySub: "Parents trust us with their kids every Saturday. Here's why.",
  merchHeading: "Rep the pack",
  merchSub: "Personalised club kit with your surname and number on the back.",
  merchCta: "Shop merch",
  willow: {
    heading: "Meet Willow",
    line: "Our English Bulldog, our mascot, and the reason we're called the Bulldogs.",
  },
  finalCta: {
    heading: "Ready to join the pack?",
    body: "Saturdays at Bourne Leisure Centre. Drop us a message and we'll get your child on court.",
    button: "Get your child started",
  },
};

export const about = {
  heading: "About us",
  intro:
    "Bourne Bulldogs Basketball Club is a community committed to nurturing young talent, promoting fitness and building the next generation of confident, team-oriented young athletes.",
  mission: {
    heading: "Our mission",
    lead: "Deliver first-class basketball training to children aged 8+, in an environment where fun, teamwork and competition go hand in hand. The club exists to:",
    points: [
      { title: "Teach the fundamentals", body: "Teach the fundamentals of basketball in a way that's fun, safe and challenging." },
      { title: "Build life skills", body: "Develop life skills like teamwork, communication, leadership and confidence." },
      { title: "Grow a love for the game", body: "Grow a love for the game in children of all skill levels, from complete beginners to experienced players." },
    ],
  },
  story: {
    heading: "Our story",
    // Martin's own words. Keep it in the first person.
    quote:
      "Having retired from playing competitive basketball, in 2022 my family and I moved to the Bourne area, excited to settle into a new community. However, as a basketball-loving family, we were surprised to find there wasn't a local basketball club. To give my children the chance to play, I found myself travelling to other clubs, coaching them along the way. It became clear that Bourne needed its own basketball club, not just for my children, but for others in the community who shared a passion for the game. I started a local Facebook group to gauge interest, and the response was overwhelming. Bourne Bulldogs Basketball Club was born out of that community enthusiasm, and the rest is history!",
    attribution: "Martin Read, Head Coach",
    timeline: [
      { marker: "2022", title: "A move to Bourne", body: "Retired from competitive basketball, Martin and his family move to the Bourne area, excited to settle into a new community." },
      { marker: "01", title: "No local club", body: "A basketball-loving family, surprised to find there wasn't a local basketball club." },
      { marker: "02", title: "On the road", body: "To give his children the chance to play, Martin travels to other clubs, coaching them along the way." },
      { marker: "03", title: "A Facebook group", body: "Bourne clearly needed its own club. A local Facebook group goes up to gauge interest." },
      { marker: "04", title: "The response", body: "The response is overwhelming. Bourne has plenty of kids who share a passion for the game." },
      { marker: "05", title: "Bulldogs are born", body: "Bourne Bulldogs Basketball Club is born out of that community enthusiasm. The rest is history." },
    ],
  },
  community: {
    heading: "Our community",
    body: [
      "We're proud to be rooted in Bourne and the surrounding areas. Our goal is a safe space where children learn, grow and connect with their peers, and where parents can trust their child is in a supportive, positive environment.",
      "We're building a basketball culture that brings people together and inspires lifelong participation in the sport.",
    ],
  },
  closing:
    "Whether your child is just starting out or already has a passion for the game, we're here to help them develop, improve and enjoy basketball in a supportive and exciting environment.",
};

export type TeamMember = {
  name: string;
  role: string;
  bio: string;
  image?: "teamMartin" | "teamElliot" | "teamWillow";
  initials: string;
  photoTodo?: string;
};

export const team: { heading: string; intro: string; members: TeamMember[] } = {
  heading: "Our team",
  intro: "At the heart of Bourne Bulldogs is our dedicated coaching and management team.",
  members: [
    {
      name: "Martin Read",
      role: "Head Coach",
      bio: "Brings 35 years of experience to the club. A Basketball England Level 2 qualified coach, former national league player and a coach for the Great Britain ladies' team, so every player gets top-tier coaching.",
      image: "teamMartin",
      initials: "MR",
    },
    {
      name: "Nicola Read",
      role: "Safeguarding Officer & Club Manager",
      bio: "Keeps the club running smoothly and makes the wellbeing of every child a priority. Nicola is integral to keeping the environment safe, inclusive and fun for everyone involved.",
      initials: "NR",
      // TODO(photo): no photo of Nicola on the old site. Add public/images/team-nicola.jpg,
      // register it in src/content/images.ts as "teamNicola", then set image: "teamNicola" here.
      photoTodo: "Photo coming soon",
    },
    {
      name: "Elliot Read",
      role: "Player & Coach-in-Training",
      bio: "A keen player with huge enthusiasm, planning to gain his coaching licence as soon as he's old enough.",
      image: "teamElliot",
      initials: "ER",
    },
    {
      name: "Willow",
      role: "Official Mascot",
      bio: "The club's English Bulldog and the inspiration for the Bourne Bulldogs name.",
      image: "teamWillow",
      initials: "W",
    },
  ],
};

export const safety = {
  heading: "Safety & standards",
  intro: "We take child protection seriously. This is what every parent can count on, every Saturday.",
  badges: [
    { icon: "shield", title: "Basketball England certified", body: "A fully certified Basketball England club, and every coach is Basketball England certified." },
    { icon: "id", title: "DBS checked", body: "All staff hold up-to-date DBS certificates." },
    { icon: "heart", title: "NSPCC certified", body: "Certified for child protection in sport and physical activity." },
    { icon: "umbrella", title: "Fully insured", body: "The club is fully insured." },
    { icon: "whistle", title: "Safeguarding officer on site", body: "Nicola Read, our Safeguarding Officer, keeps every child's wellbeing front and centre." },
  ],
  points: [
    "Fully certified by Basketball England",
    "All coaches are Basketball England certified",
    "The club is fully insured",
    "All staff hold up-to-date DBS certificates",
    "NSPCC certified for child protection in sport and physical activity",
    "Children are coached at a level that matches their ability and size, for safety and development",
    "A standard of excellence on and off the court: better athletes and better individuals",
  ],
};

export const overview = {
  heading: "Club overview",
  intro: "Weekly Saturday sessions for all skill levels, where every child grows at their own pace.",
  sessionsHeading: "What a session looks like",
  sessionsBody:
    "Every Saturday we give young athletes the fundamental skills they need to excel, in a fun, team-oriented environment. Beginners to seasoned players are all welcome, and every child gets the chance to grow at their own pace.",
  skillsHeading: "Skills & personal growth",
  skillsIntro: "Better basketball, and life skills that last well beyond the court. Kids gain:",
  skills: [
    { key: "team", title: "Teamwork", front: "Learning to play as a team", back: "Passing, spacing and trusting the player next to you." },
    { key: "confidence", title: "Confidence", front: "Building self-confidence", back: "Every made shot and every good pass adds up." },
    { key: "communication", title: "Communication", front: "Communication and listening skills", back: "Calling screens, listening to the coach, talking on defence." },
    { key: "leadership", title: "Leadership", front: "Leadership abilities", back: "Stepping up for teammates when the game gets tight." },
    { key: "fitness", title: "Fitness", front: "Fitness and athleticism", back: "Running, jumping and moving for an hour and a half." },
    { key: "fun", title: "Fun", front: "And above all, having fun", back: "The whole point. Kids who enjoy it keep coming back." },
  ],
  coachingHeading: "Expert coaching, safe environment",
  coachingBody: [
    "Your child's development is in good hands with head coach Martin Read, a Basketball England Level 2 coach and former national league player, whose coaching experience includes the Great Britain ladies' team.",
    "All our coaches are Basketball England certified and the club is fully insured. Safety is a top priority, with all staff holding DBS certificates and NSPCC certification for child protection in sport. Children play at the right ability level for their safety and development.",
  ],
  tournamentsHeading: "Tournaments & competitive play",
  tournamentsBody:
    "Competition is a great way for young players to test their skills, work as a team and grow their love for the game. The club takes part in local tournaments and friendly matches, building teamwork and a sense of community along the way.",
  leagueCallout: { eyebrow: "Next season", title: "Entering a league", body: "We're planning to enter a league next season." },
  whyHeading: "Why choose us",
  whyBody:
    "Since we started, we've loved watching our players grow their game knowledge, their skills and their passion for basketball. Whether your child is a beginner or already obsessed, this is the place for them to thrive.",
  galleryHeading: "Gallery",
};

export type ProductId = "kids-tee" | "adult-tee" | "kids-hoody" | "adult-hoody";

export type Product = {
  id: ProductId;
  name: string;
  short: string;
  price: number;
  audience: "kids" | "adults";
  details: string[];
  sizes: string[];
  sizeNote?: string;
  images: { front: ImageKeyRef; back: ImageKeyRef; sizeChart: ImageKeyRef };
  colour: string; // garment colour for the live preview
};

type ImageKeyRef =
  | "merchKidsTeeFront" | "merchKidsTeeBack" | "sizeKidsTee"
  | "merchAdultTeeFront" | "merchAdultTeeBack" | "sizeAdultTee"
  | "merchKidsHoodyFront" | "merchKidsHoodyBack" | "sizeKidsHoody"
  | "merchAdultHoodyFront" | "merchAdultHoodyBack" | "sizeAdultHoody";

export const merch = {
  heading: "Club merch",
  intro: "Personalised player clothing. Being part of the pack means looking good while doing it!",
  personalisation:
    "Choose a number from 00 to 99 (subject to availability) and get your surname printed across the back. Supporters are welcome to buy player tops but can't have a name and number.",
  howToOrder: {
    heading: "How to order",
    body: "Fill in the form and we'll be in touch to confirm your order and arrange payment.",
    noPayment: "No payment is taken on this website.",
  },
  products: [
    {
      id: "kids-tee",
      name: "Personalised T\u2011Shirt (Kids)",
      short: "Kids T\u2011Shirt",
      price: 23,
      audience: "kids",
      details: ["100% Polyester", "140gsm", "Moisture-wicking Neoteric fabric"],
      sizes: ["3-4", "5-6", "7-8", "9-11", "12-13"],
      sizeNote: "Kids sizes 3-4 up to 12-13",
      images: { front: "merchKidsTeeFront", back: "merchKidsTeeBack", sizeChart: "sizeKidsTee" },
      colour: "#5a5551",
    },
    {
      id: "adult-tee",
      name: "Personalised T\u2011Shirt (Adults)",
      short: "Adult T\u2011Shirt",
      price: 29,
      audience: "adults",
      details: ["100% Cotton", "180gsm", "TRS225"],
      sizes: ["S", "M", "L", "XL", "2XL"],
      sizeNote: "Adult sizes S to 2XL",
      images: { front: "merchAdultTeeFront", back: "merchAdultTeeBack", sizeChart: "sizeAdultTee" },
      colour: "#424045",
    },
    {
      id: "kids-hoody",
      name: "Personalised Hoody (Kids)",
      short: "Kids Hoody",
      price: 29,
      audience: "kids",
      details: [
        "80% Cotton / 20% Polyester",
        "280gsm",
        "Kangaroo pouch pocket",
        "Double-lined hood",
        "No drawcords (complies with EU regulations)",
        "WRAP certified",
      ],
      sizes: ["3-4", "5-6", "7-8", "9-11", "12-13"],
      sizeNote: "Kids sizes 3-4, 5-6, 7-8, 9-11, 12-13",
      images: { front: "merchKidsHoodyFront", back: "merchKidsHoodyBack", sizeChart: "sizeKidsHoody" },
      colour: "#d3d2d1",
    },
    {
      id: "adult-hoody",
      name: "Personalised Hoody (Adult)",
      short: "Adult Hoody",
      price: 35,
      audience: "adults",
      details: [
        "80% Cotton / 20% Polyester",
        "280gsm",
        "WRAP certified",
        "Kangaroo pouch pocket",
        "Drawcord double-lined hood",
      ],
      sizes: ["XS", "S", "M", "L", "XL", "2XL"],
      sizeNote: 'To fit chest: XS 34", S 36", M 40", L 44", XL 48", 2XL 52"',
      images: { front: "merchAdultHoodyFront", back: "merchAdultHoodyBack", sizeChart: "sizeAdultHoody" },
      colour: "#d6d5d4",
    },
  ] satisfies Product[] as Product[],
  form: {
    heading: "Order form",
    previewHeading: "Your shirt",
    previewHint: "Type a surname and pick a number to see it on the back.",
    success: "Order received! We'll be in touch to confirm and arrange payment.",
  },
};

export const contact = {
  heading: "Contact",
  intro: "Questions about joining, training or merch? Send us a message and we'll get back to you.",
  enquiryTypes: [
    { value: "join", label: "My child wants to join" },
    { value: "merch", label: "Merch" },
    { value: "general", label: "General question" },
    { value: "other", label: "Other" },
  ],
  success: "Message sent. We'll be in touch soon.",
};

export const join = {
  heading: "Join the pack",
  intro:
    "Tell us a bit about your child and we'll be in touch about getting them on court. Ages 8 to 16, every ability welcome, Saturdays at Bourne Leisure Centre.",
  button: "Get your child started",
  // TODO(taster): are taster sessions free? If yes, add a line here such as
  // "Your child's first session is a free taster." and it'll show on /join.
  tasterNote: "",
  reassurance: [
    "Basketball England registered club",
    "DBS checked, NSPCC certified coaching",
    "Complete beginners welcome",
  ],
};

export const notFound = {
  heading: "Airball.",
  body: "This page doesn't exist.",
  button: "Back to home",
};

export const seo = {
  home: {
    title: "Bourne Bulldogs Basketball Club | Youth Basketball in Bourne, Lincolnshire",
    description:
      "Basketball England registered youth club in Bourne, Lincolnshire. Saturday training at Bourne Leisure Centre for ages 8 to 16. All skill levels welcome.",
  },
  about: {
    title: "About the Club",
    description:
      "Meet Bourne Bulldogs Basketball Club: our story, our mission, our coaches and our commitment to safety. A community youth club in Bourne, Lincolnshire.",
  },
  overview: {
    title: "Club Overview: Training, Skills & Tournaments",
    description:
      "Saturday training sessions, skill development, tournaments and friendly matches for young players aged 8 to 16 at Bourne Leisure Centre.",
  },
  merch: {
    title: "Personalised Club Merch",
    description:
      "Personalised Bourne Bulldogs T-shirts and hoodies for kids and adults, with your surname and number printed on the back. Order online, pay when we confirm.",
  },
  contact: {
    title: "Contact Us",
    description:
      "Get in touch with Bourne Bulldogs Basketball Club about joining, training or merch. Bourne Leisure Centre, Queen's Rd, Bourne, PE10 9DX.",
  },
  join: {
    title: "Join the Club",
    description:
      "Get your child started at Bourne Bulldogs Basketball Club. Youth basketball for ages 8 to 16 every Saturday at Bourne Leisure Centre.",
  },
};
