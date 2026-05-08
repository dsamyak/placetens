const JOURNEY_PHASES = [
  { icon: '🔍', label: 'Wonder', desc: 'Spark your curiosity' },
  { icon: '📖', label: 'Story', desc: 'Hear the tale' },
  { icon: '🧪', label: 'Simulate', desc: 'Explore & discover' },
  { icon: '🎮', label: 'Play', desc: 'Test your skills' },
  { icon: '📓', label: 'Reflect', desc: 'What did you learn?' },
];

export default function IntroScreen({ onStart, audioEnabled, onToggleAudio }) {
  return (
    <div className="intro-screen">
      {/* Curriculum badge */}
      <div className="intro-badge">
        ✨ Singapore MOE Curriculum · Grade 1
      </div>

      {/* Title */}
      <h1 className="intro-title">
        Place Value:{' '}
        <span style={{ color: 'var(--gold)' }}>Tens &amp; Ones</span>
      </h1>

      {/* Mascot */}
      <div className="mascot-container">
        <div className="mascot">🐻</div>
        <div className="speech-bubble">
          Ready to discover the secret of numbers? 🎉
        </div>
      </div>

      {/* Description */}
      <p className="intro-desc">
        Join Wei Ming on a journey to understand place value — how every digit in a number has its own special position and value, from ones to thousands!
      </p>

      {/* Journey map */}
      <div className="intro-journey-map">
        <h3 className="intro-journey-title">Your Learning Journey</h3>
        <div className="intro-journey-steps">
          {JOURNEY_PHASES.map((p, i) => (
            <div key={i} className="intro-journey-step">
              <div className="intro-journey-icon">{p.icon}</div>
              <div className="intro-journey-info">
                <div className="intro-journey-label">{p.label}</div>
                <div className="intro-journey-desc">{p.desc}</div>
              </div>
              {i < JOURNEY_PHASES.length - 1 && <div className="intro-journey-arrow">→</div>}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button className="btn btn-primary btn-lg intro-start-btn" onClick={onStart} id="start-journey-btn">
        🚀 Begin Your Journey!
      </button>

      {/* Feature cards */}
      <div className="feature-cards">
        <div className="feature-card">
          <div className="feature-card-icon">🧱</div>
          <div className="feature-card-label">Build Numbers</div>
        </div>
        <div className="feature-card">
          <div className="feature-card-icon">🔢</div>
          <div className="feature-card-label">Place Value</div>
        </div>
        <div className="feature-card">
          <div className="feature-card-icon">🏆</div>
          <div className="feature-card-label">3 Game Worlds</div>
        </div>
      </div>
    </div>
  );
}
