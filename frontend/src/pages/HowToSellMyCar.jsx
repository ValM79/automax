import React from 'react';
import BackButton from '../components/automarket/BackButton';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Car, Camera, FileText, Tag, CreditCard, CheckCircle } from 'lucide-react';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import { FREE_LISTINGS } from '@/lib/freeListings';

const steps = [
  {
    icon: Car,
    title: 'Gather Your Vehicle Details',
    description: 'Collect all the key information about your vehicle: make, model, year, mileage, fuel type, transmission, colour, number of doors, seats, and any other relevant specs. Accurate details help buyers find your ad faster.'
  },
  {
    icon: Camera,
    title: 'Take Great Photos',
    description: 'Take clear, well-lit photos from multiple angles — front, back, both sides, interior, dashboard, and engine bay. Good photos significantly increase your chances of selling quickly and at a better price.'
  },
  {
    icon: FileText,
    title: 'Write a Clear Description',
    description: 'Write an honest, detailed description. Mention the condition, service history, NCT/tax expiry, any extras or modifications, and reasons for selling. Transparency builds trust with buyers.'
  },
  {
    icon: Tag,
    title: 'Set a Fair Price',
    description: 'Research similar vehicles on AutoMax to determine a competitive price. Consider the condition, mileage, and age of your vehicle. A fair price attracts more genuine enquiries.'
  },
  {
    icon: CreditCard,
    title: FREE_LISTINGS ? 'Post It for Free' : 'Choose Your Ad Package',
    description: FREE_LISTINGS
      ? 'During our free launch offer there is nothing to pay: check your details, press Post Ad for Free, and your ad goes live.'
      : 'Select from our range of ad packages — from a basic listing to spotlight and premium options that give your ad more visibility and help it stand out from the crowd.'
  },
  {
    icon: CheckCircle,
    title: 'Publish & Respond',
    description: 'Publish your ad and respond promptly to buyer enquiries. Be available for viewings and test drives. Quick, friendly communication helps close the deal faster.'
  },
];

export default function HowToSellMyCar() {
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
          <span className="text-foreground font-medium">How to sell my car</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-foreground mb-3 flex items-center gap-3">
          <span className="text-4xl">🚗</span>
          How to Sell My Car
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-10">
          A step-by-step guide to listing your vehicle on AutoMax and getting it sold quickly and at the best price.
        </p>

        {/* Steps */}
        <div className="space-y-4 mb-12">
          {steps.map((step, idx) => (
            <div key={idx} className="bg-card rounded-xl border border-border p-6 shadow-sm flex gap-5">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <step.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                  <span className="text-primary text-sm font-extrabold">Step {idx + 1}</span>
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl text-white p-8 text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to sell?</h2>
          <p className="mb-5 max-w-xl mx-auto">List your vehicle today and reach thousands of buyers across Ireland.</p>
          <Link to="/place-ad" className="inline-flex items-center gap-2 bg-card text-primary font-semibold px-6 py-3 rounded-lg hover:bg-muted transition-colors">
            Place Ad <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}