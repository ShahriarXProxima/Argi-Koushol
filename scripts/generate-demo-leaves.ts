import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const targetDir = path.join(process.cwd(), "public", "demo-leaves");
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

interface DemoLeafConfig {
  filename: string;
  title: string;
  titleBn: string;
  badgeText: string;
  badgeBg: string;
  leafFill: string;
  spotSvg: string;
}

const leaves: DemoLeafConfig[] = [
  {
    filename: "late_blight.png",
    title: "Potato Late Blight (Phytophthora)",
    titleBn: "আলুর নাবি ধসা রোগ",
    badgeText: "CRITICAL PATHOGEN",
    badgeBg: "#dc2626",
    leafFill: "#3f6212",
    spotSvg: `
      <!-- Dark necrotic water-soaked lesions with halo -->
      <circle cx="280" cy="220" r="45" fill="#1c1917" opacity="0.85" />
      <circle cx="280" cy="220" r="55" fill="none" stroke="#713f12" stroke-width="4" stroke-dasharray="6,4" />
      <circle cx="340" cy="280" r="35" fill="#292524" opacity="0.8" />
      <circle cx="230" cy="290" r="28" fill="#1c1917" opacity="0.75" />
      <ellipse cx="380" cy="210" rx="25" ry="18" fill="#44403c" opacity="0.9" />
      <!-- Spore rim -->
      <path d="M 240,200 Q 280,180 320,200 Q 300,240 240,200" fill="#f5f5f4" opacity="0.4" />
    `,
  },
  {
    filename: "early_blight.png",
    title: "Tomato/Potato Early Blight (Alternaria)",
    titleBn: "আগাম ধসা রোগ (টার্গেট স্পট)",
    badgeText: "HIGH STRESS",
    badgeBg: "#ea580c",
    leafFill: "#4d7c0f",
    spotSvg: `
      <!-- Concentric ring target lesions -->
      <circle cx="270" cy="230" r="40" fill="#78350f" opacity="0.85" />
      <circle cx="270" cy="230" r="30" fill="none" stroke="#451a03" stroke-width="3" />
      <circle cx="270" cy="230" r="20" fill="none" stroke="#451a03" stroke-width="3" />
      <circle cx="270" cy="230" r="10" fill="#451a03" />
      <circle cx="350" cy="270" r="28" fill="#78350f" opacity="0.75" />
      <circle cx="350" cy="270" r="18" fill="none" stroke="#451a03" stroke-width="2.5" />
      <!-- Yellowing halo -->
      <circle cx="270" cy="230" r="50" fill="none" stroke="#facc15" stroke-width="4" opacity="0.6" />
    `,
  },
  {
    filename: "leaf_spot.png",
    title: "Bacterial Leaf Spot (Xanthomonas)",
    titleBn: "ব্যাকটেরিয়াল পাতার দাগ রোগ",
    badgeText: "WATCH (MEDIUM)",
    badgeBg: "#d97706",
    leafFill: "#65a30d",
    spotSvg: `
      <!-- Small angular necrotic spots -->
      <rect x="250" y="210" width="16" height="14" rx="3" fill="#451a03" opacity="0.9" />
      <rect x="290" y="240" width="18" height="16" rx="4" fill="#451a03" opacity="0.85" />
      <rect x="330" y="200" width="14" height="12" rx="3" fill="#451a03" opacity="0.85" />
      <rect x="270" y="280" width="15" height="15" rx="3" fill="#451a03" opacity="0.8" />
      <rect x="360" y="260" width="12" height="12" rx="2" fill="#451a03" opacity="0.8" />
      <rect x="230" y="250" width="14" height="12" rx="3" fill="#451a03" opacity="0.75" />
      <!-- Translucent water soaked margins -->
      <circle cx="258" cy="217" r="12" fill="none" stroke="#ca8a04" stroke-width="2" opacity="0.5" />
      <circle cx="299" cy="248" r="14" fill="none" stroke="#ca8a04" stroke-width="2" opacity="0.5" />
    `,
  },
  {
    filename: "healthy.png",
    title: "Healthy Leaf Canopy (Control)",
    titleBn: "সুস্থ ও সতেজ ফসল ক্যানোপি",
    badgeText: "HEALTHY (OPTIMAL)",
    badgeBg: "#16a34a",
    leafFill: "#15803d",
    spotSvg: `
      <!-- Lush pristine leaf veins with subtle highlight -->
      <path d="M 200,320 Q 300,240 400,160" stroke="#86efac" stroke-width="3" fill="none" opacity="0.4" />
      <circle cx="320" cy="240" r="6" fill="#86efac" opacity="0.6" />
      <circle cx="360" cy="200" r="4" fill="#86efac" opacity="0.5" />
    `,
  },
];

async function generateLeaves() {
  for (const item of leaves) {
    const svg = `
      <svg width="600" height="450" viewBox="0 0 600 450" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0c130e"/>
            <stop offset="50%" stop-color="#142318"/>
            <stop offset="100%" stop-color="#1b3022"/>
          </linearGradient>
          <linearGradient id="leafGrad" x1="0" y1="0" x2="0.8" y2="0.8">
            <stop offset="0%" stop-color="${item.leafFill}"/>
            <stop offset="100%" stop-color="#1e3a1e"/>
          </linearGradient>
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.6"/>
          </filter>
        </defs>

        <!-- Background -->
        <rect width="600" height="450" fill="url(#bgGrad)" />

        <!-- Grid Pattern -->
        <g stroke="#ffffff" stroke-width="0.5" opacity="0.05">
          <line x1="50" y1="0" x2="50" y2="450" />
          <line x1="150" y1="0" x2="150" y2="450" />
          <line x1="250" y1="0" x2="250" y2="450" />
          <line x1="350" y1="0" x2="350" y2="450" />
          <line x1="450" y1="0" x2="450" y2="450" />
          <line x1="550" y1="0" x2="550" y2="450" />
          <line x1="0" y1="75" x2="600" y2="75" />
          <line x1="0" y1="175" x2="600" y2="175" />
          <line x1="0" y1="275" x2="600" y2="275" />
          <line x1="0" y1="375" x2="600" y2="375" />
        </g>

        <!-- Leaf Silhouette -->
        <g filter="url(#shadow)">
          <!-- Main Leaf Body -->
          <path d="M 120,380 C 140,240 220,100 480,80 C 420,240 320,380 120,380 Z" 
                fill="url(#leafGrad)" stroke="#4ade80" stroke-width="2" opacity="0.95" />
          
          <!-- Midrib and Veins -->
          <path d="M 120,380 Q 280,240 480,80" stroke="#a7f3d0" stroke-width="4" fill="none" opacity="0.75" />
          <path d="M 200,310 Q 250,270 300,285" stroke="#a7f3d0" stroke-width="2.5" fill="none" opacity="0.6" />
          <path d="M 260,250 Q 320,200 370,225" stroke="#a7f3d0" stroke-width="2.5" fill="none" opacity="0.6" />
          <path d="M 330,190 Q 380,150 430,170" stroke="#a7f3d0" stroke-width="2" fill="none" opacity="0.6" />
          
          <path d="M 230,300 Q 210,240 250,210" stroke="#a7f3d0" stroke-width="2" fill="none" opacity="0.5" />
          <path d="M 300,230 Q 280,180 320,150" stroke="#a7f3d0" stroke-width="2" fill="none" opacity="0.5" />

          <!-- Symptoms Spots Overlay -->
          ${item.spotSvg}
        </g>

        <!-- UI Overlay Header -->
        <rect x="24" y="24" width="552" height="60" rx="12" fill="#0f172a" fill-opacity="0.8" stroke="#334155" stroke-width="1" />
        
        <!-- Status Badge -->
        <rect x="36" y="38" width="150" height="30" rx="6" fill="${item.badgeBg}" />
        <text x="111" y="58" font-family="sans-serif" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="1">
          ${item.badgeText}
        </text>

        <!-- Title text -->
        <text x="200" y="48" font-family="sans-serif" font-size="14" font-weight="bold" fill="#f8fafc">
          ${item.title}
        </text>
        <text x="200" y="68" font-family="sans-serif" font-size="12" fill="#94a3b8">
          ${item.titleBn}
        </text>

        <!-- Bottom Tag -->
        <rect x="24" y="395" width="230" height="32" rx="8" fill="#000000" fill-opacity="0.7" stroke="#334155" stroke-width="1" />
        <text x="36" y="416" font-family="monospace" font-size="11" fill="#4ade80">
          ● STAGED DEMO LEAF SAMPLE
        </text>
      </svg>
    `;

    const outPath = path.join(targetDir, item.filename);
    await sharp(Buffer.from(svg)).png().toFile(outPath);
    console.log(`Generated ${outPath}`);
  }
}

generateLeaves().catch(console.error);
