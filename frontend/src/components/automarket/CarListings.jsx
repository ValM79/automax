import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Using car logos from a reliable public CDN (carlogos.org)
const MAKES = [
  { label: 'AC',            logo: 'https://www.carlogos.org/car-logos/ac-logo.png' },
  { label: 'Abarth',        logo: 'https://www.carlogos.org/car-logos/abarth-logo.png' },
  { label: 'Alfa Romeo',    logo: 'https://www.carlogos.org/car-logos/alfa-romeo-logo.png' },
  { label: 'Alpine',        logo: 'https://www.carlogos.org/car-logos/alpine-logo.png' },
  { label: 'Aston Martin',  logo: 'https://www.carlogos.org/car-logos/aston-martin-logo.png' },
  { label: 'Audi',          logo: 'https://www.carlogos.org/car-logos/audi-logo.png' },
  { label: 'Austin',        logo: 'https://www.carlogos.org/car-logos/austin-logo.png' },
  { label: 'Bentley',       logo: 'https://www.carlogos.org/car-logos/bentley-logo.png' },
  { label: 'BMW',           logo: 'https://www.carlogos.org/car-logos/bmw-logo.png' },
  { label: 'BYD',           logo: 'https://www.carlogos.org/car-logos/byd-logo.png' },
  { label: 'Cadillac',      logo: 'https://www.carlogos.org/car-logos/cadillac-logo.png' },
  { label: 'Chevrolet',     logo: 'https://www.carlogos.org/car-logos/chevrolet-logo.png' },
  { label: 'Chrysler',      logo: 'https://www.carlogos.org/car-logos/chrysler-logo.png' },
  { label: 'Citroen',       logo: 'https://www.carlogos.org/car-logos/citroen-logo.png' },
  { label: 'Cupra',         logo: 'https://cdn.jsdelivr.net/gh/filippofilip95/car-logos-dataset@master/logos/optimized/cupra.png' },
  { label: 'Dacia',         logo: 'https://www.carlogos.org/car-logos/dacia-logo.png' },
  { label: 'Daihatsu',      logo: 'https://www.carlogos.org/car-logos/daihatsu-logo.png' },
  { label: 'DFSK',          logo: '/img/7fee0c0ad_generated_image.jpg' },
  { label: 'DS Automobiles',logo: 'https://www.carlogos.org/car-logos/ds-logo.png' },
  { label: 'Daimler',       logo: 'https://www.carlogos.org/car-logos/daimler-logo.png' },
  { label: 'Dodge',         logo: 'https://www.carlogos.org/car-logos/dodge-logo.png' },
  { label: 'Ferrari',       logo: 'https://www.carlogos.org/car-logos/ferrari-logo.png' },
  { label: 'Fiat',          logo: 'https://www.carlogos.org/car-logos/fiat-logo.png' },
  { label: 'Ford',          logo: 'https://www.carlogos.org/car-logos/ford-logo.png' },
  { label: 'GWM',           logo: '/img/21618e16c_generated_image.jpg' },
  { label: 'Geely',         logo: 'https://www.carlogos.org/car-logos/geely-logo.png' },
  { label: 'Genesis',       logo: 'https://www.carlogos.org/car-logos/genesis-logo.png' },
  { label: 'Holden',         logo: 'https://www.carlogos.org/car-logos/holden-logo.png' },
  { label: 'Honda',         logo: 'https://www.carlogos.org/car-logos/honda-logo.png' },
  { label: 'Hummer',        logo: 'https://www.carlogos.org/car-logos/hummer-logo.png' },
  { label: 'Hyundai',       logo: 'https://www.carlogos.org/car-logos/hyundai-logo.png' },
  { label: 'INEOS',         logo: '/img/ba43eb10c_generated_image.jpg' },
  { label: 'Infiniti',      logo: 'https://www.carlogos.org/car-logos/infiniti-logo.png' },
  { label: 'Isuzu',         logo: 'https://www.carlogos.org/car-logos/isuzu-logo.png' },
  { label: 'Jaguar',        logo: 'https://www.carlogos.org/car-logos/jaguar-logo.png' },
  { label: 'Jeep',          logo: 'https://www.carlogos.org/car-logos/jeep-logo.png' },
  { label: 'KGM',           logo: '/img/5ad0ed257_generated_image.jpg' },
  { label: 'Kia',           logo: 'https://www.carlogos.org/car-logos/kia-logo.png' },
  { label: 'LDV',           logo: '/img/75039aed0_generated_image.jpg' },
  { label: 'LEVC',          logo: 'https://cdn.jsdelivr.net/gh/filippofilip95/car-logos-dataset@master/logos/optimized/levc.png' },
  { label: 'Lamborghini',   logo: 'https://www.carlogos.org/car-logos/lamborghini-logo.png' },
  { label: 'Lancia',        logo: 'https://www.carlogos.org/car-logos/lancia-logo.png' },
  { label: 'Land Rover',    logo: 'https://www.carlogos.org/car-logos/land-rover-logo.png' },
  { label: 'Leapmotor',     logo: 'https://cdn.jsdelivr.net/gh/filippofilip95/car-logos-dataset@master/logos/optimized/leapmotor.png' },
  { label: 'Lexus',         logo: 'https://www.carlogos.org/car-logos/lexus-logo.png' },
  { label: 'Lincoln',       logo: 'https://www.carlogos.org/car-logos/lincoln-logo.png' },
  { label: 'Lotus',         logo: 'https://www.carlogos.org/car-logos/lotus-logo.png' },
  { label: 'MG',            logo: 'https://www.carlogos.org/car-logos/mg-logo.png' },
  { label: 'Mini',          logo: 'https://www.carlogos.org/car-logos/mini-logo.png' },
  { label: 'Maserati',      logo: 'https://www.carlogos.org/car-logos/maserati-logo.png' },
  { label: 'Maxus',         logo: 'https://www.carlogos.org/car-logos/maxus-logo.png' },
  { label: 'Mazda',         logo: 'https://www.carlogos.org/car-logos/mazda-logo.png' },
  { label: 'McLaren',       logo: 'https://www.carlogos.org/car-logos/mclaren-logo.png' },
  { label: 'Mercedes-Benz', logo: 'https://www.carlogos.org/car-logos/mercedes-benz-logo.png' },
  { label: 'Mitsubishi',    logo: 'https://www.carlogos.org/car-logos/mitsubishi-logo.png' },
  { label: 'Morgan',        logo: 'https://www.carlogos.org/car-logos/morgan-logo.png' },
  { label: 'Nissan',        logo: 'https://www.carlogos.org/car-logos/nissan-logo.png' },
  { label: 'Opel',          logo: 'https://www.carlogos.org/car-logos/opel-logo.png' },
  { label: 'Peugeot',       logo: 'https://www.carlogos.org/car-logos/peugeot-logo.png' },
  { label: 'Polestar',      logo: 'https://www.carlogos.org/car-logos/polestar-logo.png' },
  { label: 'Porsche',       logo: 'https://www.carlogos.org/car-logos/porsche-logo.png' },
  { label: 'Renault',       logo: 'https://www.carlogos.org/car-logos/renault-logo.png' },
  { label: 'Rolls-Royce',   logo: 'https://www.carlogos.org/car-logos/rolls-royce-logo.png' },
  { label: 'Rover',         logo: 'https://www.carlogos.org/car-logos/rover-logo.png' },
  { label: 'Saab',          logo: 'https://www.carlogos.org/car-logos/saab-logo.png' },
  { label: 'Seat',          logo: 'https://www.carlogos.org/car-logos/seat-logo.png' },
  { label: 'Skoda',         logo: 'https://www.carlogos.org/car-logos/skoda-logo.png' },
  { label: 'Skywell',       logo: '/img/af67a1bbc_generated_image.jpg' },
  { label: 'Smart',         logo: 'https://www.carlogos.org/car-logos/smart-logo.png' },
  { label: 'Ssangyong',     logo: 'https://www.carlogos.org/car-logos/ssangyong-logo.png' },
  { label: 'Subaru',        logo: 'https://www.carlogos.org/car-logos/subaru-logo.png' },
  { label: 'Suzuki',        logo: 'https://www.carlogos.org/car-logos/suzuki-logo.png' },
  { label: 'Talbot',        logo: 'https://www.carlogos.org/car-logos/talbot-logo.png' },
  { label: 'Tesla',         logo: 'https://www.carlogos.org/car-logos/tesla-logo.png' },
  { label: 'Toyota',        logo: 'https://www.carlogos.org/car-logos/toyota-logo.png' },
  { label: 'Vauxhall',      logo: 'https://www.carlogos.org/car-logos/vauxhall-logo.png' },
  { label: 'Volkswagen',    logo: 'https://www.carlogos.org/car-logos/volkswagen-logo.png' },
  { label: 'Volvo',         logo: 'https://www.carlogos.org/car-logos/volvo-logo.png' },
  { label: 'Xpeng',         logo: 'https://cdn.jsdelivr.net/gh/filippofilip95/car-logos-dataset@master/logos/optimized/xpeng.png' },
];

// Split makes into 3 columns
function chunkIntoColumns(arr, cols) {
  const perCol = Math.ceil(arr.length / cols);
  return Array.from({ length: cols }, (_, i) => arr.slice(i * perCol, (i + 1) * perCol));
}

function MakeRow({ label, logo }) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  const handleClick = () => {
    const makeSlug = label.toLowerCase().replace(/\s+/g, '-');
    navigate(`/cars-by-make/${makeSlug}`);
  };

  return (
    <button onClick={handleClick} className="flex items-center justify-between w-full py-2.5 border-b border-border last:border-0 hover:bg-secondary/40 px-2 rounded transition-colors group">
      <div className="flex items-center gap-3">
        <div className="w-8 h-7 flex items-center justify-center flex-shrink-0">
          {imgError ? (
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-xs">{label[0]}</span>
            </div>
          ) : (
            <img
              src={logo}
              alt={label}
              className="max-w-full max-h-full object-contain"
              onError={() => setImgError(true)}
            />
          )}
        </div>
        <span className="text-sm font-medium text-foreground">
          {label}
        </span>
      </div>

    </button>
  );
}

export default function CarListings() {
  const columns = chunkIntoColumns(MAKES, 3);

  return (
    <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">Browse by Make</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((col, i) => (
          <div key={i} className="flex flex-col">
            {col.map((make) => (
              <MakeRow key={make.label} {...make} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}