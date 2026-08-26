import { useState, useEffect, useCallback } from 'react';
import { speak, narrate, stopNarration, preloadNarration } from '../utils/audio';
import { wonderNarration } from '../utils/narration';

const WONDER_QUESTIONS = [
  {
    question: "Why does the '3' in 30 mean something different from the '3' in 3?",
    spoken: "Why does the digit 3 in thirty mean something different from the digit 3 in three?",
    subtext: "What if every digit has a secret power depending on WHERE it sits?",
    emoji: "🤔",
    bgEmojis: ["🔢", "🤔", "💡", "✨"],
  },
  {
    question: "If you swap the digits of 35 to make 53, why does the number get bigger?",
    spoken: "If you swap the digits of thirty-five to make fifty-three, why does the number get bigger?",
    subtext: "The same digits, but a completely different number! How is that possible?",
    emoji: "🔄",
    bgEmojis: ["🔄", "🔢", "⭐", "🎯"],
  },
  {
    question: "How can you build the number 247 using only tens sticks and unit cubes?",
    spoken: "How can you build the number two hundred forty-seven using only tens sticks and unit cubes?",
    subtext: "What if numbers are like buildings — made from different sized blocks?",
    emoji: "🧱",
    bgEmojis: ["🧱", "🏗️", "💎", "🔍"],
  },
  {
    question: "Why is the number 1000 written with four digits, but it means just one thousand?",
    spoken: "Why is the number one thousand written with four digits, but it means just one thousand?",
    subtext: "There must be a pattern to how digits work together!",
    emoji: "🎯",
    bgEmojis: ["🎯", "🚀", "💫", "🌟"],
  },
  {
    question: "If you have 4 hundreds, 2 tens, and 5 ones, what treasure number have you created?",
    spoken: "If you have four hundreds, two tens, and five ones, what treasure number have you created?",
    subtext: "Numbers are like treasure chests — let's discover what's inside!",
    emoji: "💎",
    bgEmojis: ["💎", "🏆", "🎉", "🌈"],
  },
];

export default function WonderPhase({ onComplete, audioEnabled }) {
  const [wonder] = useState(() => WONDER_QUESTIONS[Math.floor(Math.random() * WONDER_QUESTIONS.length)]);
  const [stage, setStage] = useState(0); // 0=intro, 1=question revealed, 2=sparkle
  const [particles, setParticles] = useState([]);
  const [isNarrating, setIsNarrating] = useState(false);

  const playWonderAudio = useCallback(async () => {
    stopNarration();
    const segments = wonderNarration(wonder.question, wonder.subtext, wonder.spoken);
    preloadNarration(segments);
    setIsNarrating(true);
    try {
      await narrate(segments, audioEnabled);
    } catch (e) {
      console.warn('Wonder narration error:', e);
    }
    setIsNarrating(false);
  }, [audioEnabled, wonder]);

  useEffect(() => {
    // Generate floating particles
    const p = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      emoji: wonder.bgEmojis[i % wonder.bgEmojis.length],
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 8 + Math.random() * 12,
      size: 1.2 + Math.random() * 1.5,
    }));
    setParticles(p);
  }, [wonder]);

  // Auto-start narration when phase loads
  useEffect(() => {
    // Reveal question card and discover button
    const revealTimer = setTimeout(() => {
      setStage(2); // Reveal question & button
    }, 400);

    // Start narration concurrently
    const audioTimer = setTimeout(() => {
      if (audioEnabled) {
        playWonderAudio();
      }
    }, 600);

    return () => {
      clearTimeout(revealTimer);
      clearTimeout(audioTimer);
      stopNarration();
    };
  }, [audioEnabled, playWonderAudio]);

  const handleDiscover = useCallback(() => {
    stopNarration();
    onComplete();
  }, [onComplete]);

  return (
    <div className="wonder-phase">
      {/* Floating particles */}
      <div className="wonder-particles">
        {particles.map(p => (
          <span
            key={p.id}
            className="wonder-particle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              fontSize: `${p.size}rem`,
            }}
          >
            {p.emoji}
          </span>
        ))}
      </div>

      {/* Main content */}
      <div className="wonder-content">
        {/* Big question mark */}
        <div className={`wonder-qmark ${stage >= 1 ? 'revealed' : ''}`}>
          <span className="wonder-qmark-icon">?</span>
          <div className="wonder-qmark-glow" />
        </div>

        {/* Mascot */}
        <div className={`wonder-mascot ${stage >= 1 ? 'visible' : ''}`}>
          <div className="mascot thinking">🐻</div>
          <div className="speech-bubble wonder-bubble">
            Hmm... I wonder... 🤔
          </div>
        </div>

        {/* Wonder question */}
        <div className={`wonder-question-card ${stage >= 1 ? 'visible' : ''}`}>
          <div className="wonder-emoji">{wonder.emoji}</div>
          <h2 className="wonder-question-text">{wonder.question}</h2>
          <p className="wonder-subtext">{wonder.subtext}</p>
          <button
            className="btn btn-outline btn-sm"
            onClick={playWonderAudio}
            style={{ marginTop: 16, fontSize: '0.95rem' }}
          >
            🔊 {isNarrating ? 'Reading Aloud...' : 'Listen Again'}
          </button>
        </div>

        {/* Discover button — visible as soon as content reveals */}
        <button
          className={`btn btn-wonder ${stage >= 1 ? 'visible' : ''}`}
          onClick={handleDiscover}
          id="discover-btn"
        >
          <span className="wonder-btn-sparkle">✨</span>
          Let's Discover!
          <span className="wonder-btn-sparkle">✨</span>
        </button>

        {/* Skip narration button — visible while narrating */}
        {isNarrating && (
          <button
            className="btn btn-outline btn-sm"
            onClick={() => { stopNarration(); setIsNarrating(false); }}
            style={{ marginTop: 12, opacity: 0.8 }}
          >
            Skip Narration ⏭
          </button>
        )}
      </div>
    </div>
  );
}
