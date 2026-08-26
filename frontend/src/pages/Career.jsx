import React from 'react';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import { Link } from 'react-router-dom';
import { MapPin, Briefcase } from 'lucide-react';

const jobs = [
  { title: 'Senior Frontend Developer', dept: 'Engineering', location: 'Dublin (Hybrid)', type: 'Full-time' },
  { title: 'Product Manager', dept: 'Product', location: 'Dublin (Hybrid)', type: 'Full-time' },
  { title: 'Digital Marketing Executive', dept: 'Marketing', location: 'Dublin', type: 'Full-time' },
  { title: 'Customer Support Specialist', dept: 'Support', location: 'Remote', type: 'Full-time' },
  { title: 'Data Analyst', dept: 'Data', location: 'Dublin (Hybrid)', type: 'Full-time' },
];

export default function Career() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Careers</span>
        </div>
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-3">Join Our Team</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">We're building Ireland's best vehicle marketplace. If you're passionate about technology, motors, and making a difference — we'd love to hear from you.</p>
        </div>
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-8 text-center">
          <h2 className="font-bold text-foreground mb-1">Life at AutoMax</h2>
          <p className="text-muted-foreground text-sm">Competitive salaries · Flexible working · Health insurance · Annual bonus · Great culture</p>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-4">Open Positions</h2>
        <div className="space-y-4">
          {jobs.map((job, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-foreground">{job.title}</h3>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{job.dept}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">{job.type}</span>
                <button onClick={() => alert('Thank you for your interest! Please send your CV to careers@automax.ie')} className="bg-foreground text-background text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap">Apply Now</button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-muted-foreground text-sm mt-8">Don't see a suitable role? Send your CV to <a href="mailto:careers@automax.ie" className="text-primary hover:underline">careers@automax.ie</a></p>
      </div>
      <Footer />
    </div>
  );
}