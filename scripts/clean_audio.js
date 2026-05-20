import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUDIO_DIR = path.resolve(__dirname, '../public/assets/audio');
const MAP_PATH = path.resolve(__dirname, '../src/utils/audioMap.js');

if (!fs.existsSync(AUDIO_DIR)) {
  console.log('Audio directory does not exist. Nothing to clean.');
  process.exit(0);
}

if (!fs.existsSync(MAP_PATH)) {
  console.log('audioMap.js does not exist. Please run generate_audio.js first.');
  process.exit(1);
}

// Rudimentary parsing of audioMap.js to extract filenames
const mapContent = fs.readFileSync(MAP_PATH, 'utf8');
const validFiles = new Set();
const matches = mapContent.match(/\/assets\/audio\/([^"']+)/g);

if (matches) {
  matches.forEach(m => validFiles.add(path.basename(m)));
}

let deleted = 0;
const files = fs.readdirSync(AUDIO_DIR);

files.forEach(file => {
  if (file.endsWith('.mp3') && !validFiles.has(file)) {
    fs.unlinkSync(path.join(AUDIO_DIR, file));
    console.log(`Deleted unused audio: ${file}`);
    deleted++;
  }
});

console.log(`Cleaned up ${deleted} unused audio files.`);
