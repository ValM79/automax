import React from 'react';
import BackButton from '../components/automarket/BackButton';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Lightbulb } from 'lucide-react';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import { FREE_LISTINGS } from '@/lib/freeListings';

const tips = [
  {
    title: 'Price Competitively',
    description: 'Research similar listings on AutoMax to find the right price. Vehicles priced slightly below market average tend to sell faster while still getting fair value.'
  },
  {
    title: 'Take Quality Photos',
    description: 'Use natural daylight and clean your vehicle before photographing. Include shots from every angle and highlight any unique features or recent upgrades.'
  },
  {
    title: 'Be Honest About Condition',
    description: 'Disclose any damage, scratches, or mechanical issues upfront. Honest ads build trust and reduce time-wasters and renegotiation at viewing.'
  },
  {
    title: 'Keep Service Records Handy',
    description: 'Buyers love a full service history. Have your logbook, NCT cert, and service records ready — it increases buyer confidence and justifies your asking price.'
  },
  {
    title: 'Respond Quickly to Enquiries',
    description: 'Reply to messages and calls promptly. Buyers often contact multiple sellers — being the first to respond gives you the best chance of a sale.'
  },
  {
    title: 'Meet in a Safe Location',
    description: 'Arrange viewings in a public, well-lit location during daylight hours. Never hand over the keys or documents until payment has cleared.'
  },
  {
    title: 'Accept Secure Payment',
    description: 'Bank transfer is the safest payment method. Avoid accepting cheques or unusual payment arrangements. Confirm funds have cleared before releasing the vehicle.'
  },
  ...(FREE_LISTINGS ? [] : [{
    title: 'Use a Premium Ad Package',
    description: 'Spotlight and premium packages give your listing greater visibility, helping it appear at the top of search results and sell up to 3x faster.'
  }]),
];

export default function SellingTips() {
  return (
    <div className="min-h-screen bg-muted">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
          <BackButton />
          <span>›</span>
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Selling Tips</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-foreground mb-3 flex items-center gap-3">
          <span className="text-4xl">💡</span>
          Selling Tips
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-10">
          Expert advice to help you sell your vehicle faster, safer, and at the best possible price.
        </p>

        {/* Tips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
          {tips.map((tip, idx) => (
            <div key={idx} className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground pt-1">{tip.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed pl-11">{tip.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl text-white p-8 text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to list your vehicle?</h2>
          <p className="mb-5 max-w-xl mx-auto">Put these tips into action and place your ad on AutoMax today.</p>
          <Link to="/place-ad" className="inline-flex items-center gap-2 bg-card text-primary font-semibold px-6 py-3 rounded-lg hover:bg-muted transition-colors">
            Place Ad <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}