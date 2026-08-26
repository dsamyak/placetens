import { useState, useMemo, useCallback, useEffect } from 'react';
import { generateQuestionBank } from '../utils/questionBank';
import { speak, sounds, stopNarration, narrate, preloadNarration } from '../utils/audio';
import { playWorldNarration } from '../utils/narration';
import QuestionRenderer from './QuestionRenderer';

const WORLDS = [
  { id: 0, name: 'Tens Village', icon: '🏡', color: '#4caf50', desc: 'Tens & Ones (10–99)', difficulty: 1, count: 8 },
  { id: 1, name: 'Hundreds Heights', icon: '🏔️', color: '#ff9800', desc: 'Hundreds (100–999)', difficulty: 2, count: 8 },
  { id: 2, name: 'Thousands Galaxy', icon: '🚀', color: '#e91e63', desc: 'Thousands (1000–9999)', difficulty: 3, count: 8 },
];

function calcXP(attempt, streak) {
  const base = attempt === 1 ? 10 : 5;
  return base + (streak >= 5 ? 5 : 0);
}

function calcStars(correct, total) {
  const pct = correct / total;
  if (pct >= 0.9) return 3;
  if (pct >= 0.7) return 2;
  if (pct >= 0.5) return 1;
  return 0;
}

export default function PlayPhase({ onComplete, audioEnabled }) {
  const allQuestions = useMemo(() => generateQuestionBank(), []);
  const [currentWorld, setCurrentWorld] = useState(-1);
  const [worldResults, setWorldResults] = useState({});
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [feedback, setFeedback] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [xpPopup, setXpPopup] = useState(null);
  const [wordCorrect, setWordCorrect] = useState(0);
  const [worldComplete, setWorldComplete] = useState(false);

  const worldQuestions = useMemo(() => {
    if (currentWorld < 0) return [];
    const w = WORLDS[currentWorld];
    const filtered = allQuestions.filter(q => q.difficulty === w.difficulty);
    return filtered.slice(0, w.count);
  }, [currentWorld, allQuestions]);

  const q = worldQuestions[qIndex];

  const startWorld = useCallback(async (worldId) => {
    setCurrentWorld(worldId);
    setQIndex(0);
    setScore(0);
    setLives(3);
    setStreak(0);
    setWorldComplete(false);
    setFeedback(null);
    setAnswered(false);

    // Play world welcome narration with sync
    if (audioEnabled) {
      const segments = playWorldNarration(WORLDS[worldId].name);
      preloadNarration(segments);
      narrate(segments, audioEnabled);
    }
  }, [audioEnabled]);

  const finishWorld = useCallback(() => {
    const w = WORLDS[currentWorld];
    const stars = calcStars(score, w.count);
    sounds.badge();
    setWorldResults(prev => ({ ...prev, [currentWorld]: { score, total: w.count, stars } }));
    setWorldComplete(true);
  }, [currentWorld, score]);

  const backToMap = useCallback(() => {
    stopNarration();
    setCurrentWorld(-1);
    setWorldComplete(false);
    setFeedback(null);
  }, []);

  const handleAllComplete = useCallback(() => {
    stopNarration();
    const totalScore = Object.values(worldResults).reduce((a, r) => a + r.score, 0) + score;
    const totalQ = Object.values(worldResults).reduce((a, r) => a + r.total, 0) + (worldQuestions.length || 0);
    onComplete({
      score: totalScore, xp: totalXP, maxStreak, wordCorrect, totalAnswered: totalQ,
      worldResults: { ...worldResults, [currentWorld]: { score, total: worldQuestions.length, stars: calcStars(score, worldQuestions.length) } },
    });
  }, [worldResults, score, totalXP, maxStreak, wordCorrect, worldQuestions, currentWorld, onComplete]);

  const advance = useCallback(() => {
    setFeedback(null);
    setAnswered(false);
    if (qIndex + 1 < worldQuestions.length && lives > 0) {
      setQIndex(i => i + 1);
    } else {
      finishWorld();
    }
  }, [qIndex, worldQuestions.length, lives, finishWorld]);

  const handleAnswer = useCallback((isCorrect) => {
    setAnswered(true);
    if (isCorrect) {
      const ns = streak + 1;
      const earned = calcXP(1, ns);
      setScore(s => s + 1);
      setStreak(ns);
      setMaxStreak(ms => Math.max(ms, ns));
      setTotalXP(x => x + earned);
      if (q.type === 'match_numeral_word') setWordCorrect(w => w + 1);
      sounds.correct();
      if (ns >= 5 && ns % 5 === 0) sounds.streak();
      setXpPopup(`+${earned} XP`);
      setTimeout(() => setXpPopup(null), 1500);
      setFeedback({ type: 'correct', message: ns >= 5 ? `🔥 ${ns} Streak!` : 'Correct! 🎉', sub: q.explanation });
      setTimeout(advance, 1800);
    } else {
      setStreak(0);
      setLives(l => l - 1);
      sounds.wrong();
      setFeedback({ type: 'wrong', message: 'Not quite!', sub: q.explanation });
      if (lives - 1 <= 0) {
        setTimeout(finishWorld, 2000);
      } else {
        setTimeout(advance, 2000);
      }
    }
  }, [streak, q, advance, lives, finishWorld]);

  // Read question text aloud when a new question appears
  useEffect(() => {
    if (q && audioEnabled && currentWorld >= 0 && !worldComplete) {
      speak(q.questionText, audioEnabled, 'question');
    }
  }, [qIndex, q, audioEnabled, currentWorld, worldComplete]);

  // World Map View
  if (currentWorld < 0) {
    const allDone = WORLDS.every((_, i) => worldResults[i]);
    return (
      <div className="play-phase">
        <div className="play-header">
          <h2 className="play-title">🎮 Practice — Choose Your World!</h2>
          <p className="play-subtitle">Beat each world to unlock the next one. Earn stars and XP!</p>
          {totalXP > 0 && <div className="play-xp-badge">⭐ {totalXP} XP</div>}
        </div>
        <div className="world-map">
          {WORLDS.map((w, i) => {
            const unlocked = i === 0 || worldResults[i - 1];
            const completed = worldResults[i];
            return (
              <div key={w.id} className={`world-card ${unlocked ? 'unlocked' : 'locked'} ${completed ? 'completed' : ''}`}
                onClick={() => unlocked && startWorld(i)} style={{ '--world-color': w.color }}>
                {!unlocked && <div className="world-lock">🔒</div>}
                <div className="world-icon">{w.icon}</div>
                <div className="world-name">{w.name}</div>
                <div className="world-desc">{w.desc}</div>
                {completed && (
                  <div className="world-stars">
                    {[1, 2, 3].map(s => (<span key={s} style={{ opacity: s <= completed.stars ? 1 : 0.2 }}>⭐</span>))}
                    <span className="world-score">{completed.score}/{completed.total}</span>
                  </div>
                )}
                {unlocked && !completed && <div className="world-play-btn">▶ PRACTICE</div>}
              </div>
            );
          })}
        </div>
        {allDone && (
          <button className="btn btn-green btn-lg" onClick={handleAllComplete} style={{ marginTop: 24, animation: 'bounceIn 0.5s ease' }}>
            🏆 Complete Challenge!
          </button>
        )}
      </div>
    );
  }

  // World Complete View
  if (worldComplete) {
    const w = WORLDS[currentWorld];
    const stars = calcStars(score, w.count);
    const isLastWorld = currentWorld === WORLDS.length - 1;
    return (
      <div className="play-phase">
        <div className="world-complete-card">
          <div className="world-complete-icon">{w.icon}</div>
          <h2 className="world-complete-title">{w.name} Complete!</h2>
          <div className="world-complete-score">{score}/{w.count}</div>
          <div className="world-complete-stars">
            {[1, 2, 3].map(s => (
              <span key={s} className={`world-star ${s <= stars ? 'earned' : ''}`} style={{ animationDelay: `${s * 0.2}s` }}>⭐</span>
            ))}
          </div>
          <div className="world-complete-xp">⭐ {totalXP} XP earned</div>
          <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="btn btn-outline btn-sm" onClick={backToMap}>← World Map</button>
            {isLastWorld ? (
              <button className="btn btn-green" onClick={handleAllComplete}>🏆 Finish!</button>
            ) : (
              <button className="btn btn-primary" onClick={() => {
                setWorldResults(prev => ({ ...prev, [currentWorld]: { score, total: w.count, stars } }));
                startWorld(currentWorld + 1);
              }}>Next World →</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Question View
  if (!q) return null;
  const w = WORLDS[currentWorld];
  const pct = Math.round((qIndex / worldQuestions.length) * 100);

  return (
    <div className="play-phase">
      <div className="play-world-badge" style={{ background: w.color }}>{w.icon} {w.name}</div>
      <div className="hud">
        <div className="hud-item">⭐ {totalXP}</div>
        <div className="hearts">
          {Array.from({ length: 3 }, (_, i) => (<span key={i} style={{ opacity: i < lives ? 1 : 0.2 }}>❤️</span>))}
        </div>
        <div className={`hud-item ${streak >= 5 ? 'streak-fire' : ''}`}>🔥 {streak}x</div>
      </div>
      <div style={{ width: '100%', maxWidth: 700, marginBottom: 16 }}>
        <div className="progress-bar-container">
          <div className="progress-bar-label">
            <span>Question {qIndex + 1}/{worldQuestions.length}</span>
            <span>{pct}%</span>
          </div>
          <div className="progress-bar-track"><div className="progress-bar-fill" style={{ width: `${pct}%` }} /></div>
        </div>
      </div>
      <div className="question-card" style={{ animation: 'slideUp 0.3s ease' }}>
        <QuestionRenderer question={q} onAnswer={handleAnswer} disabled={answered} />
      </div>
      {xpPopup && <div className="xp-popup">{xpPopup}</div>}
      {feedback && (
        <div className="feedback-overlay">
          <div className={`feedback-content ${feedback.type}`}>
            <div className="feedback-emoji">{feedback.type === 'correct' ? '🎉' : '😢'}</div>
            <div className="feedback-message">{feedback.message}</div>
            <div className="feedback-sub">{feedback.sub}</div>
          </div>
        </div>
      )}
    </div>
  );
}
