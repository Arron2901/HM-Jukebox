import React from 'react';
import '../styles/AnimatedBackground.css';

/**
 * Lightweight decorative layer used on the landing page.
 * Static emoji are positioned + animated via CSS so nothing in here re-renders.
 */
const AnimatedBackground = () => {
  return (
    <div className="notes-background">
      <span className="note" style={{ left: '10%', animationDelay: '0s', fontSize: '2rem' }}>🎵</span>
      <span className="note" style={{ left: '20%', animationDelay: '3s', fontSize: '1rem' }}>🎼</span>
      <span className="note" style={{ left: '35%', animationDelay: '7s', fontSize: '2.5rem' }}>🎶</span>
      <span className="note" style={{ left: '50%', animationDelay: '1s', fontSize: '1.5rem' }}>🎵</span>
      <span className="note" style={{ left: '65%', animationDelay: '5s', fontSize: '2rem' }}>🎼</span>
      <span className="note" style={{ left: '80%', animationDelay: '8s', fontSize: '3rem' }}>🎶</span>

      <span className="note" style={{ left: '15%', animationDelay: '10s', fontSize: '1.5rem' }}>♪</span>
      <span className="note" style={{ left: '45%', animationDelay: '12s', fontSize: '2rem' }}>♩</span>
      <span className="note" style={{ left: '75%', animationDelay: '9s', fontSize: '1rem' }}>♭</span>
      <span className="note" style={{ left: '90%', animationDelay: '6s', fontSize: '2.5rem' }}>♮</span>
    </div>
  );
};

export default AnimatedBackground;
