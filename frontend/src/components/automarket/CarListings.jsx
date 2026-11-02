import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Make logos are served from our own site (public/img/makes, see the README there). A make without a file there falls back to a letter.
// The site lets browsers keep these files for a year under their file name, so bump LOGO_VERSION whenever a logo file is replaced.
const LOGO_VERSION = 2;
const MAKES = [
  { label: 'AC',            logo: '/img/makes/ac.png' },
  { label: 'Abarth',        logo: '/img/makes/abarth.png' },
  { label: 'Alfa Romeo',    logo: '/img/makes/alfa-romeo.png' },
  { label: 'Alpine',        logo: '/img/makes/alpine.png' },
  { label: 'Aston Martin',  logo: '/img/makes/aston-martin.png' },
  { label: 'Audi',          logo: '/img/makes/audi.png' },
  { label: 'Austin',        logo: '/img/makes/austin.png' },
  { label: 'Bentley',       logo: '/img/makes/bentley.png' },
  { label: 'BMW',           logo: '/img/makes/bmw.png' },
  { label: 'BYD',           logo: '/img/makes/byd.png' },
  { label: 'Cadillac',      logo: '/img/makes/cadillac.png' },
  { label: 'Chevrolet',     logo: '/img/makes/chevrolet.png' },
  { label: 'Chrysler',      logo: '/img/makes/chrysler.png' },
  { label: 'Citroen',       logo: '/img/makes/citroen.png' },
  { label: 'Cupra',         logo: '/img/makes/cupra.png' },
  { label: 'Dacia',         logo: '/img/makes/dacia.png' },
  { label: 'Daihatsu',      logo: '/img/makes/daihatsu.png' },
  { label: 'DFSK',          logo: '/img/7fee0c0ad_generated_image.jpg' },
  { label: 'DS Automobiles',logo: '/img/makes/ds.png' },
  { label: 'Daimler',       logo: '/img/makes/daimler.png' },
  { label: 'Dodge',         logo: '/img/makes/dodge.png' },
  { label: 'Ferrari',       logo: '/img/makes/ferrari.png' },
  { label: 'Fiat',          logo: '/img/makes/fiat.png' },
  { label: 'Ford',          logo: '/img/makes/ford.png' },
  { label: 'GWM',           logo: '/img/21618e16c_generated_image.jpg' },
  { label: 'Geely',         logo: '/img/makes/geely.png' },
  { label: 'Genesis',       logo: '/img/makes/genesis.png' },
  { label: 'Holden',         logo: '/img/makes/holden.png' },
  { label: 'Honda',         logo: '/img/makes/honda.png' },
  { label: 'Hummer',        logo: '/img/makes/hummer.png' },
  { label: 'Hyundai',       logo: '/img/makes/hyundai.png' },
  { label: 'INEOS',         logo: '/img/ba43eb10c_generated_image.jpg' },
  { label: 'Infiniti',      logo: '/img/makes/infiniti.png' },
  { label: 'Isuzu',         logo: '/img/makes/isuzu.png' },
  { label: 'Jaguar',        logo: '/img/makes/jaguar.png' },
  { label: 'Jeep',          logo: '/img/makes/jeep.png' },
  { label: 'KGM',           logo: '/img/5ad0ed257_generated_image.jpg' },
  { label: 'Kia',           logo: '/img/makes/kia.png' },
  { label: 'LDV',           logo: '/img/75039aed0_generated_image.jpg' },
  { label: 'LEVC',          logo: '/img/makes/levc.png' },
  { label: 'Lamborghini',   logo: '/img/makes/lamborghini.png' },
  { label: 'Lancia',        logo: '/img/makes/lancia.png' },
  { label: 'Land Rover',    logo: '/img/makes/land-rover.png' },
  { label: 'Leapmotor',     logo: '/img/makes/leapmotor.png' },
  { label: 'Lexus',         logo: '/img/makes/lexus.png' },
  { label: 'Lincoln',       logo: '/img/makes/lincoln.png' },
  { label: 'Lotus',         logo: '/img/makes/lotus.png' },
  { label: 'MG',            logo: '/img/makes/mg.png' },
  { label: 'Mini',          logo: '/img/makes/mini.png' },
  { label: 'Maserati',      logo: '/img/makes/maserati.png' },
  { label: 'Maxus',         logo: '/img/makes/maxus.png' },
  { label: 'Mazda',         logo: '/img/makes/mazda.png' },
  { label: 'McLaren',       logo: '/img/makes/mclaren.png' },
  { label: 'Mercedes-Benz', logo: '/img/makes/mercedes-benz.png' },
  { label: 'Mitsubishi',    logo: '/img/makes/mitsubishi.png' },
  { label: 'Morgan',        logo: '/img/makes/morgan.png' },
  { label: 'Nissan',        logo: '/img/makes/nissan.png' },
  { label: 'Opel',          logo: '/img/makes/opel.png' },
  { label: 'Peugeot',       logo: '/img/makes/peugeot.png' },
  { label: 'Polestar',      logo: '/img/makes/polestar.png' },
  { label: 'Porsche',       logo: '/img/makes/porsche.png' },
  { label: 'Renault',       logo: '/img/makes/renault.png' },
  { label: 'Rolls-Royce',   logo: '/img/makes/rolls-royce.png' },
  { label: 'Rover',         logo: '/img/makes/rover.png' },
  { label: 'Saab',          logo: '/img/makes/saab.png' },
  { label: 'Seat',          logo: '/img/makes/seat.png' },
  { label: 'Skoda',         logo: '/img/makes/skoda.png' },
  { label: 'Skywell',       logo: '/img/af67a1bbc_generated_image.jpg' },
  { label: 'Smart',         logo: '/img/makes/smart.png' },
  { label: 'Ssangyong',     logo: '/img/makes/ssangyong.png' },
  { label: 'Subaru',        logo: '/img/makes/subaru.png' },
  { label: 'Suzuki',        logo: '/img/makes/suzuki.png' },
  { label: 'Talbot',        logo: '/img/makes/talbot.png' },
  { label: 'Tesla',         logo: '/img/makes/tesla.png' },
  { label: 'Toyota',        logo: '/img/makes/toyota.png' },
  { label: 'Vauxhall',      logo: '/img/makes/vauxhall.png' },
  { label: 'Volkswagen',    logo: '/img/makes/volkswagen.png' },
  { label: 'Volvo',         logo: '/img/makes/volvo.png' },
  { label: 'Xpeng',         logo: '/img/makes/xpeng.png' },
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
              src={logo.startsWith('/img/makes/') ? `${logo}?v=${LOGO_VERSION}` : logo}
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