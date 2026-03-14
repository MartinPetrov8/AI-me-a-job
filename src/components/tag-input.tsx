'use client';

import { useState, KeyboardEvent } from 'react';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  max?: number;
  placeholder?: string;
}

export default function TagInput({ value, onChange, max, placeholder }: TagInputProps) {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Check for duplicates (case-insensitive)
    const isDuplicate = value.some(tag => tag.toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) {
      setInput('');
      return;
    }

    // Check max limit
    if (max && value.length >= max) {
      return;
    }

    onChange([...value, trimmed]);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const isAtMax = max !== undefined && value.length >= max;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isAtMax}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>
      {isAtMax && (
        <p className="text-sm text-gray-600">Maximum {max} reached</p>
      )}
      <div className="flex flex-wrap gap-2">
        {value.map((tag, index) => (
          <div
            key={index}
            className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="text-indigo-500 hover:text-indigo-700 font-bold leading-none"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
