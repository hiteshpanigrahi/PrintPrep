"use client";

import { useEffect, useState } from "react";

export default function SegmentedControl({
  items,
  value,
  defaultValue,
  onChange,
  disabled = false,
  className = "",
  style = {}
}) {
  const [inner, setInner] = useState(defaultValue);
  
  // Normalize items to objects
  const list = items.map(item => 
    typeof item === 'string' ? { value: item, label: item } : item
  );
  
  const current = value !== undefined ? value : inner;
  const index = Math.max(
    0,
    list.findIndex(item => item.value === current)
  );

  const handleSelect = (idx) => {
    if (disabled) return;
    const nextVal = list[idx].value;
    if (value === undefined) setInner(nextVal);
    onChange?.(nextVal, idx);
  };

  return (
    <div
      role="radiogroup"
      aria-disabled={disabled || undefined}
      className={`relative grid items-center rounded-xl bg-[var(--bg-secondary)] p-1 border border-[var(--border-color)] ${className}`}
      style={{
        gridTemplateColumns: `repeat(${list.length}, minmax(0, 1fr))`,
        ...style
      }}
    >
      {/* Sliding background pill */}
      <div 
        className="absolute top-1 bottom-1 rounded-lg bg-[var(--text-main)] shadow-sm transition-all duration-200 ease-out pointer-events-none"
        style={{
          width: `calc((100% - 8px) / ${list.length})`,
          left: `calc(4px + ${index} * ((100% - 8px) / ${list.length}))`
        }}
      />
      
      {/* Buttons */}
      {list.map((item, i) => {
        const isActive = i === index;
        return (
          <button
            key={item.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            tabIndex={isActive ? 0 : -1}
            disabled={disabled}
            onClick={() => handleSelect(i)}
            className={`relative z-10 flex w-full items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-lg transition-colors duration-150 focus:outline-none select-none ${
              isActive 
                ? "text-[var(--bg-main)]" 
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            {item.icon}
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
