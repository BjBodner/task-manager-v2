import { useState, useEffect, useRef } from 'react';

function DogSVG({ breed }) {
  const { body, ear, spot, legLength, bodyWidth } = breed;

  // Layout constants (viewBox 0 0 60 48)
  const bx  = 8;                    // body left edge
  const by  = 26;                   // body center y
  const brx = bodyWidth / 2;        // body radius x
  const bry = 7;                    // body radius y
  const hx  = bx + brx * 2 - 4;    // head center x (at right side of body)
  const hy  = by - bry - 3;         // head center y (16)
  const hr  = 10;                   // head radius

  const legY = by + bry - 1;        // leg top y
  const legs = [
    bx + brx * 0.35,
    bx + brx * 0.75,
    bx + brx * 1.25,
    bx + brx * 1.65,
  ];

  return (
    <svg width="60" height="48" viewBox="0 0 60 48" style={{ display: 'block' }}>
      {/* Tail — curls up at left end of body */}
      <path
        d={`M${bx + 2},${by - 2} Q${bx - 5},${by - 11} ${bx},${by - 17}`}
        stroke={ear} strokeWidth="3.5" fill="none" strokeLinecap="round"
      />

      {/* Body */}
      <ellipse cx={bx + brx} cy={by} rx={brx} ry={bry} fill={body} />

      {/* Dalmatian spots */}
      {spot && (
        <>
          <circle cx={bx + brx - 5} cy={by - 2} r={3.5} fill={spot} opacity="0.9" />
          <circle cx={bx + brx + 5} cy={by + 2} r={2.5} fill={spot} opacity="0.9" />
        </>
      )}

      {/* Legs */}
      {legs.map((lx, i) => (
        <rect key={i} x={lx - 2.5} y={legY} width={5} height={legLength} rx={2} fill={body} />
      ))}

      {/* Head */}
      <circle cx={hx} cy={hy} r={hr} fill={body} />

      {/* Ear — floppy, on top-left of head */}
      <ellipse
        cx={hx - hr * 0.45}
        cy={hy - hr * 0.3}
        rx={hr * 0.38}
        ry={hr * 0.62}
        fill={ear}
        transform={`rotate(-20 ${hx - hr * 0.45} ${hy - hr * 0.3})`}
      />

      {/* Eye */}
      <circle cx={hx + 3} cy={hy} r={2} fill="#1a1a1a" />
      <circle cx={hx + 3.7} cy={hy - 0.8} r={0.7} fill="white" />

      {/* Nose */}
      <ellipse cx={hx + hr * 0.78} cy={hy + 2.5} rx={2.8} ry={2} fill="#1a1a1a" />

      {/* Smile */}
      <path
        d={`M${hx + hr * 0.6},${hy + 5} Q${hx + hr * 0.78},${hy + 7} ${hx + hr * 0.95},${hy + 5}`}
        stroke="#1a1a1a" strokeWidth="1.2" fill="none" strokeLinecap="round"
      />
    </svg>
  );
}

export default function Dog({ breed, index }) {
  const [pos, setPos] = useState(() => ({
    x: Math.max(20, Math.min(window.innerWidth  - 80, (window.innerWidth  * (index + 1)) / 4)),
    y: Math.max(20, Math.min(window.innerHeight - 80, (window.innerHeight * (index + 1)) / 4)),
  }));

  // Ref tracks current position for the state-machine closure
  const posRef = useRef(pos);

  const [facing,   setFacing]   = useState('right');
  const [dogState, setDogState] = useState('walking');
  const [showEmoji, setShowEmoji] = useState(null);

  useEffect(() => {
    let timer;

    function tick() {
      // Pick next state with weighted probability
      const r = Math.random();
      let next;
      if      (r < 0.35) next = 'walking';
      else if (r < 0.58) next = 'running';
      else if (r < 0.73) next = 'eating';
      else if (r < 0.85) next = 'sleeping';
      else               next = 'pooping';

      setDogState(next);

      const cur = posRef.current;

      if (next === 'walking') {
        const dx  = (Math.random() - 0.5) * 200;
        const dy  = (Math.random() - 0.5) * 140;
        const newX = Math.max(20, Math.min(window.innerWidth  - 80, cur.x + dx));
        const newY = Math.max(20, Math.min(window.innerHeight - 80, cur.y + dy));
        posRef.current = { x: newX, y: newY };
        setPos({ x: newX, y: newY });
        if (newX !== cur.x) setFacing(newX < cur.x ? 'left' : 'right');
        setShowEmoji(null);
        timer = setTimeout(tick, 2000 + Math.random() * 1500);

      } else if (next === 'running') {
        const dx  = (Math.random() - 0.5) * 380;
        const dy  = (Math.random() - 0.5) * 260;
        const newX = Math.max(20, Math.min(window.innerWidth  - 80, cur.x + dx));
        const newY = Math.max(20, Math.min(window.innerHeight - 80, cur.y + dy));
        posRef.current = { x: newX, y: newY };
        setPos({ x: newX, y: newY });
        if (newX !== cur.x) setFacing(newX < cur.x ? 'left' : 'right');
        setShowEmoji(null);
        timer = setTimeout(tick, 1200 + Math.random() * 800);

      } else if (next === 'eating') {
        setShowEmoji(null);
        timer = setTimeout(tick, 3000 + Math.random() * 2000);

      } else if (next === 'sleeping') {
        setShowEmoji('💤');
        timer = setTimeout(tick, 4500 + Math.random() * 3000);

      } else { // pooping
        setShowEmoji('💩');
        timer = setTimeout(tick, 2000 + Math.random() * 2000);
      }
    }

    // Stagger start so dogs don't all switch states simultaneously
    timer = setTimeout(tick, 600 + index * 500);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        transition: dogState === 'running'
          ? 'left 0.9s ease, top 0.9s ease'
          : 'left 1.6s ease, top 1.6s ease',
      }}
    >
      {/* Outer div: handles facing direction via scaleX */}
      <div style={{ transform: `scaleX(${facing === 'left' ? -1 : 1})`, display: 'inline-block' }}>
        {/* Inner div: receives animation class — keyframes never include scaleX */}
        <div className={`dog--${dogState}`}>
          <DogSVG breed={breed} />
        </div>
      </div>

      {showEmoji && (
        <span
          style={{
            position: 'absolute',
            top: dogState === 'sleeping' ? -22 : 44,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '14px',
            userSelect: 'none',
          }}
        >
          {showEmoji}
        </span>
      )}
    </div>
  );
}
