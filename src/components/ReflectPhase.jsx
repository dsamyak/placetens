import { useState, useCallback, useEffect } from 'react';
import { numberToWord, expandedForm, decompose } from '../utils/numberWords';
import { speak, sounds } from '../utils/audio';

const REFLECT_QUESTIONS = [
  { q: "What does the digit 5 mean in the number 52?", options: [
    { text: "50 (five tens)", correct: true, emoji: "🧱" },
    { text: "5 (five ones)", correct: false, emoji: "❌" },
    { text: "500 (five hundreds)", correct: false, emoji: "🔄" },
  ]},
  { q: "What is the expanded form of 347?", options: [
    { text: "300 + 40 + 7", correct: true, emoji: "✅" },
    { text: "3 + 4 + 7", correct: false, emoji: "❌" },
    { text: "30 + 40 + 7", correct: false, emoji: "🔄" },
  ]},
  { q: "In the number 2816, which digit is in the hundreds place?", options: [
    { text: "2", correct: false, emoji: "📉" },
    { text: "8", correct: true, emoji: "📈" },
    { text: "1", correct: false, emoji: "❌" },
  ]},
];

const CONFIDENCE_LEVELS = [
  { emoji: '😊', label: "I'm great at place value!", color: '#4caf50' },
  { emoji: '🙂', label: 'I can do most place value!', color: '#ff9800' },
  { emoji: '😐', label: "I'm still learning", color: '#42a5f5' },
];

export default function ReflectPhase({ stats, onRestart, onGoHome, audioEnabled }) {
  const [step, setStep] = useState(0);
  const [teachIdx, setTeachIdx] = useState(0);
  const [teachAnswered, setTeachAnswered] = useState(false);
  const [teachCorrect, setTeachCorrect] = useState(0);
  const [favNum, setFavNum] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState([]);

  const { score = 0, totalAnswered = 0, xp = 0, maxStreak = 0, worldResults = {} } = stats || {};
  const pct = totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;
  const totalStars = Object.values(worldResults).reduce((a, r) => a + (r.stars || 0), 0);

  useEffect(() => {
    if (showConfetti) {
      const pieces = Array.from({ length: 40 }, (_, i) => ({
        id: i, x: Math.random() * 100, delay: Math.random() * 2,
        color: ['#ffc107', '#e91e63', '#4caf50', '#2196f3', '#ff5722', '#9c27b0'][i % 6],
        size: 6 + Math.random() * 10, duration: 2 + Math.random() * 3,
      }));
      setConfettiPieces(pieces);
    }
  }, [showConfetti]);

  const handleTeachAnswer = useCallback((option) => {
    if (teachAnswered) return;
    setTeachAnswered(true);
    if (option.correct) {
      setTeachCorrect(c => c + 1);
      sounds.correct();
      if (audioEnabled) speak('Great explanation!', true);
    } else { sounds.wrong(); }
    setTimeout(() => {
      setTeachAnswered(false);
      if (teachIdx + 1 < REFLECT_QUESTIONS.length) setTeachIdx(i => i + 1);
      else setStep(1);
    }, 1500);
  }, [teachAnswered, teachIdx, audioEnabled]);

  const handleFavSelect = useCallback((num) => {
    setFavNum(num);
    if (audioEnabled) speak(`${num}, ${numberToWord(num)}`, true);
  }, [audioEnabled]);

  const handleConfidenceSelect = useCallback((idx) => {
    setConfidence(idx);
    sounds.badge();
    setShowConfetti(true);
    setTimeout(() => setStep(3), 1000);
  }, []);

  // Step 0: Teach the Mascot
  if (step === 0) {
    const rq = REFLECT_QUESTIONS[teachIdx];
    return (
      <div className="reflect-phase">
        <div className="reflect-header">
          <h3 className="reflect-label">📓 Reflect</h3>
          <p className="reflect-sublabel">Teach the mascot what you learned!</p>
        </div>
        <div className="reflect-card">
          <div className="reflect-mascot-row">
            <div className="mascot thinking" style={{ width: 70, height: 70, fontSize: '2rem' }}>🐻</div>
            <div className="speech-bubble" style={{ maxWidth: 280 }}>Can you help me? {rq.q}</div>
          </div>
          <div className="reflect-options">
            {rq.options.map((opt, i) => (
              <button key={i}
                className={`reflect-option ${teachAnswered ? (opt.correct ? 'correct' : 'wrong') : ''}`}
                onClick={() => handleTeachAnswer(opt)} disabled={teachAnswered}>
                <span className="reflect-option-emoji">{opt.emoji}</span>
                <span>{opt.text}</span>
              </button>
            ))}
          </div>
          <div className="reflect-progress">
            {REFLECT_QUESTIONS.map((_, i) => (
              <div key={i} className={`reflect-dot ${i === teachIdx ? 'active' : i < teachIdx ? 'done' : ''}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Favorite Number
  if (step === 1) {
    const favNums = [25, 47, 100, 253, 500, 777, 1234, 5000, 9999];
    return (
      <div className="reflect-phase">
        <div className="reflect-card">
          <h3 className="reflect-card-title">📝 My Number Journal</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>Pick your favorite number!</p>
          <div className="fav-num-grid">
            {favNums.map(n => (
              <button key={n} className={`fav-num-btn ${favNum === n ? 'selected' : ''}`}
                onClick={() => handleFavSelect(n)}>{n}</button>
            ))}
          </div>
          {favNum !== null && (() => {
            const d = decompose(favNum);
            return (
              <div className="fav-num-display" style={{ animation: 'bounceIn 0.4s ease' }}>
                <div className="fav-num-big">{favNum}</div>
                <div className="fav-num-word">{numberToWord(favNum)}</div>
                <div className="fav-num-decomp">{expandedForm(favNum)}</div>
                <div className="fav-num-blocks">
                  {Array.from({ length: d.thousands }, (_, i) => (
                    <div key={`th${i}`} style={{ width: 24, height: 24, borderRadius: 4, background: 'linear-gradient(135deg, #e91e63, #c2185b)', border: '2px solid #f48fb1' }} />
                  ))}
                  {Array.from({ length: d.hundreds }, (_, i) => (
                    <div key={`h${i}`} style={{ width: 22, height: 22, borderRadius: 4, background: 'linear-gradient(135deg, #4caf50, #2e7d32)', border: '2px solid #81c784' }} />
                  ))}
                  {Array.from({ length: d.tens }, (_, i) => (
                    <div key={`t${i}`} className="ten-stick" style={{ height: 50, width: 16 }} />
                  ))}
                  {Array.from({ length: d.ones }, (_, i) => (
                    <div key={`o${i}`} className="unit-cube" style={{ width: 16, height: 16 }} />
                  ))}
                </div>
              </div>
            );
          })()}
          {favNum !== null && (
            <button className="btn btn-primary" onClick={() => setStep(2)} style={{ marginTop: 20 }}>Continue →</button>
          )}
        </div>
      </div>
    );
  }

  // Step 2: Confidence
  if (step === 2) {
    return (
      <div className="reflect-phase">
        <div className="reflect-card">
          <h3 className="reflect-card-title">How do you feel about place value?</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Be honest — every answer is great!</p>
          <div className="confidence-grid">
            {CONFIDENCE_LEVELS.map((c, i) => (
              <button key={i} className={`confidence-btn ${confidence === i ? 'selected' : ''}`}
                onClick={() => handleConfidenceSelect(i)} style={{ '--conf-color': c.color }}>
                <span className="confidence-emoji">{c.emoji}</span>
                <span className="confidence-label">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Certificate
  return (
    <div className="reflect-phase">
      {showConfetti && (
        <div className="confetti-container">
          {confettiPieces.map(p => (
            <div key={p.id} className="confetti-piece" style={{
              left: `${p.x}%`, animationDelay: `${p.delay}s`,
              backgroundColor: p.color, width: p.size, height: p.size,
              animationDuration: `${p.duration}s`,
            }} />
          ))}
        </div>
      )}
      <div className="certificate-card">
        <div className="cert-badge">🏆</div>
        <h2 className="cert-title">Journey Complete!</h2>
        <p className="cert-subtitle">You finished all 5 phases!</p>
        <div className="score-circle">
          <span className="score-number">{pct}%</span>
          <span className="score-label">{score}/{totalAnswered}</span>
        </div>
        <div style={{ fontSize: '2rem', display: 'flex', gap: 8, justifyContent: 'center', margin: '16px 0' }}>
          {[1, 2, 3].map(i => (
            <span key={i} style={{ opacity: i <= Math.ceil(totalStars / 3) ? 1 : 0.2 }}>⭐</span>
          ))}
        </div>
        <div className="cert-stats">
          <div className="cert-stat">
            <div className="cert-stat-value" style={{ color: 'var(--gold)' }}>{xp}</div>
            <div className="cert-stat-label">XP Earned</div>
          </div>
          <div className="cert-stat">
            <div className="cert-stat-value" style={{ color: 'var(--coral)' }}>🔥 {maxStreak}</div>
            <div className="cert-stat-label">Max Streak</div>
          </div>
          <div className="cert-stat">
            <div className="cert-stat-value" style={{ color: 'var(--green-light)' }}>{teachCorrect}/{REFLECT_QUESTIONS.length}</div>
            <div className="cert-stat-label">Teaching</div>
          </div>
        </div>
        <div className="cert-worlds">
          {Object.entries(worldResults).map(([id, r]) => (
            <div key={id} className="cert-world-item">
              <span>{['🏡', '🏔️', '🚀'][id]}</span>
              <span>{r.score}/{r.total}</span>
              <span>{Array.from({ length: 3 }, (_, i) => i < r.stars ? '⭐' : '☆').join('')}</span>
            </div>
          ))}
        </div>
        <div className="mascot-container" style={{ marginTop: 16 }}>
          <div className="mascot happy" style={{ width: 80, height: 80, fontSize: '2rem' }}>🐻</div>
          <div className="speech-bubble">
            {pct >= 80 ? 'Incredible! You are a Place Value Master! 🏆' : pct >= 50 ? 'Great effort! Keep practicing! 💪' : 'Good start! Try again to improve! 📚'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginTop: 24 }}>
          <button className="btn btn-primary btn-lg" onClick={onRestart}>🔄 Play Again</button>
          <button className="btn btn-secondary" onClick={onGoHome}>🏠 Home</button>
        </div>
      </div>
    </div>
  );
}
