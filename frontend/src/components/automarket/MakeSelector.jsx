import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import MobileSelect from './MobileSelect';

const allMakes = [
  'AC', 'Abarth', 'Alfa Romeo', 'Alpine', 'Aston Martin', 'Audi', 'Austin',
  'BMW', 'BYD', 'Bentley', 'Cadillac', 'Chevrolet', 'Chrysler', 'Citroen',
  'Cupra', 'Dacia', 'Daihatsu', 'DFSK', 'DS Automobiles', 'Daimler', 'Dodge',
  'Ferrari', 'Fiat', 'Ford', 'GWM', 'Geely', 'Genesis', 'Holden', 'Honda',
  'Hummer', 'Hyundai', 'INEOS', 'Infiniti', 'Isuzu', 'Jaguar', 'Jeep', 'KGM',
  'Kia', 'Lancia', 'Lamborghini', 'Land Rover', 'Leapmotor', 'Lexus', 'Lincoln',
  'Lotus', 'MG', 'MINI', 'Maserati', 'Maxus', 'Mazda', 'McLaren',
  'Mercedes-Benz', 'Mitsubishi', 'Morgan', 'Nissan', 'Opel', 'Peugeot',
  'Polestar', 'Porsche', 'Renault', 'Rolls-Royce', 'Rover', 'SEAT', 'Saab',
  'Skoda', 'Skywell', 'Smart', 'Ssangyong', 'Subaru', 'Suzuki', 'Talbot',
  'Tesla', 'Toyota', 'Vauxhall', 'Volkswagen', 'Volvo', 'Xpeng',
];

const OTHER_OPTION = 'Other (type your own)';

export default function MakeSelector({ value, onChange, makes = allMakes }) {
  const [isCustom, setIsCustom] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isCustom && inputRef.current) inputRef.current.focus();
  }, [isCustom]);

  const handleClear = () => {
    setIsCustom(false);
    onChange('');
  };

  if (isCustom) {
    return (
      <div className="relative">
        <div className="w-full flex items-center justify-between border border-border rounded-lg px-4 py-3 text-base bg-card focus-within:ring-1 focus-within:ring-primary/40">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="All makes"
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
      options={[...makes, OTHER_OPTION]}
      placeholder="All makes"
      sizeClass="text-base"
    />
  );
}