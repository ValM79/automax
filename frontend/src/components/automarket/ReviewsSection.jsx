import React from 'react';
import { Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const REVIEW_IMG = '/img/62c743992_generated_ff5e1a79.jpg';

const articles = [
  {
    type: 'advice',
    title: '5 cars that should be more popular...',
    excerpt: 'Here are a quintet of vehicles that we rate highly, but which don\'t seem to get the attention they deserve.',
    rating: null,
  },
  {
    type: 'review',
    title: '2026 Porsche Cayenne Electric',
    excerpt: 'We\'ve driven the new electric version of the Porsche Cayenne.',
    rating: 5,
  },
  {
    type: 'review',
    title: '2026 Porsche 911 Turbo S Cabriolet',
    excerpt: 'We\'ve driven the new 911 Turbo S - in Cabriolet form.',
    rating: 5,
  },
];

export default function ReviewsSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
      <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-8">
        Car reviews, motoring advice and more
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {articles.map((article, idx) => (
          <div
            key={idx}
            className="group bg-card rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
          >
            <div className="relative overflow-hidden aspect-[3/2]">
              <img
                src={REVIEW_IMG}
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className={`absolute top-3 left-3 text-white text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider ${
                article.type === 'review' ? 'bg-primary' : 'bg-accent'
              }`}>
                {article.type}
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                {article.title}
              </h3>
              {article.rating && (
                <div className="flex items-center gap-0.5 mb-2">
                  <span className="text-xs text-muted-foreground mr-1">Our Rating:</span>
                  {Array.from({ length: article.rating }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              )}
              <p className="text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary mt-3">
                Read {article.type} <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-8">
        <Button variant="outline" className="rounded-full px-8 font-semibold border-primary text-primary hover:bg-primary hover:text-white">
          See all articles
        </Button>
      </div>
    </section>
  );
}