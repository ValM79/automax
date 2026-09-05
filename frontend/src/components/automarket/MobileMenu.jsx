import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, X, User, Megaphone, MessageSquare, ThumbsUp, History, CreditCard, HelpCircle, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const dealersMenuItems = [
  { label: 'Find a dealer', route: '/dealers' },
  { label: 'Information for dealers', route: '/dealers-information' }];

const dropdownMap = {
  Dealers: dealersMenuItems
};

const navLinks = [
  { label: "Buyer's Tips", route: '/buying-tips', hasDropdown: false },
  { label: "Seller's Tips", route: '/selling-tips', hasDropdown: false },
  { label: 'Dealers', hasDropdown: true },
  { label: 'Car Rent', route: '/car-rent', hasDropdown: false },
  { label: 'Recovery Service', route: '/recovery-service', hasDropdown: false }];


const userMenuItems = [
  { label: 'Profile', icon: User, route: '/profile' },
  { label: 'My Ads', icon: Megaphone, route: '/my-ads' },
  { label: 'Messages', icon: MessageSquare, route: '/messages' },
  { label: 'Liked Ads', icon: ThumbsUp, route: '/saved-searches?tab=liked' },
  { label: 'Browsing History', icon: History, route: '/browsing-history' },
  { divider: true },
  { label: 'Payment Records', icon: CreditCard, route: '/payment-history' },
  { label: 'Help', icon: HelpCircle, route: '/help' },
  { label: 'Log out', icon: LogOut, action: 'logout' }];


export default function MobileMenu({ open, onClose, onPlaceAd }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expandedMenu, setExpandedMenu] = useState(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const statePushedRef = useRef(false);

  // Hardware back button support: push a history state when the menu opens
  // so the device back button closes the menu instead of navigating away.
  // On close, pop the state if it wasn't already consumed by a back press.
  useEffect(() => {
    if (!open) {
      if (statePushedRef.current) {
        statePushedRef.current = false;
        if (window.history.state?.mobileMenu) {
          window.history.back();
        }
      }
      return;
    }

    statePushedRef.current = true;
    window.history.pushState({ mobileMenu: true }, '');

    const handlePopState = () => {
      if (statePushedRef.current) {
        statePushedRef.current = false;
        onCloseRef.current();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [open]);

  if (!open) return null;

  const handleDropdownItemClick = (item) => {
    onClose();
    if (item.requiresAuth && !user) {
      navigate(`/login?next=${item.route}`, { replace: true });
      return;
    }
    if (item.route) navigate(item.route, { replace: true });
  };

  const handleNavClick = (link) => {
    if (link.hasDropdown) {
      setExpandedMenu(expandedMenu === link.label ? null : link.label);
      return;
    }
    onClose();
    if (link.route) navigate(link.route, { replace: true });
  };

  const handleUserItemClick = (item) => {
    if (item.action === 'logout') {
      // Prevent the history.back() cleanup from interfering with the
      // logout redirect — the page is navigating away regardless.
      statePushedRef.current = false;
      onClose();
      base44.auth.logout(window.location.origin + '/');
      return;
    }
    onClose();
    if (item.route) {
      navigate(item.route, { replace: true });
    }
  };

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full bg-card shadow-2xl flex flex-col overflow-y-auto scrollbar-hide" style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-border bg-card flex-shrink-0">
          <Link to="/" onClick={onClose} className="inline-flex items-center gap-2 cursor-pointer">
            <span className="text-xl font-extrabold tracking-tight text-[hsl(var(--primary))]">AutoMax</span>
            <img src="/img/ca07bfd68_generated_image.jpg" alt="AutoMax" className="w-6 h-6 object-contain flex-shrink-0" />
          </Link>
          <button onClick={onClose} className="p-1.5 text-foreground hover:bg-secondary rounded-md transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* User account section — blue section */}
        {user ?
        <div className="px-4 py-2 flex-shrink-0 bg-[hsl(var(--muted))]">
            <div className="py-3 mb-1">
              <p className="text-lg font-bold text-foreground">{user.full_name || user.email || 'User'}</p>
            </div>
            {userMenuItems.map((item, i) =>
          item.divider ?
          <div key={i} className="border-t border-border my-2" /> :

          <button
            key={item.label}
            onClick={() => handleUserItemClick(item)}
            className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm hover:bg-black/5 rounded-md transition-colors ${item.action === 'logout' ? 'text-primary' : 'text-foreground'}`}>
            
                  <item.icon className={`w-5 h-5 ${item.action === 'logout' ? 'text-primary' : 'text-muted-foreground'}`} />
                  {item.label}
                </button>

          )}
          </div> :

        <div className="px-4 py-4 flex-shrink-0 bg-[hsl(var(--background))]">
            <button
            onClick={() => {onClose();navigate(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`, { replace: true });}}
            className="w-full py-2.5 text-sm font-medium border-2 border-foreground rounded-md hover:bg-primary hover:text-white transition-colors text-[hsl(var(--popover-foreground))] bg-[hsl(var(--secondary))]">
            
              Sign in/up
            </button>
          </div>
        }

        {/* Nav links — white section */}
        <div className="flex-1 px-4 py-2 bg-card">
          {navLinks.map((link) =>
          <div key={link.label}>
            <button
              onClick={() => handleNavClick(link)}
              className="w-full text-left text-foreground px-3 py-3 text-sm font-medium flex items-center justify-between hover:bg-secondary rounded-md transition-colors">
            
              {link.label}
              {link.hasDropdown && <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedMenu === link.label ? 'rotate-180' : ''}`} />}
            </button>
            {link.hasDropdown && expandedMenu === link.label && (
              <div className="ml-3 mb-1 border border-foreground rounded-md overflow-hidden">
                {dropdownMap[link.label].map((item, i) =>
                  item.divider ?
                  <div key={i} className="border-t border-border" /> :
                  <button
                    key={item.label}
                    onClick={() => handleDropdownItemClick(item)}
                    className="block w-full text-left text-foreground px-3 py-2.5 text-sm hover:bg-secondary transition-colors">
                    {item.label}
                  </button>
                )}
              </div>
            )}
          </div>
          )}
        </div>

        {/* Bottom actions */}
        <div className="px-4 py-4 border-t border-border flex items-center justify-center bg-card flex-shrink-0">
          <button
            onClick={() => {onClose();navigate(user ? '/place-ad' : '/login?next=/place-ad', { replace: true });}}
            className="flex items-center gap-2 text-sm text-foreground font-semibold">
            
            Place Ad
          </button>
        </div>
      </div>
    </div>);

}