import React, { useState } from 'react';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import ContactFormModal from '../components/automarket/ContactFormModal';
import { Link } from 'react-router-dom';

const sections = [
  {
    title: '1. Who We Are',
    content: `AutoMax is an Irish online vehicle marketplace, currently operated by Don as an individual (not yet a registered company — this will be updated here if and when the business is incorporated).

Don is the Data Controller for personal data collected through this website and mobile application.

For all data protection enquiries, please contact:
Email: privacy@automax.ie`
  },
  {
    title: '2. What Data We Collect',
    content: `We collect the following categories of personal data:

Account & Registration Data
• Full name, email address, phone number, and password when you create an account.
• Profile preferences and saved search settings.

Advertisement & Listing Data
• Vehicle information, photos, price, location, and description submitted when placing an ad.
• Business name, business address, and VAT number (if you register as a trader).

Transaction & Payment Data
• Payment method type, billing address, and transaction reference numbers. We do not store full card details — payments are processed securely by Stripe. See Stripe's Privacy Policy at stripe.com/ie/privacy.

Communication Data
• Messages sent between buyers and sellers through our Message Centre.
• Enquiries, complaints, and correspondence sent to our support team.

Usage & Technical Data
• IP address, browser type, operating system, and device identifiers.
• Pages visited, search queries entered, listings viewed, and time spent on the site.
• Referral sources (how you found AutoMax).

Cookie & Tracking Data
• We currently use only essential cookies required for the site to function (e.g. keeping you signed in, remembering your cookie preferences). We do not currently run analytics or advertising trackers. If this changes, we will update this policy and our Cookie Policy first, and request consent before any such cookie is set.`
  },
  {
    title: '3. Why We Collect It (Purposes of Processing)',
    content: `We use your personal data for the following purposes:

• To create and manage your AutoMax account.
• To publish vehicle advertisements on your behalf.
• To facilitate communication between buyers and sellers.
• To process payments for advertising packages via Stripe.
• To provide customer support and respond to enquiries.
• To send service-related notifications (e.g. ad expiry reminders, payment confirmations).
• To improve the performance, security, and user experience of our platform.
• To detect and prevent fraud, spam, and misuse of the platform.
• To comply with our legal and regulatory obligations under Irish and EU law.
• To send marketing communications about our services (only where you have given consent or where we have a legitimate interest and you have not opted out).
• To display personalised advertisements (only with your explicit cookie consent).`
  },
  {
    title: '4. Legal Basis for Processing',
    content: `Under the General Data Protection Regulation (GDPR) and the Data Protection Act 2018 (Ireland), we rely on the following legal bases:

Contract Performance (Article 6(1)(b)):
Processing your data is necessary to fulfil our contract with you — for example, to publish your ad, process your payment, and manage your account.

Legal Obligation (Article 6(1)(c)):
We are required to retain certain records (e.g. transaction records) to comply with Irish tax law and other regulatory requirements.

Legitimate Interests (Article 6(1)(f)):
We process data to prevent fraud, improve platform security, and send relevant service communications. We have conducted a Legitimate Interests Assessment (LIA) and are satisfied that our interests do not override your rights.

Consent (Article 6(1)(a)):
We rely on your consent for:
• Analytics and behavioural tracking cookies (Google Analytics).
• Advertising and remarketing cookies.
• Social media tracking pixels.
• Direct marketing emails (where you opt in).
You may withdraw your consent at any time without affecting the lawfulness of processing prior to withdrawal.`
  },
  {
    title: '5. How Long We Keep Your Data',
    content: `We retain personal data only for as long as necessary for the purposes described above, or as required by law.

Account Data: Retained for the duration of your account. If you delete your account, your personal data is deleted within 30 days, except where we are required to retain it by law.

How to delete your account: go to your Profile page, scroll to the "Danger Zone" section, and click "Delete Account." Confirming this permanently and immediately removes your account, profile, and all of your active ad listings and reports from our systems. Messages you sent to other sellers are not deleted, since the recipient has a legitimate interest in keeping their own inbox intact. Transaction and payment records are retained for 7 years as required by Irish Revenue, as described below.

Advertisement Data: Active ads are retained while your account is active. Expired or deleted ads are retained for 12 months for fraud prevention purposes, then deleted.

Transaction & Payment Records: Retained for 7 years in accordance with Irish Revenue requirements.

Communication Data (Messages): Retained for 12 months after the last message in a conversation.

Support Correspondence: Retained for 3 years after the matter is resolved.

Cookie Data: See individual retention periods in our Cookie Policy.`
  },
  {
    title: '6. Who We Share Your Data With',
    content: `We do not sell your personal data. We share data only where necessary and with appropriate safeguards in place.

Service Providers (Data Processors):
We share data with trusted third-party processors who act on our instructions:
• Amazon Web Services (AWS) — cloud infrastructure and hosting provider.
• Stripe — payment processing (stripe.com/ie/privacy).
• Resend — transactional email delivery.

We do not currently use any analytics or advertising services, and do not share data with any social media or ad-tracking companies.

All processors are bound by Data Processing Agreements (DPAs) and are required to comply with GDPR.

Public Listings:
Information you submit in an advertisement (e.g. vehicle details, photos, price, general location, and contact preferences) will be publicly visible to other users of the site. Do not include sensitive personal data in your ad description.

Legal & Regulatory Authorities:
We may disclose data to the Garda Síochána, the Data Protection Commission, Revenue Commissioners, or other competent authorities where required by law or court order.

International Transfers:
Our infrastructure is hosted in the AWS eu-west-1 (Ireland) region. Some processors (e.g. AWS, Stripe) are global companies that may process data outside the European Economic Area (EEA) as part of their own operations. Where this occurs, we ensure appropriate safeguards are in place, such as Standard Contractual Clauses (SCCs) approved by the European Commission.`
  },
  {
    title: '7. Your Rights Under GDPR',
    content: `As a data subject under the GDPR, you have the following rights:

Right of Access (Article 15):
You have the right to request a copy of all personal data we hold about you. We will respond within 30 days.

Right to Rectification (Article 16):
You have the right to have inaccurate or incomplete personal data corrected.

Right to Erasure / Right to be Forgotten (Article 17):
You can request deletion of your personal data where it is no longer necessary for the purpose it was collected, or where you withdraw consent. Some data may be retained where we have a legal obligation to do so.

Right to Restriction of Processing (Article 18):
You can ask us to restrict how we use your data in certain circumstances, such as while a complaint is being investigated.

Right to Data Portability (Article 20):
You can request your personal data in a structured, commonly used, machine-readable format (e.g. CSV/JSON) and have it transferred to another controller.

Right to Object (Article 21):
You have the right to object to processing based on legitimate interests or direct marketing at any time.

Right to Withdraw Consent (Article 7(3)):
Where processing is based on consent (e.g. marketing emails, analytics cookies), you can withdraw your consent at any time. This does not affect the lawfulness of processing before withdrawal.

Right to Lodge a Complaint:
If you are unsatisfied with how we handle your data, you have the right to lodge a complaint with the Data Protection Commission (DPC) of Ireland:
Website: dataprotection.ie
Phone: +353 57 868 4800
Post: Data Protection Commission, 21 Fitzwilliam Square South, Dublin 2, D02 RD28.

To exercise any of these rights, contact us at: privacy@automax.ie
We will respond within 30 days. We may ask you to verify your identity before processing your request.`
  },
  {
    title: '8. Data Security',
    content: `We take the security of your personal data seriously and implement appropriate technical and organisational measures, including:

• Encrypted data transmission using TLS/SSL across all pages.
• Secure password hashing — we never store plain-text passwords.
• Role-based access controls limiting internal staff access to personal data.
• Regular security reviews and vulnerability assessments.
• Secure payment processing via Stripe — AutoMax never stores full card details.

Despite these measures, no internet transmission is completely secure. In the event of a data breach that is likely to result in a risk to your rights and freedoms, we will notify the Data Protection Commission within 72 hours and affected users without undue delay, as required by Article 33 of the GDPR.`
  },
  {
    title: '9. Children\'s Privacy',
    content: `AutoMax is not directed at children under the age of 16. We do not knowingly collect personal data from children under 16. If you believe a child has provided us with personal data, please contact us at privacy@automax.ie and we will delete it promptly.`
  },
  {
    title: '10. Changes to This Privacy Policy',
    content: `We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify registered users of material changes by email and will update the "Last Updated" date below. Your continued use of AutoMax after any changes constitutes acceptance of the updated policy.`
  },
  {
    title: '11. Contact Us',
    content: `For any questions, concerns, or requests relating to this Privacy Policy or your personal data, please contact:

Email: privacy@automax.ie

For general enquiries, visit our Contact Us page.

Supervisory Authority:
Data Protection Commission (DPC)
21 Fitzwilliam Square South, Dublin 2, D02 RD28
Website: dataprotection.ie | Phone: +353 57 868 4800`
  },
];

export default function PrivacyPolicy() {
  const [showContactForm, setShowContactForm] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Privacy Policy</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: 31 August 2026 &nbsp;·&nbsp; Effective date: 18 June 2026</p>
          <p className="text-sm text-muted-foreground mt-3">
            AutoMax is committed to protecting your privacy and handling your personal data in full compliance with the{' '}
            <strong>General Data Protection Regulation (GDPR)</strong>, the{' '}
            <strong>Data Protection Act 2018</strong>, and all applicable Irish and EU data protection law. This policy explains clearly what data we collect, why we collect it, how we use it, and what rights you have.
          </p>
        </div>

        {/* Quick nav */}
        <div className="bg-secondary/50 border border-border rounded-xl p-4 mb-8">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Contents</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {sections.map((s, i) => (
              <a
                key={i}
                href={`#section-${i}`}
                className="text-sm text-primary hover:underline py-0.5"
              >
                {s.title}
              </a>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-6">
          {sections.map((s, i) => (
            <div key={i} id={`section-${i}`} className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-foreground mb-3">{s.title}</h2>
              <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{s.content}</div>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm mt-8 text-center">
          <h3 className="text-base font-bold text-foreground mb-2">Questions about your privacy?</h3>
          <p className="text-sm text-muted-foreground mb-4">Submit a request and our Data Protection team will respond within 30 days.</p>
          <button onClick={() => setShowContactForm(true)} className="bg-primary text-white font-semibold py-2.5 px-8 rounded-xl hover:bg-primary/90 transition-colors text-sm">
            Submit a Request
          </button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-10">
          Related: <Link to="/cookie-policy" className="text-primary hover:underline">Cookie Policy</Link> &nbsp;·&nbsp; <Link to="/terms-and-conditions" className="text-primary hover:underline">Terms & Conditions</Link> &nbsp;·&nbsp; <Link to="/manage-cookies" className="text-primary hover:underline">Manage Cookies</Link>
        </p>
      </div>
      <ContactFormModal isOpen={showContactForm} onClose={() => setShowContactForm(false)} defaultReason="Privacy / GDPR" />
      <Footer />
    </div>
  );
}