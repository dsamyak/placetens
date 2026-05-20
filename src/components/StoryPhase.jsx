import { useState, useEffect, useCallback, useRef } from 'react';
import { speak, stopNarration, preloadNarration } from '../utils/audio';
import { storyNarration } from '../utils/narration';

const STORY_SLIDES = [
  {
    image: '/images/story_school.png',
    title: 'The Number Mystery',
    text: "One morning, Wei Ming looked at the school building. \"Our classroom is on floor 3,\" he said. But on the noticeboard, he saw the number 30. \"Wait... why does the 3 in 30 mean something different from the 3 in floor 3?\"",
    highlight: '"The same digit, but a different value?"',
    mascotText: "Great question! Let's find out! 🔍",
  },
  {
    image: '/images/story_market.png',
    title: 'The Bundle Discovery',
    text: "After school, Wei Ming went to the market. The stall uncle was selling ice cream sticks. \"I bundle them in groups of 10,\" he explained. \"So 4 bundles and 7 loose sticks means you have 47 sticks!\"",
    highlight: '"4 tens + 7 ones = 47!"',
    mascotText: "So THAT is place value! 💡",
  },
  {
    image: '/images/story_classroom.png',
    title: 'Hundreds and Beyond!',
    text: "The next day, his teacher Mrs Lim brought out special blocks. \"This flat square has 100 tiny cubes! A long stick has 10 cubes. And this small cube is just 1.\" She built 253: 2 flats, 5 sticks, and 3 cubes.",
    highlight: '"2 hundreds + 5 tens + 3 ones = 253!"',
    mascotText: "Blocks make it so clear! 🧱",
  },
  {
    image: '/images/story_celebrate.png',
    title: "Let's Explore Together!",
    text: "Now Wei Ming understood: every digit has a position, and that position gives it a special value! Ones, tens, hundreds, thousands — each place is ten times bigger than the one before.",
    highlight: '"Ones → Tens → Hundreds → Thousands!"',
    mascotText: "Your turn to explore! 🚀",
  },
];

export default function StoryPhase({ onComplete, audioEnabled }) {
  const [slide, setSlide] = useState(0);
  const [anim, setAnim] = useState(false);
  const [textVis, setTextVis] = useState(false);
  const [hlVis, setHlVis] = useState(false);
  const [isNarrating, setIsNarrating] = useState(false);
  const narrationSegments = useRef(storyNarration());
  const s = STORY_SLIDES[slide];
  const isLast = slide === STORY_SLIDES.length - 1;
  const pct = ((slide + 1) / STORY_SLIDES.length) * 100;

  // Preload all story narration on mount
  useEffect(() => {
    preloadNarration(narrationSegments.current);
  }, []);

  // Play narration for the current slide when it changes
  useEffect(() => {
    setTextVis(false);
    setHlVis(false);

    const t1 = setTimeout(() => setTextVis(true), 400);

    let cancelled = false;

    const playSlideNarration = async () => {
      // Wait for text to be visible
      await new Promise(r => setTimeout(r, 500));
      if (cancelled) return;

      setIsNarrating(true);

      const segment = narrationSegments.current[slide];
      if (segment && audioEnabled) {
        await speak(segment.text, true, segment.style);
      }

      if (cancelled) return;
      setIsNarrating(false);

      // After narration finishes, show the highlight
      setHlVis(true);
    };

    playSlideNarration();

    return () => {
      cancelled = true;
      stopNarration();
      clearTimeout(t1);
    };
  }, [slide, audioEnabled]);

  const goNext = useCallback(() => {
    if (anim) return;
    stopNarration();
    setIsNarrating(false);
    setAnim(true);
    setTimeout(() => { isLast ? onComplete() : setSlide(i => i + 1); setAnim(false); }, 400);
  }, [anim, isLast, onComplete]);

  const goPrev = useCallback(() => {
    if (anim || slide === 0) return;
    stopNarration();
    setIsNarrating(false);
    setAnim(true);
    setTimeout(() => { setSlide(i => i - 1); setAnim(false); }, 400);
  }, [anim, slide]);

  return (
    <div className="story-phase">
      <div className="story-progress">
        <div className="story-progress-bar"><div className="story-progress-fill" style={{ width: `${pct}%` }} /></div>
        <span className="story-progress-label">{slide + 1} / {STORY_SLIDES.length}</span>
      </div>
      <div className={`story-card ${anim ? 'flipping' : ''}`}>
        <div className="story-image-section">
          <img src={s.image} alt={s.title} className="story-image" />
          <div className="story-image-overlay" />
        </div>
        <div className="story-text-section">
          <h2 className="story-title">{s.title}</h2>
          <p className={`story-text ${textVis ? 'revealed' : ''}`}>{s.text}</p>
          <div className={`story-highlight ${hlVis ? 'visible' : ''}`}>
            <span>✨</span><span className="story-highlight-text">{s.highlight}</span><span>✨</span>
          </div>
          <div className="story-mascot">
            <div className="mascot" style={{ width: 50, height: 50, fontSize: '1.4rem' }}>🐻</div>
            <div className="speech-bubble" style={{ fontSize: '0.8rem', padding: '8px 14px', maxWidth: 180 }}>{s.mascotText}</div>
          </div>
        </div>
      </div>
      <div className="story-nav">
        <button className="btn btn-outline btn-sm" onClick={goPrev} disabled={slide === 0} style={{ opacity: slide === 0 ? 0.3 : 1 }}>← Back</button>
        <div className="story-dots">
          {STORY_SLIDES.map((_, i) => (<div key={i} className={`story-dot ${i === slide ? 'active' : i < slide ? 'completed' : ''}`} />))}
        </div>
        <button className={`btn ${isLast ? 'btn-green' : 'btn-primary'} btn-sm`} onClick={goNext}>
          {isNarrating ? 'Skip ⏭' : isLast ? "🚀 Let's Explore!" : 'Next →'}
        </button>
      </div>
    </div>
  );
}
