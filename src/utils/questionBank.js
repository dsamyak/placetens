import { numberToWord, generateDistractors, shuffle, expandedForm, decompose, sgNames, sgObjects } from './numberWords';

function getRangeForDifficulty(difficulty) {
  if (difficulty === 1) return { min: 10, max: 99 };
  if (difficulty === 2) return { min: 100, max: 999 };
  return { min: 1000, max: 9999 };
}

function randInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// Q1: Identify tens digit
function genTensDigit(id, difficulty) {
  const r = getRangeForDifficulty(difficulty);
  const num = randInRange(r.min, r.max);
  const d = decompose(num);
  const correct = String(d.tens);
  const distractors = [d.ones, d.hundreds, (d.tens + 3) % 10].filter(v => v !== d.tens).slice(0, 3);
  return {
    id, type: 'tens_digit', difficulty,
    questionText: `What is the digit in the TENS place of ${num}?`,
    options: shuffle([correct, ...distractors.map(String)]),
    correctAnswer: correct,
    explanation: `In ${num}, the tens digit is ${d.tens}.`,
  };
}

// Q2: Identify value of a digit
function genDigitValue(id, difficulty) {
  const r = getRangeForDifficulty(difficulty);
  const num = randInRange(r.min, r.max);
  const d = decompose(num);
  const places = [];
  if (d.ones > 0) places.push({ place: 'ones', digit: d.ones, value: d.ones });
  if (d.tens > 0) places.push({ place: 'tens', digit: d.tens, value: d.tens * 10 });
  if (d.hundreds > 0) places.push({ place: 'hundreds', digit: d.hundreds, value: d.hundreds * 100 });
  if (d.thousands > 0) places.push({ place: 'thousands', digit: d.thousands, value: d.thousands * 1000 });
  if (places.length === 0) places.push({ place: 'ones', digit: 0, value: 0 });
  const pick = pickRandom(places);
  const correct = String(pick.value);
  const wrongValues = [pick.digit, pick.value * 10, Math.floor(pick.value / 10)].filter(v => v !== pick.value && v > 0).slice(0, 3);
  while (wrongValues.length < 3) wrongValues.push(randInRange(1, 999));
  return {
    id, type: 'digit_value', difficulty,
    questionText: `What is the VALUE of the digit ${pick.digit} in the number ${num}?`,
    options: shuffle([correct, ...wrongValues.filter(v => String(v) !== correct).slice(0, 3).map(String)]),
    correctAnswer: correct,
    explanation: `The digit ${pick.digit} is in the ${pick.place} place, so its value is ${pick.value}.`,
  };
}

// Q3: Build from place values
function genBuildNumber(id, difficulty) {
  const r = getRangeForDifficulty(difficulty);
  const num = randInRange(r.min, r.max);
  const d = decompose(num);
  let qt;
  if (difficulty === 1) qt = `${d.tens} tens and ${d.ones} ones = ?`;
  else if (difficulty === 2) qt = `${d.hundreds} hundreds, ${d.tens} tens, and ${d.ones} ones = ?`;
  else qt = `${d.thousands} thousands, ${d.hundreds} hundreds, ${d.tens} tens, and ${d.ones} ones = ?`;
  return {
    id, type: 'build_number', difficulty,
    questionText: qt,
    visual: difficulty <= 2 ? 'blocks' : undefined,
    visualTens: d.tens, visualOnes: d.ones,
    options: shuffle([String(num), ...generateDistractors(num, 3, r.min, r.max).map(String)]),
    correctAnswer: String(num),
    explanation: `${qt.replace(' = ?', '')} = ${num}.`,
  };
}

// Q4: Expanded form
function genExpandedForm(id, difficulty) {
  const r = getRangeForDifficulty(difficulty);
  const num = randInRange(r.min, r.max);
  const correct = expandedForm(num);
  const wrongNums = generateDistractors(num, 3, r.min, r.max);
  return {
    id, type: 'expanded_form', difficulty,
    questionText: `What is the expanded form of ${num}?`,
    options: shuffle([correct, ...wrongNums.map(n => expandedForm(n))]),
    correctAnswer: correct,
    explanation: `${num} = ${correct}.`,
  };
}

// Q5: Compare place values
function genCompareDigits(id, difficulty) {
  const r = getRangeForDifficulty(difficulty);
  const a = randInRange(r.min, r.max);
  let b = randInRange(r.min, r.max);
  while (b === a) b = randInRange(r.min, r.max);
  const correct = a > b ? String(a) : String(b);
  return {
    id, type: 'compare_digits', difficulty,
    questionText: `Which number is greater: ${a} or ${b}?`,
    options: shuffle([String(a), String(b)]),
    correctAnswer: correct,
    explanation: `${Math.max(a, b)} is greater than ${Math.min(a, b)}.`,
  };
}

// Q6: Word problem with place value
function genWordProblem(id, difficulty) {
  const r = getRangeForDifficulty(difficulty);
  const num = randInRange(r.min, r.max);
  const d = decompose(num);
  const name = pickRandom(sgNames);
  const obj = pickRandom(sgObjects);
  const questionText = `${name} has ${num} ${obj}. How many tens are in this number?`;
  const correct = String(d.tens);
  const distractors = [d.ones, d.hundreds, (d.tens + 2) % 10].filter(v => v !== d.tens).slice(0, 3);
  return {
    id, type: 'word_problem', difficulty,
    questionText,
    options: shuffle([correct, ...distractors.map(String)]),
    correctAnswer: correct,
    explanation: `${num} has ${d.tens} in the tens place.`,
  };
}

// Q7: Ordering by place value
function genOrdering(id, difficulty) {
  const r = getRangeForDifficulty(difficulty);
  const nums = [];
  while (nums.length < 4) {
    const n = randInRange(r.min, r.max);
    if (!nums.includes(n)) nums.push(n);
  }
  const sorted = [...nums].sort((a, b) => a - b);
  return {
    id, type: 'ordering', difficulty,
    questionText: `Arrange from smallest to largest: ${nums.join(', ')}`,
    orderNumbers: nums,
    correctAnswer: sorted.join(','),
    explanation: `Correct order: ${sorted.join(', ')}.`,
  };
}

// Q8: Match numeral to word
function genMatchNumeralWord(id, difficulty) {
  const r = getRangeForDifficulty(difficulty);
  const pairs = [];
  const used = new Set();
  while (pairs.length < 4) {
    const n = randInRange(r.min, Math.min(r.max, 999));
    if (!used.has(n)) { used.add(n); pairs.push({ numeral: String(n), word: numberToWord(n) }); }
  }
  return {
    id, type: 'match_numeral_word', difficulty,
    questionText: 'Match each number to its word form!',
    matchPairs: pairs,
    correctAnswer: pairs,
    explanation: pairs.map(p => `${p.numeral} = ${p.word}`).join(', '),
  };
}

const generators = [
  genTensDigit, genDigitValue, genBuildNumber, genExpandedForm,
  genCompareDigits, genWordProblem, genOrdering, genMatchNumeralWord,
];

const diffDist = [1,1,1,1,2,2,2,2,3,3];

export function generateQuestionBank() {
  const bank = [];
  let qid = 1;
  generators.forEach((gen, gi) => {
    diffDist.forEach(diff => {
      bank.push(gen(`Q${gi + 1}_${String(qid).padStart(3, '0')}`, diff));
      qid++;
    });
  });
  return shuffle(bank);
}

export function generatePracticeSet() {
  const practice = [];
  let qid = 1;
  generators.forEach((gen, gi) => {
    practice.push(gen(`P${gi + 1}_${String(qid).padStart(3, '0')}`, 1));
    qid++;
  });
  return shuffle(practice);
}
