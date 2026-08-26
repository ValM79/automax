import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Terms & Conditions</span>
        </div>

        <h1 className="text-3xl font-extrabold text-foreground mb-2">Terms & Conditions</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: June 2026</p>

        <div className="flex flex-col gap-8 text-sm text-foreground leading-relaxed">

          <Section title="1. Acceptance of Terms">
            <p>By accessing or using AutoMax ("the Platform"), you agree to be bound by these Terms & Conditions. If you do not agree to these terms, please do not use the Platform. AutoMax reserves the right to update these terms at any time without prior notice. Continued use of the Platform after any changes constitutes acceptance of the new terms.</p>
          </Section>

          <Section title="2. Use of the Platform">
            <p>AutoMax is an online marketplace connecting private individuals and traders for the buying and selling of vehicles and related items. You agree to use the Platform only for lawful purposes and in a manner consistent with all applicable laws and regulations in Ireland and the European Union.</p>
            <ul className="list-disc ml-5 mt-3 space-y-1.5 text-muted-foreground">
              <li>You must be at least 18 years old to place an ad or purchase on the Platform.</li>
              <li>You are responsible for the accuracy of all information you submit.</li>
              <li>You may not use the Platform to post misleading, fraudulent, or illegal listings.</li>
              <li>Scraping, automated access, or data mining of the Platform is strictly prohibited.</li>
            </ul>
          </Section>

          <Section title="3. Placing Advertisements">
            <p>When you place an ad on AutoMax, you confirm that:</p>
            <ul className="list-disc ml-5 mt-3 space-y-1.5 text-muted-foreground">
              <li>You are the rightful owner of the item(s) listed, or are authorised to sell on behalf of the owner.</li>
              <li>All information provided in the ad is accurate, complete, and not misleading.</li>
              <li>The item listed complies with all applicable Irish and EU laws, including consumer protection legislation.</li>
              <li>You will promptly remove or update any ad once an item has been sold.</li>
            </ul>
            <p className="mt-3">AutoMax reserves the right to remove any ad at its sole discretion without notice if it violates these Terms or is deemed inappropriate.</p>
          </Section>

          <Section title="4. Ad Packages and Payments">
            <p>AutoMax offers paid advertising packages (Basic, Standard, and Premium). By selecting a package and completing payment, you agree to the following:</p>
            <ul className="list-disc ml-5 mt-3 space-y-1.5 text-muted-foreground">
              <li><strong>Basic (€1):</strong> 60-day listing, up to 12 photos.</li>
              <li><strong>Standard (€3):</strong> 72-day listing, up to 12 photos, 2 automatic bumps (1 every 4 weeks).</li>
              <li><strong>Premium (€7):</strong> 90-day listing, up to 12 photos, 3 automatic bumps (1 every 3 weeks), 5-day Spotlight placement.</li>
            </ul>
            <p className="mt-3">Bike categories (Motorbikes, Scooters, Quads, Bikes & Bicycles, and related extras) are charged at reduced rates: Basic €0.50, Standard €1, and Premium €3.</p>
            <p className="mt-3">Payments are processed securely via Stripe. AutoMax does not store your payment card details. All prices are inclusive of VAT where applicable. Packages are non-refundable once an ad has been published.</p>
          </Section>

          <Section title="5. Prohibited Content">
            <p>The following content is strictly prohibited on AutoMax:</p>
            <ul className="list-disc ml-5 mt-3 space-y-1.5 text-muted-foreground">
              <li>Stolen, cloned, or illegally modified vehicles.</li>
              <li>Vehicles with clocked or tampered odometers.</li>
              <li>Items that infringe intellectual property rights.</li>
              <li>Offensive, defamatory, or discriminatory content.</li>
              <li>Any content that violates Irish or EU law.</li>
            </ul>
          </Section>

          <Section title="6. Trader Obligations">
            <p>If you identify as a trader on the Platform, you are subject to additional obligations under Irish consumer protection law, including the Consumer Rights Act 2022. Traders must ensure all listings include accurate pricing (inclusive of VAT), clear descriptions, and comply with distance selling regulations where applicable.</p>
          </Section>

          <Section title="7. Limitation of Liability">
            <p>AutoMax acts solely as a platform facilitating connections between buyers and sellers. We are not a party to any transaction and are not responsible for:</p>
            <ul className="list-disc ml-5 mt-3 space-y-1.5 text-muted-foreground">
              <li>The accuracy or completeness of any listing.</li>
              <li>The condition, legality, or title of any vehicle or item listed.</li>
              <li>Any loss, damage, or injury arising from a transaction conducted through the Platform.</li>
            </ul>
            <p className="mt-3">To the maximum extent permitted by law, AutoMax's total liability to you shall not exceed the amount paid by you for the relevant ad package.</p>
          </Section>

          <Section title="8. Privacy and Data Protection">
            <p>AutoMax processes personal data in accordance with the General Data Protection Regulation (GDPR) and the Irish Data Protection Act 2018. By using the Platform, you consent to the collection and processing of your data as described in our <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>. You have the right to access, correct, or request deletion of your personal data at any time by contacting us at <span className="text-primary">privacy@automax.ie</span>.</p>
          </Section>

          <Section title="9. Intellectual Property">
            <p>All content on the AutoMax Platform, including logos, design, software, and text, is the intellectual property of AutoMax or its licensors and is protected by applicable copyright and trademark laws. You may not reproduce, distribute, or create derivative works without prior written consent from AutoMax.</p>
          </Section>

          <Section title="10. Governing Law">
            <p>These Terms & Conditions are governed by and construed in accordance with the laws of Ireland. Any disputes arising in connection with these Terms shall be subject to the exclusive jurisdiction of the Irish courts.</p>
          </Section>

          <Section title="11. Contact Us">
            <p>If you have any questions about these Terms & Conditions, please contact us:</p>
            <div className="mt-3 space-y-1 text-muted-foreground">
              <p><strong className="text-foreground">AutoMax</strong> — operated by Don</p>
              <p>Email: <a href="mailto:support@automax.ie" className="text-primary hover:underline">support@automax.ie</a></p>
            </div>
          </Section>

        </div>
      </div>

      <Footer />
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <h2 className="text-base font-bold text-foreground mb-4">{title}</h2>
      <div className="text-sm text-foreground leading-relaxed space-y-2">{children}</div>
    </div>
  );
}