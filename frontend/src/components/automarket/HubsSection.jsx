import React, { useState } from 'react';
import { Zap, GraduationCap, Fuel, Truck, BatteryCharging, Wallet, Car, Users, Shield, Tag, Wrench, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

const EV_IMG = '/img/f7a5792ea_generated_b6c35f55.jpg';
const LEARNER_IMG = '/img/7b713a3a4_generated_9e1d0947.jpg';
const HYBRID_IMG = '/img/557dd077c_generated_09d0bdcb.jpg';

const hubs = [
  { label: 'EV Charging', icon: Zap, image: EV_IMG },
  { label: 'Learner Drivers', icon: GraduationCap, image: LEARNER_IMG },
  { label: 'Hybrid Cars', icon: Fuel, image: HYBRID_IMG },
  { label: 'Commercial', icon: Truck, image: null },
  { label: 'Electric Cars', icon: BatteryCharging, image: null },
  { label: 'Finance', icon: Wallet, image: null },
  { label: 'Classic Cars', icon: Car, image: null },
  { label: 'Family Cars', icon: Users, image: null },
  { label: 'Car Insurance', icon: Shield, image: null },
  { label: 'Selling Tips', icon: Tag, image: null },
  { label: 'Car Servicing', icon: Wrench, image: null },
  { label: 'Road Trips', icon: MapPin, image: null },
];

export default function HubsSection() {
  const [startIndex, setStartIndex] = useState(0);
  const total = hubs.length;

  const getItem = (offset) => hubs[(startIndex + offset + total) % total];

  const prev = () => setStartIndex((i) => (i - 1 + total) % total);
  const next = () => setStartIndex((i) => (i + 1) % total);

  const visible = [getItem(0), getItem(1), getItem(2)];

  return (
    <section className="bg-secondary py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-2">
          AutoMax Hubs
        </h2>
        <p className="text-center text-muted-foreground mb-8">
          Tips and advice for buying your next car.
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={prev}
            className="flex-shrink-0 w-10 h-10 bg-card shadow-lg rounded-full flex items-center justify-center hover:bg-card transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>

          <div className="flex-1 grid grid-cols-3 gap-4">
            {visible.map((hub, idx) => (
              <button
                key={`${hub.label}-${idx}`}
                className="group relative bg-card rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 flex flex-col items-center justify-center gap-3 p-6 aspect-square"
              >
                {hub.image && (
                  <img
                    src={hub.image}
                    alt={hub.label}
                    className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:opacity-40 transition-opacity"
                  />
                )}
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <hub.icon className="w-10 h-10 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-semibold text-foreground text-center leading-tight">{hub.label}</span>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={next}
            className="flex-shrink-0 w-10 h-10 bg-card shadow-lg rounded-full flex items-center justify-center hover:bg-card transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>
    </section>
  );
}