/**
 * narration.js — Semantic narration helpers and phase scripts.
 * 
 * Each helper wraps text into a segment object with a `style` property.
 * Phase functions return arrays of these segments for sequential playback.
 * 
 * IMPORTANT: The `text` field MUST exactly match the text shown in the UI
 * and the text used in generate_audio.js to ensure 1:1 synchronization.
 */

// ─── Semantic Helpers ──────────────────────────────────────────────────────────

/** Standard narration statement — warm, clear. */
export function say(text) {
  return { text, style: 'statement' };
}

/** A question to the learner — curious, inviting. */
export function ask(text) {
  return { text, style: 'question' };
}

/** Warm encouragement — upbeat. */
export function cheer(text) {
  return { text, style: 'encouragement' };
}

/** Emphasis on a key concept — slower, clearer. */
export function emphasize(text) {
  return { text, style: 'emphasis' };
}

/** Thinking aloud — gentle, curious. */
export function think(text) {
  return { text, style: 'thinking' };
}

/** Celebration — fast, joyful. */
export function celebrate(text) {
  return { text, style: 'celebration' };
}

// ─── Phase Narration Scripts ───────────────────────────────────────────────────

/** Intro screen narration — plays when module first loads and user clicks Start. */
export function introNarration() {
  return [
    cheer("Welcome to Place Value Tens and Ones!"),
    say("Ready to discover the secret of numbers?"),
    say("Join Wei Ming on a journey to understand place value."),
    say("How every digit in a number has its own special position and value!"),
  ];
}

/** Wonder phase narration — plays the wonder question aloud. */
export function wonderNarration(questionText) {
  return [
    think("Hmm, I wonder..."),
    ask(questionText),
    cheer("Let's find out together!"),
  ];
}

/** Story phase narration — one segment per story slide. */
export function storyNarration() {
  return [
    say("One morning, Wei Ming looked at the school building. Our classroom is on floor 3, he said. But on the noticeboard, he saw the number 30. Wait, why does the 3 in 30 mean something different from the 3 in floor 3?"),
    say("After school, Wei Ming went to the market. The stall uncle was selling ice cream sticks. I bundle them in groups of 10, he explained. So 4 bundles and 7 loose sticks means you have 47 sticks!"),
    say("The next day, his teacher Mrs Lim brought out special blocks. This flat square has 100 tiny cubes! A long stick has 10 cubes. And this small cube is just 1. She built 253, 2 flats, 5 sticks, and 3 cubes."),
    say("Now Wei Ming understood, every digit has a position, and that position gives it a special value! Ones, tens, hundreds, thousands, each place is ten times bigger than the one before."),
  ];
}

/** Simulate phase station intro narration. */
export function simulateStationNarration(stationId) {
  const narrations = {
    0: [cheer("Welcome to Tens and Ones!"), say("Build numbers with tens sticks and unit cubes.")],
    1: [cheer("Welcome to Hundreds!"), say("Now add hundreds flats to build bigger numbers!")],
    2: [cheer("Welcome to Thousands!"), say("Add thousands cubes for really big numbers!")],
    3: [cheer("Welcome to Expanded Form!"), say("Match numbers to their expanded form!")],
  };
  return narrations[stationId] || [];
}

/** Play phase — world welcome narration. */
export function playWorldNarration(worldName) {
  return [
    cheer(`Welcome to ${worldName}!`),
    say("Answer questions to earn stars and XP!"),
  ];
}

/** Reflect phase narration. */
export function reflectNarration() {
  return [
    say("Let's look back at what you learned today!"),
    ask("Can you teach the mascot about place value?"),
  ];
}

/** Celebration narration. */
export function celebrationNarration() {
  return [
    celebrate("Amazing job!"),
    celebrate("You completed the entire journey!"),
    cheer("You are a Place Value superstar!"),
  ];
}
