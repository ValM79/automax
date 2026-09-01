import React from 'react';
import { Link } from 'react-router-dom';

const footerSections = [
{
  title: 'Company',
  links: [
  { label: 'About us', route: '/about-us' },
  { label: 'Contact us', route: '/contact-us' },
  { label: 'Help', route: '/help' },
  { label: 'Reviews Gallery', route: '/reviews-gallery' },
  { label: 'Career', route: '/career' }]

},
{
  title: "Information",
  links: [
  { label: 'Cookie policy', route: '/cookie-policy' },
  { label: 'Privacy policy', route: '/privacy-policy' },
  { label: 'Terms & conditions', route: '/terms-and-conditions' },
  { label: 'Manage cookies', route: '/manage-cookies' },
  { label: 'Accessibility', route: '/accessibility' }]

},
{
  title: 'Resources',
  links: [
  { label: 'Dealers information', route: '/dealers-information' },
  { label: 'Advertisement', route: '/advertisement' }]

}];


export default function Footer() {
  return (
    <footer className="bg-foreground text-background/70" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="max-w-7xl mx-auto px-8 py-10">

        {/* Top section: Logo + Links + App Download */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-8 mb-8">

          {/* Logo + App Store buttons */}
          <div className="flex flex-col gap-4 items-center text-center">
            <div className="flex items-center gap-2">
              <span className="text-background text-xl font-extrabold tracking-tight">AutoMax</span>
              <img
                src="https://media.base44.com/images/public/69ceb6b4f41f5a2cee0c7016/ca07bfd68_generated_image.png"
                alt="AutoMax Logo"
                className="w-6 h-6 object-contain"
                style={{ filter: 'invert(1) brightness(0.7)', mixBlendMode: 'screen' }} />
              
            </div>

            {/* Download our App */}
            <div>
              <p className="text-background text-sm font-semibold mb-3">Download our App</p>
              <div className="flex flex-col gap-1 items-center justify-center w-full">
                <a href="#" className="hover:opacity-80 transition-opacity w-full">
                  <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="Download on the App Store" className="h-12 w-full object-contain" />
                </a>
                <a href="https://play.google.com/store/apps/details?id=com.base69ceb6b4f41f5a2cee0c7016.app" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity w-full">
                  <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" className="h-16 w-full object-contain" />
                </a>
              </div>
            </div>
          </div>

          {/* Nav link columns */}
          {footerSections.map((section) =>
          <div key={section.title}>
              <h3 className="text-background font-semibold text-sm mb-4">{section.title}</h3>
              <ul className="space-y-2.5">
                {section.links.map((link) =>
              <li key={link.label}>
                    <Link to={link.route} className="text-sm hover:text-background transition-colors">
                      {link.label}
                    </Link>
                  </li>
              )}
              </ul>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-background/10 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-background/40 text-center">© 2026 AutoMax. All rights reserved. Ireland's largest car marketplace.</p>
            
          </div>
        </div>

      </div>
    </footer>);

}