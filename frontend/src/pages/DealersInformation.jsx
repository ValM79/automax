import React from 'react';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import { Link } from 'react-router-dom';

// How a Dealer account works, step by step. Plain text only: it describes what the site does today.
function Section({ title, children }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-foreground mb-3">{title}</h2>
      {children}
    </section>
  );
}

const list = 'list-decimal pl-5 space-y-2 text-foreground';
const bullets = 'list-disc pl-5 space-y-2 text-foreground';

export default function DealersInformation() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="max-w-3xl w-full mx-auto px-4 py-10 flex-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Dealers information</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Dealers information</h1>
        <p className="text-muted-foreground mb-10">
          How to set up your dealer account, place your ads and keep them under control. A Dealer account is for a business that buys and sells vehicles. It gets its own card in Dealers Garages and its own page.
        </p>

        <Section title="1. Create your Dealer account">
          <ol className={list}>
            <li>Press <strong>Sign in/up</strong>, then <strong>Sign up</strong>.</li>
            <li>Under <strong>Account Type</strong> choose <strong>Dealer</strong>.</li>
            <li>Enter your <strong>Business Name</strong> (this is the name buyers see), your email and a password.</li>
            <li>Press <strong>Create account</strong>, then enter the code we email you to confirm your address.</li>
          </ol>
          <p className="text-muted-foreground mt-3">
            The moment your account exists, your dealership has a card in Dealers Garages and a page of its own. You do not need to place an ad first.
          </p>
        </Section>

        <Section title="2. Set up your dealer page">
          <p className="text-foreground mb-3">Open <strong>My Account</strong>, then <strong>Profile</strong>. A Dealer account has its own profile with these parts:</p>
          <ul className={bullets}>
            <li><strong>Logo</strong> (press <strong>Add Logo</strong>): your logo, shown on your card and on your page.</li>
            <li><strong>Business Photo</strong> (press <strong>Add Business Photo</strong>): a photo of your premises or stock. It is the background of your card in Dealers Garages and the banner of your page. Use a wide photo.</li>
            <li><strong>Contact Information</strong>: your business name, <strong>About Your Dealership</strong> (a few lines about what you sell and how long you have been trading, up to 500 characters, shown in the Contact Us tab of your page), business address (two lines), county, Eircode, area or town, phone number and your <strong>Link my Website</strong> if you have one (shown as a View Website link in the Contact Us tab). The county and area are the location shown on your card, and the address is shown in the Contact Us tab.</li>
            <li><strong>Opening Hours</strong>: a row for every day of the week and one for Bank Holiday. Type your hours like <em>09:00 - 18:00</em>, or press <strong>Closed</strong>. A day you leave empty is not shown on your page.</li>
            <li><strong>Dealership Details</strong>: your VAT number (if you have one) and your account email.</li>
            <li><strong>How buyers can contact you</strong>: tick <strong>Message</strong>, <strong>Phone</strong>, <strong>WhatsApp</strong> and <strong>Email</strong> for the ways you want (it is its own section further down your Profile). Message and Phone also appear in the filters column of your page; WhatsApp and Email appear in the Contact Us tab only. Phone is ticked to start with: untick it if you do not want buyers to phone you. For WhatsApp you can give a WhatsApp number (or leave it empty to use your phone number). For Email you choose the contact email to show. It is shown publicly on your page.</li>
            <li><strong>Reviews</strong>: tick <strong>Allow reviews on my dealer page</strong> if you want buyers to be able to review you. It is ticked to start with. Untick it to hide the Reviews tab on your page.</li>
          </ul>
          <p className="text-foreground mt-3">Press <strong>Save Changes</strong> at the bottom of the page. The photo and logo are saved as soon as you choose them. To see how your page looks to buyers, press <strong>View my dealer page</strong>, the button under Save Changes at the bottom of your Profile.</p>
        </Section>

        <Section title="3. Place an ad">
          <ol className={list}>
            <li>Press the <strong>Place Ad</strong> button.</li>
            <li>Choose the <strong>category</strong> that fits the vehicle: cars, vans, motorbikes, campers and so on. Your page groups your stock by these categories, so buyers can filter by section.</li>
            <li>Add your photos (up to 12), then fill in the title, description, price and the vehicle details.</li>
            <li>Check your contact details and business details. They are filled in from your Profile.</li>
            <li>Choose an ad package (Basic, Standard or Premium). They differ in how long the ad runs and in extras such as bumps to the top. The price is shown before you pay.</li>
            <li>Pay. After paying you are taken to your dealer page, where the ad now appears under <strong>Our Stock</strong>.</li>
          </ol>
          <p className="text-muted-foreground mt-3">
            Each ad is paid for when you place it. Your ad appears on your dealer page and in the category you chose, so buyers can find it in the category lists and through your card in Dealers Garages.
          </p>
        </Section>

        <Section title="4. Control your ads">
          <p className="text-foreground mb-3">Open <strong>My Account</strong>, then <strong>My Ads</strong>. Each ad shows its price, how many times it was viewed and saved, and how many days it has left. Press the three dots on an ad to:</p>
          <ul className={bullets}>
            <li><strong>View</strong>: see the ad as a buyer sees it.</li>
            <li><strong>Renew my Ad</strong>: run the ad again for another period. You choose a package and pay, as when placing it.</li>
            <li><strong>Edit</strong>: change the photos, price, description or any other detail. Change the price here when you reduce it.</li>
            <li><strong>Mark as Sold</strong>: take a sold vehicle off your page. Do this as soon as a vehicle is sold so buyers do not ask about it.</li>
            <li><strong>Delete</strong>: remove the ad for good. This cannot be undone.</li>
          </ul>
          <p className="text-muted-foreground mt-3">An ad ends by itself when the days of its package run out. Use <strong>Renew my Ad</strong> if you want to keep it listed.</p>
        </Section>

        <Section title="5. Answer buyers">
          <ul className={bullets}>
            <li>Buyers can send you a message from any of your ads, and from your dealer page if you ticked Message. Open <strong>My Account</strong>, then <strong>Messages</strong> to read and answer them.</li>
            <li>You get an email whenever a buyer sends you a message.</li>
            <li><strong>Reviews</strong>: if you allow reviews in your Profile, a buyer who has sent you a message through AutoMax can rate you from 1 to 5 stars and write a comment in the Reviews tab of your page. You get an email when a new review arrives. Press <strong>Reply</strong> under a review to answer it in public. You cannot edit or delete a review, but if one is false or abusive, press <strong>Report</strong> on it and we will check it.</li>
            <li>Your phone number and opening hours are on your page, in the Our Stock sidebar and in the Contact Us tab.</li>
          </ul>
        </Section>

        <Section title="Good to know">
          <ul className={bullets}>
            <li>Your page has three tabs: <strong>Our Stock</strong> (your live ads, with a section filter, a price filter and a sort option), <strong>Contact Us</strong> and <strong>Reviews</strong>.</li>
            <li>Keep your stock up to date. Mark vehicles as sold and renew the ads you still want listed.</li>
            <li>Clear, bright photos and a full description get more messages.</li>
          </ul>
        </Section>

        <div className="bg-card border border-border rounded-2xl p-6 text-center">
          <p className="text-foreground font-semibold mb-1">Questions from a dealer?</p>
          <p className="text-muted-foreground">
            Email us at <a href="mailto:dealers@automax.ie" className="text-primary font-semibold hover:underline">dealers@automax.ie</a>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
