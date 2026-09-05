import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const DEFAULT_SEO = {
  title: "AutoMax — Ireland's Largest Car Marketplace",
  description: "Buy and sell cars, vans, motorbikes, boats and more on AutoMax — Ireland's largest motor marketplace. Thousands of new and used vehicles from dealers and private sellers."
};

const routeSeo = {
  '/': DEFAULT_SEO,
  '/cars-for-sale': { title: 'Cars For Sale in Ireland | AutoMax', description: 'Browse thousands of new and used cars for sale across Ireland. Filter by make, model, price, year, fuel type and location on AutoMax.' },
  '/new-cars': { title: 'New Cars For Sale | AutoMax', description: 'Shop the latest new cars for sale in Ireland. Browse new car listings from dealers nationwide on AutoMax.' },
  '/dealership-cars': { title: 'Dealership Cars For Sale | AutoMax', description: 'Browse dealership cars for sale in Ireland. Find quality vehicles from trusted dealers on AutoMax.' },
  '/electric-hybrid-cars': { title: 'Electric & Hybrid Cars For Sale | AutoMax', description: 'Discover electric and hybrid cars for sale in Ireland. Compare EV range, battery size and prices on AutoMax.' },
  '/vintage-cars': { title: 'Vintage & Classic Cars For Sale | AutoMax', description: 'Browse vintage and classic cars for sale in Ireland. Find timeless automobiles from trusted sellers on AutoMax.' },
  '/modified-cars': { title: 'Modified Cars For Sale | AutoMax', description: 'Find modified and tuned cars for sale in Ireland. Browse performance and custom vehicles on AutoMax.' },
  '/rally-cars': { title: 'Rally Cars For Sale | AutoMax', description: 'Browse rally cars for sale in Ireland. Find competition and performance rally vehicles on AutoMax.' },
  '/breaking-repairables': { title: 'Breaking & Repairables For Sale | AutoMax', description: 'Browse breaking and repairable vehicles for sale in Ireland on AutoMax.' },
  '/car-parts': { title: 'Car Parts For Sale | AutoMax', description: 'Browse car parts for sale in Ireland. Find new and used parts for all makes and models on AutoMax.' },
  '/car-extras': { title: 'Car Extras & Accessories For Sale | AutoMax', description: 'Browse car extras and accessories for sale in Ireland on AutoMax.' },
  '/commercials': { title: 'Commercials & Vans For Sale | AutoMax', description: 'Browse commercial vehicles and vans for sale in Ireland. Find the right work vehicle on AutoMax.' },
  '/trucks': { title: 'Trucks For Sale in Ireland | AutoMax', description: 'Browse trucks for sale across Ireland. Find new and used trucks on AutoMax.' },
  '/trailers': { title: 'Trailers For Sale | AutoMax', description: 'Browse trailers for sale in Ireland on AutoMax.' },
  '/campers': { title: 'Campers & Motorhomes For Sale | AutoMax', description: 'Browse campers and motorhomes for sale in Ireland on AutoMax.' },
  '/coaches-buses': { title: 'Coaches & Buses For Sale | AutoMax', description: 'Browse coaches and buses for sale in Ireland on AutoMax.' },
  '/plant-machinery': { title: 'Plant & Machinery For Sale | AutoMax', description: 'Browse plant and machinery for sale in Ireland on AutoMax.' },
  '/motorbikes': { title: 'Motorbikes For Sale in Ireland | AutoMax', description: 'Browse motorbikes for sale across Ireland. Find sports bikes, cruisers and more on AutoMax.' },
  '/vintage-bikes': { title: 'Vintage Bikes For Sale | AutoMax', description: 'Browse vintage and classic motorcycles for sale in Ireland on AutoMax.' },
  '/scooters': { title: 'Scooters For Sale | AutoMax', description: 'Browse scooters for sale in Ireland on AutoMax.' },
  '/quads': { title: 'Quads & ATVs For Sale | AutoMax', description: 'Browse quads and ATVs for sale in Ireland on AutoMax.' },
  '/caravans': { title: 'Caravans For Sale | AutoMax', description: 'Browse caravans for sale in Ireland on AutoMax.' },
  '/boats': { title: 'Boats & Jet Skis For Sale | AutoMax', description: 'Browse boats and jet skis for sale in Ireland on AutoMax.' },
  '/boat-extras': { title: 'Boat Extras For Sale | AutoMax', description: 'Browse boat extras and accessories for sale in Ireland on AutoMax.' },
  '/other-motor': { title: 'Other Motor Vehicles For Sale | AutoMax', description: 'Browse other motor vehicles for sale in Ireland on AutoMax.' },
  '/motorbike-extras': { title: 'Motorbike Extras For Sale | AutoMax', description: 'Browse motorbike extras and accessories for sale in Ireland on AutoMax.' },
  '/bikes-bicycles': { title: 'Bikes & Bicycles For Sale | AutoMax', description: 'Browse bikes and bicycles for sale in Ireland on AutoMax.' },
  '/place-ad': { title: 'Place an Ad — Sell Your Car | AutoMax', description: "Sell your car, van or motorbike on AutoMax — Ireland's largest car marketplace. Place your ad in minutes and reach thousands of buyers." },
  '/dealers': { title: 'Find Car Dealers in Ireland | AutoMax', description: 'Search trusted car dealers across Ireland. Browse dealership inventories and find your next vehicle on AutoMax.' },
  '/car-rent': { title: 'Car Rental in Ireland | AutoMax', description: 'Find car rental options across Ireland on AutoMax.' },
  '/recovery-service': { title: 'Vehicle Recovery Service | AutoMax', description: 'Find vehicle recovery services across Ireland on AutoMax.' },
  '/buying-tips': { title: 'Car Buying Tips & Guides | AutoMax', description: 'Expert tips and guides for buying a car in Ireland. Learn how to inspect, negotiate and buy safely on AutoMax.' },
  '/selling-tips': { title: 'Car Selling Tips & Guides | AutoMax', description: 'Learn how to sell your car fast and safely on AutoMax. Expert tips for creating great ads and closing deals.' },
  '/how-to-sell-my-car': { title: 'How To Sell My Car | AutoMax', description: 'Step-by-step guide to selling your car on AutoMax. List your vehicle, reach buyers and complete the sale safely.' },
  '/about-us': { title: 'About AutoMax | AutoMax', description: "Learn about AutoMax, Ireland's largest car marketplace. Our mission is to make buying and selling vehicles simple and safe." },
  '/contact-us': { title: 'Contact Us | AutoMax', description: "Get in touch with the AutoMax team. We're here to help with any questions about buying or selling vehicles." },
  '/terms-and-conditions': { title: 'Terms & Conditions | AutoMax', description: 'Read the terms and conditions for using AutoMax — Ireland’s largest car marketplace.' },
  '/privacy-policy': { title: 'Privacy Policy | AutoMax', description: 'Read the AutoMax privacy policy to understand how we handle your data.' },
  '/cookie-policy': { title: 'Cookie Policy | AutoMax', description: 'Read the AutoMax cookie policy to understand how we use cookies.' },
  '/help': { title: 'Help & Support | AutoMax', description: 'Find answers to common questions and get support for buying and selling on AutoMax.' },
  '/reviews-gallery': { title: 'Reviews Gallery | AutoMax', description: 'Read customer reviews and testimonials about AutoMax — Ireland’s largest car marketplace.' },
  '/career': { title: 'Careers at AutoMax | AutoMax', description: 'Explore career opportunities at AutoMax — Ireland’s largest car marketplace.' },
  '/login': { title: 'Login | AutoMax', description: 'Log in to your AutoMax account to manage your ads, messages and favourites.' },
  '/create-account': { title: 'Create Account | AutoMax', description: 'Create a free AutoMax account to place ads, save favourites and message sellers.' },
};

function upsertMeta(selector, attr, name, content) {
  if (!content) return;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertRouteJsonLd(data) {
  const existing = document.getElementById('route-jsonld');
  if (existing) existing.remove();
  if (data) {
    const el = document.createElement('script');
    el.id = 'route-jsonld';
    el.type = 'application/ld+json';
    el.textContent = JSON.stringify(data);
    document.head.appendChild(el);
  }
}

/**
 * Set SEO meta tags dynamically from a page component.
 * Usage: setSeoMeta({ title, description, image, url, jsonLd })
 */
export function setSeoMeta({ title, description, image, url, jsonLd }) {
  if (title) {
    document.title = title;
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', title);
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
  }
  if (description) {
    upsertMeta('meta[name="description"]', 'name', 'description', description);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', description);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
  }
  if (image) upsertMeta('meta[property="og:image"]', 'property', 'og:image', image);
  if (url) {
    upsertCanonical(url);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', url);
  }
  upsertRouteJsonLd(jsonLd || null);
}

export default function SeoManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    let seo = routeSeo[pathname] || DEFAULT_SEO;
    let jsonLd = null;

    if (pathname.startsWith('/cars-by-make/')) {
      const make = decodeURIComponent(pathname.split('/cars-by-make/')[1]);
      seo = { title: `${make} Cars For Sale in Ireland | AutoMax`, description: `Browse ${make} cars for sale across Ireland. Find new and used ${make} vehicles from dealers and private sellers on AutoMax.` };
    } else if (pathname.startsWith('/vehicle/')) {
      seo = { title: 'Vehicle Details | AutoMax', description: 'View vehicle details, photos, specs and seller information on AutoMax — Ireland’s largest car marketplace.' };
    } else if (pathname.startsWith('/seller-ads/')) {
      seo = { title: 'Seller Listings | AutoMax', description: 'Browse all vehicle listings from this seller on AutoMax.' };
    } else if (pathname.startsWith('/edit-ad/')) {
      seo = { title: 'Edit Ad | AutoMax', description: 'Edit your vehicle ad on AutoMax.' };
    } else if (pathname.startsWith('/report-ad/')) {
      seo = { title: 'Report Ad | AutoMax', description: 'Report a listing on AutoMax.' };
    }

    const url = window.location.origin + pathname;
    document.title = seo.title;
    upsertMeta('meta[name="description"]', 'name', 'description', seo.description);
    upsertCanonical(url);
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', seo.title);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', seo.description);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', url);
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', seo.title);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', seo.description);

    if (pathname === '/') {
      const origin = window.location.origin;
      jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            name: 'AutoMax',
            url: origin,
            logo: '/img/ca07bfd68_generated_image.jpg',
            description: "Ireland's largest car marketplace for buying and selling vehicles.",
            areaServed: { '@type': 'Country', name: 'Ireland' }
          },
          {
            '@type': 'WebSite',
            name: 'AutoMax',
            url: origin,
            potentialAction: {
              '@type': 'SearchAction',
              target: `${origin}/cars-for-sale?q={search_term_string}`,
              'query-input': 'required name=search_term_string'
            }
          }
        ]
      };
    }
    upsertRouteJsonLd(jsonLd);
  }, [pathname]);

  return null;
}