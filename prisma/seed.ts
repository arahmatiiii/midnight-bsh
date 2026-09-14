import { PrismaClient, Rarity } from "@prisma/client";

const prisma = new PrismaClient();

const CERTIFICATES: Array<{
  slug: string;
  name: string;
  icon: string;
  description: string;
  funnyDescription: string;
  rarity: Rarity;
}> = [
  {
    slug: "can-drive",
    name: "Can Drive a Car",
    icon: "🚗",
    description: "Self-declared: you can legally operate a motor vehicle.",
    funnyDescription:
      "No test, no DMV, no proof. You said you can drive, so now you can drive.",
    rarity: Rarity.COMMON,
  },
  {
    slug: "true-detective-fan",
    name: "Seen True Detective",
    icon: "🔍",
    description: "You have watched at least one season of True Detective.",
    funnyDescription:
      "Time is a flat circle and so is your commitment to finishing a TV show.",
    rarity: Rarity.COMMON,
  },
  {
    slug: "over-180cm",
    name: "Over 180cm Tall",
    icon: "📏",
    description: "Self-declared height over 180cm.",
    funnyDescription: "We have no way to check. We believe you. Mostly.",
    rarity: Rarity.UNCOMMON,
  },
  {
    slug: "over-21",
    name: "Over 21",
    icon: "🥂",
    description: "Self-declared: you are at least 21 years old.",
    funnyDescription: "Legally an adult. Emotionally, no promises.",
    rarity: Rarity.COMMON,
  },
  {
    slug: "college-graduate",
    name: "College Graduate",
    icon: "🎓",
    description: "You finished a college or university degree.",
    funnyDescription: "Congrats on the debt and the vague sense of dread.",
    rarity: Rarity.UNCOMMON,
  },
  {
    slug: "coffee-enthusiast",
    name: "Coffee Enthusiast",
    icon: "☕",
    description: "You drink coffee regularly and have opinions about it.",
    funnyDescription: "You've said the word 'notes' about a beverage.",
    rarity: Rarity.COMMON,
  },
  {
    slug: "night-owl",
    name: "Certified Night Owl",
    icon: "🦉",
    description: "You're most alive after everyone else has gone to sleep.",
    funnyDescription:
      "This whole app exists between 9pm and 9am. You're basically staff.",
    rarity: Rarity.UNCOMMON,
  },
  {
    slug: "meme-expert",
    name: "Meme Expert",
    icon: "🧠",
    description: "You understand memes faster than they can be explained.",
    funnyDescription: "You saw this joke coming three posts ago.",
    rarity: Rarity.RARE,
  },
  {
    slug: "developer",
    name: "Developer",
    icon: "💻",
    description: "You write code, professionally or otherwise.",
    funnyDescription: "It works on your machine. That's a certificate now.",
    rarity: Rarity.UNCOMMON,
  },
];

async function main() {
  for (const cert of CERTIFICATES) {
    await prisma.certificate.upsert({
      where: { slug: cert.slug },
      update: {
        name: cert.name,
        icon: cert.icon,
        description: cert.description,
        funnyDescription: cert.funnyDescription,
        rarity: cert.rarity,
      },
      create: cert,
    });
  }
  console.log(`Seeded ${CERTIFICATES.length} certificates.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
