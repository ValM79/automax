import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Megaphone, MessageSquare, User } from 'lucide-react';
import { useMobileMenuOpen, toggleMobileMenu, setMobileMenuOpen, hasMenuHost } from '@/lib/mobileMenu';

// `opensMenu`: the Profile tab opens the slide-in menu (same one the hamburger opens)
// instead of going to the profile page; the Profile page is still in that menu.
const tabs = [
  { label: 'Home', icon: Home, path: '/' },
  { label: 'My Ads', icon: Megaphone, path: '/my-ads' },
  { label: 'Messages', icon: MessageSquare, path: '/messages' },
  { label: 'Profile', icon: User, path: '/profile', opensMenu: true },
];

const STORAGE_KEY = 'automax_tab_history';

function getActiveTab(pathname) {
  if (pathname === '/') return 'Home';
  for (const tab of tabs) {
    if (tab.path !== '/' && pathname.startsWith(tab.path)) return tab.label;
  }
  return null;
}

export default function BottomTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  const tabHistory = useRef({});

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) tabHistory.current = JSON.parse(stored);
    } catch {}
  }, []);

  useEffect(() => {
    const activeTab = getActiveTab(location.pathname);
    if (activeTab) {
      tabHistory.current[activeTab] = location.pathname + location.search;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tabHistory.current));
    }
  }, [location.pathname, location.search]);

  const menuOpen = useMobileMenuOpen();

  const handleTabClick = (e, tab) => {
    e.preventDefault();

    if (tab.opensMenu && hasMenuHost()) {
      toggleMobileMenu();
      return;
    }
    // Any other tab: close the menu first so it doesn't stay open over the destination.
    setMobileMenuOpen(false);

    const currentTab = getActiveTab(location.pathname);

    if (currentTab === tab.label) {
      // Re-selecting active tab → go to root (clear sub-history)
      tabHistory.current[tab.label] = tab.path;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tabHistory.current));
      navigate(tab.path);
    } else {
      // Switching tabs → restore last visited path if available
      const lastPath = tabHistory.current[tab.label] || tab.path;
      navigate(lastPath);
    }
  };

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-[70] bg-card border-t border-border flex items-stretch justify-around"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)', height: 'calc(56px + env(safe-area-inset-bottom))' }}
    >
      {tabs.map((tab) => {
        const onThisTab = getActiveTab(location.pathname) === tab.label;
        const isActive = tab.opensMenu ? menuOpen || onThisTab : !menuOpen && onThisTab;
        return (
          <a
            key={tab.label}
            href={tab.path}
            onClick={(e) => handleTabClick(e, tab)}
            className={`flex flex-col items-center justify-center gap-1 flex-1 transition-colors ${
              isActive ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </a>
        );
      })}
    </div>
  );
}