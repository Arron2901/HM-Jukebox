import React, { useEffect, useRef, useState } from "react";

/**
 * MarqueeText animates overflowing labels by gently sliding them left/right.
 * It measures the rendered width so short titles stay static (no wasted space).
 */
const MarqueeText = ({ as: Component = "div", className = "", children }) => {
  const textRef = useRef(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const updateOverflow = () => {
      const overflowAmount = el.scrollWidth - el.clientWidth;
      if (overflowAmount > 2) {
        el.style.setProperty("--marquee-distance", `${overflowAmount}px`);
        setIsActive(true);
      } else {
        el.style.removeProperty("--marquee-distance");
        setIsActive(false);
      }
    };

    updateOverflow();
    window.addEventListener("resize", updateOverflow);
    return () => window.removeEventListener("resize", updateOverflow);
  }, [children]);

  return (
    <Component
      ref={textRef}
      className={`${className} marquee ${isActive ? "marquee--active" : ""}`.trim()}
    >
      <span className="marquee__inner">{children}</span>
    </Component>
  );
};

export default MarqueeText;
