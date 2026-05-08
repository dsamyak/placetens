import { useState, useCallback } from 'react';

// Renders visual elements for questions (ten-frames, blocks, objects)
function Visual({ question }) {
  if (!question.visual) return null;

  if (question.visual === 'tenframe') {
    return (
      <div className="ten-frame" style={{ pointerEvents: 'none', marginBottom: 16 }}>
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className={`ten-frame-cell ${i < question.visualCount ? 'filled' : ''}`}
            style={{ width: 40, height: 40 }}>
            {i < question.visualCount ? '⭐' : ''}
          </div>
        ))}
      </div>
    );
  }

  if (question.visual === 'blocks') {
    return (
      <div className="blocks-area" style={{ minHeight: 120, marginBottom: 16 }}>
        <div className="tens-column">
          <div className="column-label">Tens</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: question.visualTens || 0 }, (_, i) => (
              <div key={i} className="ten-stick" style={{ height: 80 }} />
            ))}
          </div>
        </div>
        <div className="ones-column">
          <div className="column-label">Ones</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 100 }}>
            {Array.from({ length: question.visualOnes || 0 }, (_, i) => (
              <div key={i} className="unit-cube" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (question.visual === 'objects') {
    const emojis = { apples: '🍎', stickers: '⭐', marbles: '🔵', crayons: '🖍️', stars: '⭐', books: '📚', toys: '🧸', coins: '🪙', shells: '🐚', flowers: '🌸' };
    const emoji = emojis[question.visualObject] || '⭐';
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', margin: '12px 0 20px', maxWidth: 300, marginLeft: 'auto', marginRight: 'auto' }}>
        {Array.from({ length: question.visualCount }, (_, i) => (
          <span key={i} style={{ fontSize: '1.8rem', animation: `bounceIn ${0.2 + i * 0.05}s ease` }}>{emoji}</span>
        ))}
      </div>
    );
  }
  return null;
}

// Matching question type
function MatchingRenderer({ question, onAnswer, disabled }) {
  const [selected, setSelected] = useState(null);
  const [matched, setMatched] = useState([]);
  const [wrongPair, setWrongPair] = useState(null);
  const pairs = question.matchPairs || [];

  const allCards = useState(() => {
    const numerals = pairs.map(p => ({ type: 'numeral', value: p.numeral, num: parseInt(p.numeral) }));
    const words = pairs.map(p => ({ type: 'word', value: p.word, num: parseInt(p.numeral) }));
    return [...numerals, ...words].sort(() => Math.random() - 0.5);
  })[0];

  const handleClick = (card, idx) => {
    if (disabled || matched.includes(card.num)) return;
    if (selected === null) { setSelected({ ...card, idx }); return; }
    if (selected.idx === idx) { setSelected(null); return; }
    if (selected.type === card.type) { setSelected({ ...card, idx }); return; }
    if (selected.num === card.num) {
      const newMatched = [...matched, card.num];
      setMatched(newMatched);
      setSelected(null);
      if (newMatched.length === pairs.length) {
        setTimeout(() => onAnswer(true), 500);
      }
    } else {
      setWrongPair([selected.idx, idx]);
      setTimeout(() => setWrongPair(null), 500);
      setSelected(null);
    }
  };

  return (
    <div className="matching-grid">
      {allCards.map((card, i) => (
        <div key={i}
          className={`match-card ${matched.includes(card.num) ? 'matched' : ''} ${selected?.idx === i ? 'selected' : ''} ${wrongPair?.includes(i) ? 'wrong' : ''}`}
          onClick={() => handleClick(card, i)}>
          {card.value}
        </div>
      ))}
    </div>
  );
}

// Ordering question type
function OrderingRenderer({ question, onAnswer, disabled }) {
  const [order, setOrder] = useState(() => [...question.orderNumbers]);
  const [dragIdx, setDragIdx] = useState(null);

  const swap = (i, j) => {
    if (disabled) return;
    const newOrder = [...order];
    [newOrder[i], newOrder[j]] = [newOrder[j], newOrder[i]];
    setOrder(newOrder);
  };

  const checkAnswer = () => {
    const isCorrect = order.join(',') === question.correctAnswer;
    onAnswer(isCorrect);
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '16px 0', flexWrap: 'wrap' }}>
        {order.map((num, i) => (
          <div key={i} className="option-btn" style={{ minWidth: 60, cursor: 'pointer', padding: '12px 20px' }}
            onClick={() => {
              if (dragIdx === null) setDragIdx(i);
              else { swap(dragIdx, i); setDragIdx(null); }
            }}
            >
            <span style={{ borderBottom: dragIdx === i ? '2px solid var(--gold)' : 'none' }}>{num}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
        Click two numbers to swap their positions. Arrange smallest → largest.
      </p>
      <button className="btn btn-primary btn-sm" onClick={checkAnswer} disabled={disabled}>
        Check Order ✓
      </button>
    </div>
  );
}

// Main Question Renderer
export default function QuestionRenderer({ question, onAnswer, disabled, showHint }) {
  const [selectedOption, setSelectedOption] = useState(null);

  const handleOptionClick = useCallback((option) => {
    if (disabled) return;
    setSelectedOption(option);
    const isCorrect = option === question.correctAnswer;
    setTimeout(() => {
      onAnswer(isCorrect);
      setSelectedOption(null);
    }, 600);
  }, [disabled, question.correctAnswer, onAnswer]);

  if (question.type === 'match_numeral_word') {
    return (
      <div>
        <p className="question-text">{question.questionText}</p>
        <MatchingRenderer question={question} onAnswer={onAnswer} disabled={disabled} />
      </div>
    );
  }

  if (question.type === 'ordering') {
    return (
      <div>
        <p className="question-text">{question.questionText}</p>
        <OrderingRenderer question={question} onAnswer={onAnswer} disabled={disabled} />
      </div>
    );
  }

  // Default: MCQ with optional visual
  return (
    <div>
      <p className="question-text">{question.questionText}</p>
      <Visual question={question} />
      {question.options && (
        <div className="options-grid">
          {question.options.map((opt, i) => {
            let cls = 'option-btn';
            if (disabled) cls += ' disabled';
            if (selectedOption === opt) {
              cls += opt === question.correctAnswer ? ' correct' : ' wrong';
            } else if (disabled && opt === question.correctAnswer) {
              cls += ' correct';
            }
            return (
              <button key={i} className={cls} onClick={() => handleOptionClick(opt)}>
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
