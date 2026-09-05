import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Menu, X, User, Megaphone, MessageSquare, Bookmark, ThumbsUp, History, CreditCard, HelpCircle, LogOut, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import PlaceAdModal from './PlaceAdModal';
import MobileMenu from './MobileMenu';
import { useNavigate, useLocation } from 'react-router-dom';

const userMenuItems = [
{ label: 'Profile', icon: User },
{ label: 'My Ads', icon: Megaphone },
{ label: 'Messages', icon: MessageSquare },

{ label: 'Liked Ads', icon: ThumbsUp },
{ label: 'Browsing History', icon: History },
{ divider: true },
{ label: 'Payment Records', icon: CreditCard },
{ label: 'Help', icon: HelpCircle },
{ label: 'Log out', icon: LogOut, action: 'logout' }];


const dealersMenuItems = [
{ label: 'Find a dealer' },
{ label: 'Information for dealers' }];


export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showPlaceAd, setShowPlaceAd] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDealersMenu, setShowDealersMenu] = useState(false);
  const menuRef = useRef(null);
  const dealersMenuRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isRootPage = location.pathname === '/';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
      if (dealersMenuRef.current && !dealersMenuRef.current.contains(e.target)) {
        setShowDealersMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const isLoggedIn = !!user;

  const handlePlaceAd = () => {
    if (!isLoggedIn) {
      navigate('/login?next=/place-ad');
    } else {
      navigate('/place-ad');
    }
  };

  const navLinks = [
  { label: "Buyer's Tips" },
  { label: "Seller's Tips" },
  { label: 'Dealers', hasDropdown: true },
  { label: 'Car Rent', hasDropdown: true },
  { label: 'Recovery Service', hasDropdown: true }];


  return (
    <nav className="bg-[hsl(var(--background))] sticky top-0 z-50 border-b border-gray-200" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 relative">
          {/* Mobile: Back button (sub-pages) or spacer (root) */}
          {!isRootPage ? (
            <button
              onClick={() => navigate(-1)}
              className="lg:hidden flex items-center gap-1 text-foreground text-sm font-medium hover:text-primary transition-colors flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </button>
          ) : (
            <div className="lg:hidden w-6" />
          )}

          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-2 flex-none whitespace-nowrap w-fit relative z-20 cursor-pointer py-1">
            <span className="text-xl font-extrabold tracking-tight text-[hsl(var(--primary))]">AutoMax</span>
            <img src="/img/ca07bfd68_generated_image.jpg" alt="AutoMax Logo" className="w-6 h-6 object-contain flex-shrink-0" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-5">
            {navLinks.map((link) =>
            link.label === "Buyer's Tips" ?
            <Link
              key="Buyer's Tips"
              to="/buying-tips"
              className="text-[hsl(var(--foreground))] px-3 py-2 text-sm font-medium hover:underline flex items-center gap-1 transition-colors">
              Buyer's Tips
            </Link> :
            link.label === "Seller's Tips" ?
            <Link
              key="Seller's Tips"
              to="/selling-tips"
              className="text-[hsl(var(--foreground))] px-3 py-2 text-sm font-medium hover:underline flex items-center gap-1 transition-colors">
              Seller's Tips
            </Link> :
            link.label === 'Dealers' ?
            <div key="Dealers" className="relative" ref={dealersMenuRef}>
                  <button
                onClick={() => setShowDealersMenu((v) => !v)}
                className="text-[hsl(var(--foreground))] px-3 py-2 text-sm font-medium hover:underline flex items-center gap-1 transition-colors">
                    Dealers <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  {showDealersMenu &&
              <div className="absolute left-0 mt-2 w-52 bg-card border border-border rounded-xl shadow-lg py-1 z-50">
                      {dealersMenuItems.map((item) =>
                item.label === 'Find a dealer' ?
                <Link
                  key={item.label}
                  to="/dealers"
                  onClick={() => setShowDealersMenu(false)}
                  className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
                            {item.label}
                          </Link> :

                <button
                  key={item.label}
                  onClick={() => setShowDealersMenu(false)}
                  className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
                            {item.label}
                          </button>

                )}
                    </div>
              }
                </div> :
            link.label === 'Car Rent' ?
            <Link
              key="Car Rent"
              to="/car-rent"
              className="text-[hsl(var(--foreground))] px-3 py-2 text-sm font-medium hover:underline flex items-center gap-1 transition-colors">
                  Car Rent
                </Link> :
            link.label === 'Recovery Service' ?
            <Link
              key="Recovery Service"
              to="/recovery-service"
              className="text-[hsl(var(--foreground))] px-3 py-2 text-sm font-medium hover:underline flex items-center gap-1 transition-colors">
                  Recovery Service
                </Link> :

            <button
              key={link.label} className="text-[hsl(var(--foreground))] px-3 py-2 text-sm font-medium hover:text-destructive flex items-center gap-1 transition-colors">
                  {link.label}
                  {link.hasDropdown && <ChevronDown className="w-3.5 h-3.5" />}
                </button>

            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 sm:gap-4 lg:gap-10 flex-shrink-0">
            <Button
              onClick={handlePlaceAd}
              className="bg-transparent border border-foreground text-semibold hover:bg-secondary hover:text-foreground font-semibold px-4 sm:px-6 lg:px-10 min-h-[44px] text-sm whitespace-nowrap flex-shrink-0">
              Place Ad
            </Button>

            {!isLoggedIn ?
            <button
              onClick={() => navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`)}
              className="hidden sm:block text-foreground text-sm font-medium hover:underline transition-all ml-1">
                Sign in/up
              </button> :

            <div className="relative hidden sm:block" ref={menuRef}>
                <button
                onClick={() => setShowUserMenu((v) => !v)}
                className="flex items-center gap-1 text-foreground text-sm font-medium hover:underline transition-all">
                  My Account <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {showUserMenu &&
              <div className="absolute right-0 mt-2 w-52 bg-card border border-border rounded-xl shadow-lg py-1 z-50">
                    {userMenuItems.map((item, i) =>
                item.divider ?
                <div key={i} className="border-t border-border my-1" /> :
                item.label === 'Profile' ?
                <Link
                  key={item.label}
                  to="/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
                          <item.icon className="w-4 h-4 text-muted-foreground" />
                          {item.label}
                        </Link> :
                item.label === 'Liked Ads' ?
                <Link
                  key={item.label}
                  to="/saved-searches?tab=liked"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
                          <item.icon className="w-4 h-4 text-muted-foreground" />
                          {item.label}
                        </Link> :
                item.label === 'My Ads' ?
                <Link
                  key={item.label}
                  to="/my-ads"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
                          <item.icon className="w-4 h-4 text-muted-foreground" />
                          {item.label}
                        </Link> :
                item.label === 'Messages' ?
                <Link
                  key={item.label}
                  to="/messages"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
                          <item.icon className="w-4 h-4 text-muted-foreground" />
                          {item.label}
                        </Link> :
                item.label === 'Saved Searches' ?
                <Link
                  key={item.label}
                  to="/saved-searches"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
                          <item.icon className="w-4 h-4 text-muted-foreground" />
                          {item.label}
                        </Link> :
                item.label === 'Browsing History' ?
                <Link
                  key={item.label}
                  to="/browsing-history"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
                          <item.icon className="w-4 h-4 text-muted-foreground" />
                          {item.label}
                        </Link> :
                item.label === 'Payment Records' ?
                <Link
                  key={item.label}
                  to="/payment-history"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
                          <item.icon className="w-4 h-4 text-muted-foreground" />
                          {item.label}
                        </Link> :
                item.label === 'Help' ?
                <Link
                  key={item.label}
                  to="/help"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
                          <item.icon className="w-4 h-4 text-muted-foreground" />
                          {item.label}
                        </Link> :

                <button
                  key={item.label}
                  onClick={() => {
                    setShowUserMenu(false);
                    if (item.action === 'logout') api.auth.logout(window.location.origin + '/');
                  }}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-primary hover:bg-secondary transition-colors">
                          <item.icon className="w-4 h-4 text-primary" />
                          {item.label}
                        </button>

                )}
                  </div>
              }
              </div>
            }

            <button
              className="lg:hidden text-foreground flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
              onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {showPlaceAd && <PlaceAdModal onClose={() => setShowPlaceAd(false)} />}

      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onPlaceAd={handlePlaceAd}
      />
    </nav>);
}