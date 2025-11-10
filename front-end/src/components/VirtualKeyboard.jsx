import React from "react";
import "../styles/VirtualKeyboard.css";

const LAYOUT = [
  ["1","2","3","4","5","6","7","8","9","0"],
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["Z","X","C","V","B","N","M"],
];

export default function VirtualKeyboard({ onKeyPress }) {
  const handleClick = (value) => {
    onKeyPress?.(value);
  };

  return (
    <div className="virtual-keyboard">
      {LAYOUT.map((row, idx) => (
        <div className="vk-row" key={`vk-row-${idx}`}>
          {row.map((key) => (
            <button
              key={key}
              type="button"
              className="vk-key"
              onClick={() => handleClick(key)}
            >
              {key}
            </button>
          ))}
        </div>
      ))}
      <div className="vk-row">
        <button type="button" className="vk-key vk-key-wide" onClick={() => handleClick("Space")}>
          Space
        </button>
        <button type="button" className="vk-key" onClick={() => handleClick("Backspace")}>
          ⌫
        </button>
        <button type="button" className="vk-key" onClick={() => handleClick("Clear")}>
          Clear
        </button>
        <button type="button" className="vk-key" onClick={() => handleClick("Enter")}>
          Search
        </button>
      </div>
    </div>
  );
}
