import { useState, useCallback } from 'react';
import { numberToWord, expandedForm } from '../utils/numberWords';
import { speak } from '../utils/audio';

const STATIONS = [
  { id: 0, title: 'Tens & Ones', subtitle: 'Build 2-digit numbers', icon: '🧱' },
  { id: 1, title: 'Hundreds', subtitle: 'Build 3-digit numbers', icon: '🏗️' },
  { id: 2, title: 'Thousands', subtitle: 'Build 4-digit numbers', icon: '🚀' },
  { id: 3, title: 'Expanded Form', subtitle: 'Break numbers apart', icon: '📝' },
];

/* Station 1: Tens & Ones (0-99) */
function Station1({ audioEnabled, onNext }) {
  const [tens, setTens] = useState(2);
  const [ones, setOnes] = useState(3);
  const num = tens * 10 + ones;
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="station-header"><h2>🧱 Tens and Ones</h2></div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
        Build numbers with <strong style={{ color: '#ff9800' }}>tens sticks</strong> and <strong style={{ color: '#42a5f5' }}>unit cubes</strong>.
      </p>
      <div className="simulate-tip">💡 Each tens stick = 10. Each unit cube = 1. Try building your age!</div>
      <div className="place-value-chart">
        <div className="pv-column">
          <span className="pv-label">Tens</span>
          <span className="pv-value" style={{ color: '#ff9800' }}>{tens}</span>
        </div>
        <div className="pv-column">
          <span className="pv-label">Ones</span>
          <span className="pv-value" style={{ color: '#42a5f5' }}>{ones}</span>
        </div>
        <div className="pv-column">
          <span className="pv-label">=</span>
          <span className="pv-value" style={{ color: 'var(--gold)' }}>{num}</span>
        </div>
      </div>
      <div className="blocks-area">
        <div className="tens-column">
          <div className="column-label">Tens</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: tens }, (_, i) => <div key={i} className="ten-stick" />)}
          </div>
        </div>
        <div className="ones-column">
          <div className="column-label">Ones</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 120 }}>
            {Array.from({ length: ones }, (_, i) => <div key={i} className="unit-cube" />)}
          </div>
        </div>
      </div>
      <div className="blocks-controls" style={{ marginTop: 12 }}>
        <div className="block-control-group">
          <span style={{ fontSize: '0.8rem', color: '#ff9800', fontWeight: 700 }}>TENS</span>
          <button className="block-control-btn" onClick={() => { setTens(t => Math.max(0, t - 1)); speak(numberToWord(Math.max(0, tens - 1) * 10 + ones), audioEnabled); }}>−</button>
          <button className="block-control-btn" onClick={() => { setTens(t => Math.min(9, t + 1)); speak(numberToWord(Math.min(9, tens + 1) * 10 + ones), audioEnabled); }}>+</button>
        </div>
        <div className="block-control-group">
          <span style={{ fontSize: '0.8rem', color: '#42a5f5', fontWeight: 700 }}>ONES</span>
          <button className="block-control-btn" onClick={() => { setOnes(o => Math.max(0, o - 1)); speak(numberToWord(tens * 10 + Math.max(0, ones - 1)), audioEnabled); }}>−</button>
          <button className="block-control-btn" onClick={() => { setOnes(o => Math.min(9, o + 1)); speak(numberToWord(tens * 10 + Math.min(9, ones + 1)), audioEnabled); }}>+</button>
        </div>
      </div>
      <div style={{ marginTop: 12, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
        <strong style={{ color: 'var(--gold)' }}>{numberToWord(num)}</strong>
      </div>
      <button className="btn btn-primary" onClick={onNext} style={{ marginTop: 16 }}>Next Station →</button>
    </div>
  );
}

/* Station 2: Hundreds (100-999) */
function Station2({ audioEnabled, onNext }) {
  const [h, setH] = useState(2);
  const [t, setT] = useState(5);
  const [o, setO] = useState(3);
  const num = h * 100 + t * 10 + o;
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="station-header"><h2>🏗️ Hundreds: 100 to 999</h2></div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
        Now add <strong style={{ color: '#4caf50' }}>hundreds flats</strong> to build bigger numbers!
      </p>
      <div className="simulate-tip">💡 Each hundreds flat = 100. It is like 10 tens sticks put together!</div>
      <div className="place-value-chart">
        <div className="pv-column">
          <span className="pv-label">Hundreds</span>
          <span className="pv-value" style={{ color: '#4caf50' }}>{h}</span>
        </div>
        <div className="pv-column">
          <span className="pv-label">Tens</span>
          <span className="pv-value" style={{ color: '#ff9800' }}>{t}</span>
        </div>
        <div className="pv-column">
          <span className="pv-label">Ones</span>
          <span className="pv-value" style={{ color: '#42a5f5' }}>{o}</span>
        </div>
        <div className="pv-column">
          <span className="pv-label">=</span>
          <span className="pv-value" style={{ color: 'var(--gold)' }}>{num}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 24, justifyContent: 'center', alignItems: 'flex-end', margin: '16px 0', flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="column-label" style={{ color: '#4caf50' }}>Hundreds</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: h }, (_, i) => (
              <div key={i} style={{ width: 40, height: 40, borderRadius: 6, background: 'linear-gradient(135deg, #4caf50, #2e7d32)', border: '2px solid #81c784', animation: 'bounceIn 0.3s ease' }} />
            ))}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div className="column-label">Tens</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: t }, (_, i) => <div key={i} className="ten-stick" style={{ height: 60 }} />)}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div className="column-label">Ones</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 80 }}>
            {Array.from({ length: o }, (_, i) => <div key={i} className="unit-cube" style={{ width: 24, height: 24 }} />)}
          </div>
        </div>
      </div>
      <div className="blocks-controls">
        <div className="block-control-group">
          <span style={{ fontSize: '0.7rem', color: '#4caf50', fontWeight: 700 }}>H</span>
          <button className="block-control-btn" onClick={() => { setH(v => Math.max(1, v - 1)); }}>−</button>
          <button className="block-control-btn" onClick={() => { setH(v => Math.min(9, v + 1)); }}>+</button>
        </div>
        <div className="block-control-group">
          <span style={{ fontSize: '0.7rem', color: '#ff9800', fontWeight: 700 }}>T</span>
          <button className="block-control-btn" onClick={() => { setT(v => Math.max(0, v - 1)); }}>−</button>
          <button className="block-control-btn" onClick={() => { setT(v => Math.min(9, v + 1)); }}>+</button>
        </div>
        <div className="block-control-group">
          <span style={{ fontSize: '0.7rem', color: '#42a5f5', fontWeight: 700 }}>O</span>
          <button className="block-control-btn" onClick={() => { setO(v => Math.max(0, v - 1)); }}>−</button>
          <button className="block-control-btn" onClick={() => { setO(v => Math.min(9, v + 1)); }}>+</button>
        </div>
      </div>
      <div style={{ marginTop: 8, color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: '1rem' }}>
        {expandedForm(num)} = <strong>{num}</strong>
      </div>
      <button className="btn btn-primary" onClick={onNext} style={{ marginTop: 16 }}>Next Station →</button>
    </div>
  );
}

/* Station 3: Thousands (1000-9999) */
function Station3({ audioEnabled, onNext }) {
  const [th, setTh] = useState(1);
  const [h, setH] = useState(2);
  const [t, setT] = useState(3);
  const [o, setO] = useState(4);
  const num = th * 1000 + h * 100 + t * 10 + o;
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="station-header"><h2>🚀 Thousands: 1000 to 9999</h2></div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
        Add <strong style={{ color: '#e91e63' }}>thousands cubes</strong> for really big numbers!
      </p>
      <div className="simulate-tip">💡 Each thousands cube = 1000. That is 10 hundreds flats!</div>
      <div className="place-value-chart">
        <div className="pv-column">
          <span className="pv-label">Th</span>
          <span className="pv-value" style={{ color: '#e91e63' }}>{th}</span>
        </div>
        <div className="pv-column">
          <span className="pv-label">H</span>
          <span className="pv-value" style={{ color: '#4caf50' }}>{h}</span>
        </div>
        <div className="pv-column">
          <span className="pv-label">T</span>
          <span className="pv-value" style={{ color: '#ff9800' }}>{t}</span>
        </div>
        <div className="pv-column">
          <span className="pv-label">O</span>
          <span className="pv-value" style={{ color: '#42a5f5' }}>{o}</span>
        </div>
        <div className="pv-column">
          <span className="pv-label">=</span>
          <span className="pv-value" style={{ color: 'var(--gold)' }}>{num}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'flex-end', margin: '16px 0', flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="column-label" style={{ color: '#e91e63' }}>Th</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: th }, (_, i) => (
              <div key={i} style={{ width: 48, height: 48, borderRadius: 8, background: 'linear-gradient(135deg, #e91e63, #c2185b)', border: '2px solid #f48fb1', animation: 'bounceIn 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.6rem', fontWeight: 700 }}>1K</div>
            ))}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div className="column-label" style={{ color: '#4caf50' }}>H</div>
          <div style={{ display: 'flex', gap: 3 }}>
            {Array.from({ length: h }, (_, i) => (
              <div key={i} style={{ width: 32, height: 32, borderRadius: 6, background: 'linear-gradient(135deg, #4caf50, #2e7d32)', border: '2px solid #81c784', animation: 'bounceIn 0.3s ease' }} />
            ))}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div className="column-label">T</div>
          <div style={{ display: 'flex', gap: 3 }}>
            {Array.from({ length: t }, (_, i) => <div key={i} className="ten-stick" style={{ height: 50, width: 20 }} />)}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div className="column-label">O</div>
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', maxWidth: 60 }}>
            {Array.from({ length: o }, (_, i) => <div key={i} className="unit-cube" style={{ width: 18, height: 18 }} />)}
          </div>
        </div>
      </div>
      <div className="blocks-controls">
        {[
          { label: 'Th', color: '#e91e63', val: th, set: setTh, max: 9, min: 1 },
          { label: 'H', color: '#4caf50', val: h, set: setH, max: 9, min: 0 },
          { label: 'T', color: '#ff9800', val: t, set: setT, max: 9, min: 0 },
          { label: 'O', color: '#42a5f5', val: o, set: setO, max: 9, min: 0 },
        ].map(c => (
          <div className="block-control-group" key={c.label}>
            <span style={{ fontSize: '0.7rem', color: c.color, fontWeight: 700 }}>{c.label}</span>
            <button className="block-control-btn" onClick={() => c.set(v => Math.max(c.min, v - 1))}>−</button>
            <button className="block-control-btn" onClick={() => c.set(v => Math.min(c.max, v + 1))}>+</button>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8, color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: '0.95rem' }}>
        {expandedForm(num)} = <strong>{num}</strong>
      </div>
      <button className="btn btn-primary" onClick={onNext} style={{ marginTop: 16 }}>Next Station →</button>
    </div>
  );
}

/* Station 4: Expanded Form Matching */
function Station4({ audioEnabled, onComplete }) {
  const nums = [35, 72, 148, 263];
  const [selected, setSelected] = useState(null);
  const [matched, setMatched] = useState([]);
  const [cards] = useState(() => {
    const numerals = nums.map(n => ({ type: 'numeral', value: String(n), num: n }));
    const expanded = nums.map(n => ({ type: 'expanded', value: expandedForm(n), num: n }));
    return [...numerals, ...expanded].sort(() => Math.random() - 0.5);
  });
  const [wrongPair, setWrongPair] = useState(null);
  const allMatched = matched.length === nums.length;

  const handleClick = (card, idx) => {
    if (matched.includes(card.num)) return;
    if (selected === null) { setSelected({ ...card, idx }); return; }
    if (selected.idx === idx) { setSelected(null); return; }
    if (selected.type === card.type) { setSelected({ ...card, idx }); return; }
    if (selected.num === card.num) {
      const newMatched = [...matched, card.num];
      setMatched(newMatched);
      speak(`${card.num}, ${expandedForm(card.num)}`, audioEnabled);
      setSelected(null);
      // Auto-complete when all matched
      if (newMatched.length === nums.length) {
        setTimeout(() => {
          if (typeof onComplete === 'function') onComplete();
        }, 1200);
      }
    } else {
      setWrongPair([selected.idx, idx]);
      setTimeout(() => setWrongPair(null), 500);
      setSelected(null);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div className="station-header"><h2>📝 Match Numbers to Expanded Form</h2></div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Click a number, then click its expanded form!</p>
      <div className="simulate-tip">💡 Expanded form shows the value of each digit!</div>
      <div className="matching-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', maxWidth: 650 }}>
        {cards.map((card, i) => (
          <div key={i}
            className={`match-card ${matched.includes(card.num) ? 'matched' : ''} ${selected?.idx === i ? 'selected' : ''} ${wrongPair?.includes(i) ? 'wrong' : ''}`}
            onClick={() => handleClick(card, i)} style={{ fontSize: card.type === 'expanded' ? '0.85rem' : '1rem' }}>
            {card.value}
          </div>
        ))}
      </div>
      <p style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        Matched: {matched.length} / {nums.length}
      </p>
      {allMatched && (
        <div style={{ animation: 'bounceIn 0.5s ease', marginTop: 16 }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎉</div>
          <p style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 12 }}>
            All matched! Great job!
          </p>
          <button className="btn btn-green btn-lg" onClick={() => onComplete()}>
            ✅ Continue to Play Phase →
          </button>
        </div>
      )}
      {!allMatched && (
        <button
          className="btn btn-outline btn-sm"
          onClick={() => onComplete()}
          style={{ marginTop: 16 }}
        >
          Skip to Play →
        </button>
      )}
    </div>
  );
}

export default function SimulatePhase({ onComplete, audioEnabled }) {
  const [station, setStation] = useState(0);

  const nextStation = useCallback(() => {
    setStation(s => {
      if (s < 3) return s + 1;
      return s;
    });
  }, []);

  const handleComplete = useCallback(() => {
    if (typeof onComplete === 'function') {
      onComplete();
    }
  }, [onComplete]);

  return (
    <div className="simulate-phase">
      <div className="simulate-header">
        <h3 className="simulate-label">🧪 Simulate</h3>
        <p className="simulate-sublabel">Explore and discover — no wrong answers!</p>
      </div>
      <div className="progress-dots">
        {STATIONS.map((s, i) => (
          <div key={i} className="simulate-dot-wrapper">
            <div className={`progress-dot ${i === station ? 'active' : i < station ? 'completed' : ''}`} />
            <span className="simulate-dot-label">{s.icon}</span>
          </div>
        ))}
      </div>
      <div className="glass-card" style={{ maxWidth: 800, width: '100%', animation: 'slideUp 0.4s ease' }}>
        {station === 0 && <Station1 audioEnabled={audioEnabled} onNext={nextStation} />}
        {station === 1 && <Station2 audioEnabled={audioEnabled} onNext={nextStation} />}
        {station === 2 && <Station3 audioEnabled={audioEnabled} onNext={nextStation} />}
        {station === 3 && <Station4 audioEnabled={audioEnabled} onComplete={handleComplete} />}
      </div>
    </div>
  );
}
