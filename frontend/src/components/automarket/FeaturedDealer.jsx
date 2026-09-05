import React, { useState } from 'react';
import { MapPin, Building2, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CAR_IMAGES = [
  '/img/c66d362f5_generated_9b845e77.jpg',
  '/img/5c1b2099a_generated_c25137b3.jpg',
  '/img/c5bb20e30_generated_9da92ea0.jpg',
];

const cars = [
  { year: '2021', name: 'Land Rover Range Rover', km: '79,699km', fuel: '2.0 Petrol Hybrid', price: '€64,900' },
  { year: '2025', name: 'Land Rover Range Rover', km: '65,160km', fuel: '3.0 Petrol Plug-in', price: '€135,900' },
  { year: '2024', name: 'Land Rover Range Rover', km: '36,594km', fuel: '3.0 Petrol Plug-in', price: '€124,900' },
];

export default function FeaturedDealer() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const next = () => setCurrentSlide((prev) => (prev + 1) % cars.length);
  const prev = () => setCurrentSlide((prev) => (prev - 1 + cars.length) % cars.length);

  return (
    <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
      <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-2">
        Featured dealer
      </h2>
      <div className="text-center mb-2">
        <a href="#" className="text-primary font-semibold hover:underline text-lg">
          Johnson & Perrott Jaguar Land Rover
        </a>
      </div>
      <div className="flex items-center justify-center gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
        <Star className="w-4 h-4 fill-yellow-400/40 text-yellow-400" />
        <span className="text-sm text-muted-foreground ml-1">4/5</span>
        <a href="#" className="text-sm text-primary hover:underline ml-1">(82 reviews)</a>
      </div>
      <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-8">
        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Cork</span>
        <span className="text-border">|</span>
        <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> Stock: 29</span>
      </div>

      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cars.map((car, idx) => (
            <div
              key={idx}
              className="group bg-card rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              <div className="relative overflow-hidden aspect-[4/3]">
                <img
                  src={CAR_IMAGES[idx]}
                  alt={car.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-primary text-white text-xs font-bold px-2 py-1 rounded">
                  {car.year.slice(-2)}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-foreground text-sm mb-1">
                  {car.year} {car.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {car.km} | {car.fuel}
                </p>
                <p className="text-lg font-bold text-foreground">{car.price}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={prev}
          className="absolute -left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-card shadow-lg rounded-full flex items-center justify-center hover:bg-secondary transition-colors hidden md:flex"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <button
          onClick={next}
          className="absolute -right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-card shadow-lg rounded-full flex items-center justify-center hover:bg-secondary transition-colors hidden md:flex"
        >
          <ChevronRight className="w-5 h-5 text-foreground" />
        </button>
      </div>

      <div className="text-center mt-8">
        <Button variant="outline" className="rounded-full px-8 font-semibold border-primary text-primary hover:bg-primary hover:text-white">
          View dealer stock
        </Button>
      </div>
    </section>
  );
}