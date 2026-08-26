import { useState, useCallback } from 'react';
import IntroScreen from './components/IntroScreen';
import WonderPhase from './components/WonderPhase';
import StoryPhase from './components/StoryPhase';
import SimulatePhase from './components/SimulatePhase';
import PlayPhase from './components/PlayPhase';
import ReflectPhase from './components/ReflectPhase';
import FloatingNumbers from './components/FloatingNumbers';
import { unlockAudioContext, stopNarration, setGlobalAudioEnabled } from './utils/audio';

const PHASES = [
  { id: 'wonder', label: 'Wonder', icon: '🔍', num: '01' },
  { id: 'story', label: 'Story', icon: '📖', num: '02' },
  { id: 'simulate', label: 'Simulate', icon: '🧪', num: '03' },
  { id: 'play', label: 'Practice', icon: '🎮', num: '04' },
  { id: 'reflect', label: 'Reflect', icon: '📓', num: '05' },
];

const STORAGE_KEY = 'intellia_place_value_v1';

function saveProgress(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, timestamp: Date.now() }));
}

export default function App() {
  const [phase, setPhase] = useState('intro');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [playStats, setPlayStats] = useState(null);

  const goHome = useCallback(() => {
    stopNarration();
    setPhase('intro');
  }, []);

  const goToPhase = useCallback((targetPhase) => {
    stopNarration();
    setPhase(targetPhase);
  }, []);

  const toggleAudio = useCallback(() => {
    setAudioEnabled(prev => {
      const next = !prev;
      setGlobalAudioEnabled(next);
      if (next) {
        unlockAudioContext();
      }
      return next;
    });
  }, []);

  const handleStart = useCallback(() => {
    // Unlock audio context on the very first user interaction
    unlockAudioContext();
    setPhase('wonder');
  }, []);

  const handleWonderComplete = useCallback(() => {
    stopNarration();
    setPhase('story');
  }, []);

  const handleStoryComplete = useCallback(() => {
    stopNarration();
    setPhase('simulate');
  }, []);

  const handleSimulateComplete = useCallback(() => {
    stopNarration();
    setPhase('play');
  }, []);

  const handlePlayComplete = useCallback((stats) => {
    stopNarration();
    setPlayStats(stats);
    saveProgress({ phase: 'reflect', stats });
    setPhase('reflect');
  }, []);

  const handleRestart = useCallback(() => {
    stopNarration();
    localStorage.removeItem(STORAGE_KEY);
    setPhase('intro');
    setPlayStats(null);
  }, []);

  const currentPhaseIndex = PHASES.findIndex(p => p.id === phase);

  return (
    <>
      <FloatingNumbers />
      <div className="app-container">
        {/* Top Header & Navigation — visible during phases (not intro) */}
        {phase !== 'intro' && (
          <div className="nav-header-container">
            <button className="home-btn" onClick={goHome} aria-label="Go home">
              🏠 Home
            </button>

            <div className="journey-bar">
              {PHASES.map((p, i) => (
                <div
                  key={p.id}
                  className={`journey-step ${p.id === phase ? 'active' : i < currentPhaseIndex ? 'completed' : ''}`}
                  onClick={() => goToPhase(p.id)}
                  title={`Jump to ${p.label}`}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="journey-step-dot">
                    {i < currentPhaseIndex ? '✓' : p.num}
                  </div>
                  <span className="journey-step-label">{p.icon} {p.label}</span>
                  {i < PHASES.length - 1 && (
                    <div className={`journey-connector ${i < currentPhaseIndex ? 'filled' : ''}`} />
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={toggleAudio}
              className="audio-toggle-btn nav-audio-btn"
              aria-label="Toggle audio"
              title={audioEnabled ? "Mute audio" : "Unmute audio"}
            >
              {audioEnabled ? '🔊' : '🔇'}
            </button>
          </div>
        )}

        {/* Phases */}
        {phase === 'intro' && (
          <IntroScreen
            onStart={handleStart}
          />
        )}

        {phase === 'wonder' && (
          <WonderPhase
            onComplete={handleWonderComplete}
            audioEnabled={audioEnabled}
          />
        )}

        {phase === 'story' && (
          <StoryPhase
            onComplete={handleStoryComplete}
            audioEnabled={audioEnabled}
          />
        )}

        {phase === 'simulate' && (
          <SimulatePhase
            onComplete={handleSimulateComplete}
            audioEnabled={audioEnabled}
          />
        )}

        {phase === 'play' && (
          <PlayPhase
            onComplete={handlePlayComplete}
            audioEnabled={audioEnabled}
          />
        )}

        {phase === 'reflect' && (
          <ReflectPhase
            stats={playStats}
            onRestart={handleRestart}
            onGoHome={goHome}
            audioEnabled={audioEnabled}
          />
        )}
      </div>
    </>
  );
}
