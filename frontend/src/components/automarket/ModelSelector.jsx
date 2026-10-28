import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import MobileSelect from './MobileSelect';
import { modelsByMake } from './modelsData';

const OTHER_OPTION = 'Other (type your own)';

export default function ModelSelector({ make, value, onChange, modelsMap = modelsByMake }) {
  const [isCustom, setIsCustom] = useState(false);
  const inputRef = useRef(null);

  const modelsKey = make && Object.keys(modelsMap).find(k => k.toLowerCase() === make.toLowerCase());
  const models = modelsKey ? modelsMap[modelsKey] : [];
  const disabled = !make;

  useEffect(() => {
    onChange('');
    setIsCustom(false);
  }, [make]);

  useEffect(() => {
    if (isCustom && inputRef.current) inputRef.current.focus();
  }, [isCustom]);

  const handleClear = () => {
    setIsCustom(false);
    onChange('');
  };

  if (disabled) {
    return (
      <MobileSelect
        value=""
        onChange={() => {}}
        options={[]}
        placeholder="All models"
        disabled
        sizeClass="text-base"
      />
    );
  }

  if (isCustom) {
    return (
      <div className="relative">
        <div className="w-full flex items-center justify-between border border-border rounded-lg px-4 py-3 text-base bg-card focus-within:ring-1 focus-within:ring-primary/40">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="All models"
            className="flex-1 bg-transparent text-sm text-foreground focus:outline-none"
          />
          <X className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer flex-shrink-0" onClick={handleClear} />
        </div>
      </div>
    );
  }

  return (
    <MobileSelect
      value={value}
      onChange={(v) => {
        if (v === OTHER_OPTION) { setIsCustom(true); onChange(''); }
        else { onChange(v); }
      }}
      options={[...models.map(m => m.name).filter(n => n !== 'Other'), OTHER_OPTION]}
      placeholder="All models"
      sizeClass="text-base"
    />
  );
}