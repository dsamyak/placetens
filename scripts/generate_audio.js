import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure env variables are loaded (rudimentary .env parser for node script)
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#][^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}

const API_KEY = process.env.VITE_ELEVENLABS_API_KEY;
if (!API_KEY || API_KEY === 'your_api_key_here') {
  console.error("Please set a valid VITE_ELEVENLABS_API_KEY in .env.local");
  process.exit(1);
}

const VOICE_ID = 'Xb7hH8MSUJpSbSDYk0k2'; // Alice

const phrases = [
  // Intro Phase
  { text: "Welcome to Place Value Tens and Ones!", style: 'encouragement' },
  { text: "Ready to discover the secret of numbers?", style: 'statement' },
  { text: "Join Wei Ming on a journey to understand place value.", style: 'statement' },
  { text: "How every digit in a number has its own special position and value!", style: 'statement' },

  // Wonder Phase
  { text: "Hmm, I wonder...", style: 'thinking' },
  { text: "Let's find out together!", style: 'encouragement' },
  { text: "Why does the '3' in 30 mean something different from the '3' in 3?", style: 'question' },
  { text: "If you swap the digits of 35 to make 53, why does the number get bigger?", style: 'question' },
  { text: "How can you build the number 247 using only tens sticks and unit cubes?", style: 'question' },
  { text: "Why is the number 1000 written with four digits, but it means just one thousand?", style: 'question' },
  { text: "If you have 4 hundreds, 2 tens, and 5 ones, what treasure number have you created?", style: 'question' },

  // Story Phase
  { text: "One morning, Wei Ming looked at the school building. Our classroom is on floor 3, he said. But on the noticeboard, he saw the number 30. Wait, why does the 3 in 30 mean something different from the 3 in floor 3?", style: 'statement' },
  { text: "After school, Wei Ming went to the market. The stall uncle was selling ice cream sticks. I bundle them in groups of 10, he explained. So 4 bundles and 7 loose sticks means you have 47 sticks!", style: 'statement' },
  { text: "The next day, his teacher Mrs Lim brought out special blocks. This flat square has 100 tiny cubes! A long stick has 10 cubes. And this small cube is just 1. She built 253, 2 flats, 5 sticks, and 3 cubes.", style: 'statement' },
  { text: "Now Wei Ming understood, every digit has a position, and that position gives it a special value! Ones, tens, hundreds, thousands, each place is ten times bigger than the one before.", style: 'statement' },

  // Simulate Phase
  { text: "Welcome to Tens and Ones!", style: 'encouragement' },
  { text: "Build numbers with tens sticks and unit cubes.", style: 'statement' },
  { text: "Welcome to Hundreds!", style: 'encouragement' },
  { text: "Now add hundreds flats to build bigger numbers!", style: 'statement' },
  { text: "Welcome to Thousands!", style: 'encouragement' },
  { text: "Add thousands cubes for really big numbers!", style: 'statement' },
  { text: "Welcome to Expanded Form!", style: 'encouragement' },
  { text: "Match numbers to their expanded form!", style: 'statement' },

  // Play Phase
  { text: "Welcome to Tens Village!", style: 'encouragement' },
  { text: "Welcome to Hundreds Heights!", style: 'encouragement' },
  { text: "Welcome to Thousands Galaxy!", style: 'encouragement' },
  { text: "Answer questions to earn stars and XP!", style: 'statement' },

  // Reflect Phase
  { text: "Let's look back at what you learned today!", style: 'statement' },
  { text: "Can you teach the mascot about place value?", style: 'question' },
  { text: "Amazing job!", style: 'celebration' },
  { text: "You completed the entire journey!", style: 'celebration' },
  { text: "You are a Place Value superstar!", style: 'encouragement' },
  { text: "Great explanation!", style: 'celebration' }
];

const AUDIO_DIR = path.resolve(__dirname, '../public/assets/audio');
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

async function generateAudio() {
  const audioMap = {};
  
  for (let i = 0; i < phrases.length; i++) {
    const { text, style } = phrases[i];
    
    // Create a safe filename
    const safeText = text.replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 30);
    const filename = `audio_${safeText}_${i}.mp3`;
    const filepath = path.join(AUDIO_DIR, filename);
    
    audioMap[text] = `/assets/audio/${filename}`;
    
    if (fs.existsSync(filepath)) {
      console.log(`Skipping existing: ${text}`);
      continue;
    }

    console.log(`Generating: "${text}"`);
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: style === 'celebration' ? 0.3 : 0.5,
            similarity_boost: 0.75,
            style: style === 'statement' ? 0.0 : 0.2,
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        console.error(`Error for "${text}": ${response.status} ${response.statusText}`);
        continue;
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(filepath, buffer);
      
      // small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (err) {
      console.error(`Failed to generate "${text}":`, err.message);
    }
  }

  // Write audioMap.js
  const mapPath = path.resolve(__dirname, '../src/utils/audioMap.js');
  fs.writeFileSync(mapPath, `export const audioMap = ${JSON.stringify(audioMap, null, 2)};\n`);
  console.log('Finished generating audio and updated audioMap.js');
}

generateAudio();
