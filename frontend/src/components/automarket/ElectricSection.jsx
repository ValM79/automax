import React from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Fuel } from 'lucide-react';

const EV_BG = '/img/037720c40_generated_4b3518d1.jpg';

export default function ElectricSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={EV_BG} alt="Electric car on road" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="max-w-xl">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Considering a hybrid or electric car?
          </h2>
          <p className="text-white/80 text-sm md:text-base mb-8 leading-relaxed">
            Browse new and used electric and hybrid cars for sale from trusted Irish sellers. 
            Get all the latest expert advice and reviews for buying and selling electric and hybrid cars in Ireland.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button className="bg-accent hover:bg-accent/90 text-white font-semibold rounded-lg px-6 h-11">
              <Zap className="w-4 h-4 mr-2" />
              Go electric
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-card hover:text-foreground font-semibold rounded-lg px-6 h-11">
              <Fuel className="w-4 h-4 mr-2" />
              Go hybrid
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}