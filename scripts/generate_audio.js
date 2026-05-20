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

// Helper to get number words for 1-99
const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];

function numberToWord(num) {
  if (num === 0) return 'zero';
  if (num < 10) return ones[num];
  if (num < 20) return teens[num - 10];
  const t = Math.floor(num / 10);
  const o = num % 10;
  return `${tens[t]}${o > 0 ? '-' + ones[o] : ''}`;
}

const phrases = [
  { text: "Welcome to Place Value Tens and Ones!", style: 'encouragement' },
  { text: "Let's find out together!", style: 'encouragement' },
  { text: "Great explanation!", style: 'celebration' },
  { text: "Welcome to Base 10 Blocks!", style: 'encouragement' },
  { text: "Welcome to Tens and Ones!", style: 'encouragement' },
  { text: "Welcome to Expanded Form!", style: 'encouragement' },
  { text: "Welcome to Word Form!", style: 'encouragement' }
];

// Add 1-99 numbers
for (let i = 1; i <= 99; i++) {
  const word = numberToWord(i);
  phrases.push({ text: word, style: 'statement' });
  
  // For simulate phase: "34, 30 + 4"
  const t = Math.floor(i / 10) * 10;
  const o = i % 10;
  if (t > 0 && o > 0) {
    phrases.push({ text: `${i}, ${t} + ${o}`, style: 'statement' });
  } else if (t > 0) {
    phrases.push({ text: `${i}, ${t}`, style: 'statement' });
  } else {
    phrases.push({ text: `${i}, ${o}`, style: 'statement' });
  }
}

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
