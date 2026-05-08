// Number word mappings for 0-9999 (extended for place value topic)
const onesW = ['zero','one','two','three','four','five','six','seven','eight','nine','ten',
  'eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const tensW = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];

export function numberToWord(n) {
  if (n < 0 || !Number.isInteger(n)) return '';
  if (n === 0) return 'zero';
  if (n >= 10000) return String(n);

  let result = '';

  if (n >= 1000) {
    result += onesW[Math.floor(n / 1000)] + ' thousand';
    n = n % 1000;
    if (n > 0) result += ' ';
  }

  if (n >= 100) {
    result += onesW[Math.floor(n / 100)] + ' hundred';
    n = n % 100;
    if (n > 0) result += ' and ';
  }

  if (n >= 20) {
    result += tensW[Math.floor(n / 10)];
    n = n % 10;
    if (n > 0) result += '-' + onesW[n];
  } else if (n > 0) {
    result += onesW[n];
  }

  return result;
}

export function wordToNumber(word) {
  const w = word.toLowerCase().trim();
  for (let i = 0; i <= 9999; i++) {
    if (numberToWord(i) === w) return i;
  }
  return -1;
}

// Generate plausible MCQ distractors
export function generateDistractors(correct, count = 3, min = 0, max = 100) {
  const set = new Set();
  let attempts = 0;
  while (set.size < count && attempts < 100) {
    const offset = Math.ceil(Math.random() * 5) * (Math.random() > 0.5 ? 1 : -1);
    const d = correct + offset;
    if (d >= min && d <= max && d !== correct) set.add(d);
    attempts++;
  }
  return [...set];
}

// Shuffle array (Fisher-Yates)
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Expanded form helper
export function expandedForm(n) {
  if (n === 0) return '0';
  const parts = [];
  if (n >= 1000) { parts.push(`${Math.floor(n / 1000) * 1000}`); n = n % 1000; }
  if (n >= 100) { parts.push(`${Math.floor(n / 100) * 100}`); n = n % 100; }
  if (n >= 10) { parts.push(`${Math.floor(n / 10) * 10}`); n = n % 10; }
  if (n > 0) { parts.push(`${n}`); }
  return parts.join(' + ');
}

// Place value decomposition
export function decompose(n) {
  return {
    thousands: Math.floor(n / 1000),
    hundreds: Math.floor((n % 1000) / 100),
    tens: Math.floor((n % 100) / 10),
    ones: n % 10,
  };
}

// Singapore context names
export const sgNames = ['Megan','Wei Ming','Priya','Raju','Ahmad','Siti','Li Hua','Arjun','Kavitha','Zhi Hao'];
export const sgObjects = ['apples','stickers','marbles','crayons','stars','books','toys','coins','shells','flowers'];
