import { ethers } from "hardhat";

const CERT_NAMES = [
  "Can Drive a Car",
  "Seen True Detective",
  "Over 180cm Tall",
  "Over 21",
  "College Graduate",
  "Coffee Enthusiast",
  "Certified Night Owl",
  "Meme Expert",
  "Developer",
];
const CERT_ICONS = ["🚗", "🔍", "📏", "🥂", "🎓", "☕", "🦉", "🧠", "💻"];

async function main() {
  const startHour = Number(process.env.NIGHT_START_HOUR_UTC ?? 21);
  const endHour = Number(process.env.NIGHT_END_HOUR_UTC ?? 9);

  const Factory = await ethers.getContractFactory("MidnightBSH");
  const contract = await Factory.deploy(CERT_NAMES, CERT_ICONS, startHour, endHour);
  await contract.waitForDeployment();

  console.log("MidnightBSH deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
