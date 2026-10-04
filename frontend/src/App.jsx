import { lazy, Suspense, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import ScrollToTop from './components/ScrollToTop';
import SeoManager from './components/SeoManager';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
const Home = lazy(() => import('./pages/Home'));
const CreateAccount = lazy(() => import('./pages/CreateAccount'));
const CarRent = lazy(() => import('./pages/CarRent'));
const CarInsurance = lazy(() => import('./pages/CarInsurance'));
const Dealers = lazy(() => import('./pages/Dealers'));
const PlaceAd = lazy(() => import('./pages/PlaceAd'));
const CarsForSale = lazy(() => import('./pages/CarsForSale'));
const Commercials = lazy(() => import('./pages/Commercials'));
const NewCarListings = lazy(() => import('./pages/NewCarListings'));
const DealershipCars = lazy(() => import('./pages/DealershipCars'));
const VintageCars = lazy(() => import('./pages/VintageCars'));
const ModifiedCars = lazy(() => import('./pages/ModifiedCars'));
const CarParts = lazy(() => import('./pages/CarParts'));
const CarExtras = lazy(() => import('./pages/CarExtras'));
const RallyCars = lazy(() => import('./pages/RallyCars'));
const BreakingRepairables = lazy(() => import('./pages/BreakingRepairables'));
const Trucks = lazy(() => import('./pages/Trucks'));
const Trailers = lazy(() => import('./pages/Trailers'));
const Campers = lazy(() => import('./pages/Campers'));
const CoachesBuses = lazy(() => import('./pages/CoachesBuses'));
const PlantMachinery = lazy(() => import('./pages/PlantMachinery'));
const MotorbikeExtras = lazy(() => import('./pages/MotorbikeExtras'));
const Motorbikes = lazy(() => import('./pages/Motorbikes'));
const VintageBikes = lazy(() => import('./pages/VintageBikes'));
const Scooters = lazy(() => import('./pages/Scooters'));
const Quads = lazy(() => import('./pages/Quads'));
const Caravans = lazy(() => import('./pages/Caravans'));
const Boats = lazy(() => import('./pages/Boats'));
const BoatExtras = lazy(() => import('./pages/BoatExtras'));
const OtherMotor = lazy(() => import('./pages/OtherMotor'));
const SavedSearches = lazy(() => import('./pages/SavedSearches'));
const Profile = lazy(() => import('./pages/Profile'));
const MyAds = lazy(() => import('./pages/MyAds'));
const RenewAd = lazy(() => import('./pages/RenewAd'));
const Messages = lazy(() => import('./pages/Messages'));
const BrowsingHistory = lazy(() => import('./pages/BrowsingHistory'));
const HistoryChecks = lazy(() => import('./pages/HistoryChecks'));
const PaymentHistory = lazy(() => import('./pages/PaymentHistory'));
const Help = lazy(() => import('./pages/Help'));
const ElectricHybridCars = lazy(() => import('./pages/ElectricHybridCars'));
const BuyingTips = lazy(() => import('./pages/BuyingTips'));
const Article = lazy(() => import('./pages/Article'));
const HowToSellMyCar = lazy(() => import('./pages/HowToSellMyCar'));
const SellingTips = lazy(() => import('./pages/SellingTips'));
const CarsByMake = lazy(() => import('./pages/CarsByMake'));
const BikesBicycles = lazy(() => import('./pages/BikesBicycles'));
const VehicleDetail = lazy(() => import('./pages/VehicleDetail'));
const SellerAds = lazy(() => import('./pages/SellerAds'));
const ReportAd = lazy(() => import('./pages/ReportAd'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));

const ReviewsGallery = lazy(() => import('./pages/ReviewsGallery'));
const Career = lazy(() => import('./pages/Career'));
const CookiePolicy = lazy(() => import('./pages/CookiePolicy'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const ManageCookies = lazy(() => import('./pages/ManageCookies'));
const Accessibility = lazy(() => import('./pages/Accessibility'));
const DealersInformation = lazy(() => import('./pages/DealersInformation'));
const Advertisement = lazy(() => import('./pages/Advertisement'));
const EditAd = lazy(() => import('./pages/EditAd'));
import CookieBanner from './components/automarket/CookieBanner';
import BottomTabs from './components/automarket/BottomTabs';
import HardwareBackHandler from './components/automarket/HardwareBackHandler';
import { motion, AnimatePresence } from 'framer-motion';
// Add page imports here

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        className="app-page"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>}>
        <Routes location={location}>
      <Route path="/" element={<Home />} />
      <Route path="/create-account" element={<CreateAccount />} />
      <Route path="/car-rent" element={<CarRent />} />
      <Route path="/recovery-service" element={<CarInsurance />} />
      <Route path="/dealers" element={<Dealers />} />
      <Route path="/place-ad" element={<PlaceAd />} />
      <Route path="/cars-for-sale" element={<CarsForSale />} />
      <Route path="/commercials" element={<Commercials />} />
      <Route path="/new-cars" element={<NewCarListings />} />
      <Route path="/dealership-cars" element={<DealershipCars />} />
      <Route path="/vintage-cars" element={<VintageCars />} />
      <Route path="/modified-cars" element={<ModifiedCars />} />
      <Route path="/car-parts" element={<CarParts />} />
      <Route path="/car-extras" element={<CarExtras />} />
      <Route path="/rally-cars" element={<RallyCars />} />
      <Route path="/breaking-repairables" element={<BreakingRepairables />} />
      <Route path="/trucks" element={<Trucks />} />
      <Route path="/trailers" element={<Trailers />} />
      <Route path="/campers" element={<Campers />} />
      <Route path="/coaches-buses" element={<CoachesBuses />} />
      <Route path="/plant-machinery" element={<PlantMachinery />} />
      <Route path="/motorbike-extras" element={<MotorbikeExtras />} />
      <Route path="/motorbikes" element={<Motorbikes />} />
      <Route path="/vintage-bikes" element={<VintageBikes />} />
      <Route path="/scooters" element={<Scooters />} />
      <Route path="/quads" element={<Quads />} />
      <Route path="/caravans" element={<Caravans />} />
      <Route path="/boats" element={<Boats />} />
      <Route path="/boat-extras" element={<BoatExtras />} />
      <Route path="/other-motor" element={<OtherMotor />} />
      <Route path="/saved-searches" element={<SavedSearches />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/my-ads" element={<MyAds />} />
      <Route path="/renew-ad/:id" element={<RenewAd />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/browsing-history" element={<BrowsingHistory />} />
      <Route path="/history-checks" element={<HistoryChecks />} />
      <Route path="/payment-history" element={<PaymentHistory />} />
      <Route path="/help" element={<Help />} />
      <Route path="/electric-hybrid-cars" element={<ElectricHybridCars />} />
      <Route path="/buying-tips" element={<BuyingTips />} />
      <Route path="/buying-tips/article/:slug" element={<Article />} />
      <Route path="/how-to-sell-my-car" element={<HowToSellMyCar />} />
      <Route path="/selling-tips" element={<SellingTips />} />
      <Route path="/cars-by-make/:make" element={<CarsByMake />} />
      <Route path="/bikes-bicycles" element={<BikesBicycles />} />
      <Route path="/vehicle/:id" element={<VehicleDetail />} />
      <Route path="/seller-ads/:sellerId" element={<SellerAds />} />
      <Route path="/report-ad/:adId" element={<ReportAd />} />
      <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
      <Route path="/about-us" element={<AboutUs />} />
      <Route path="/contact-us" element={<ContactUs />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route path="/reviews-gallery" element={<ReviewsGallery />} />
      <Route path="/career" element={<Career />} />
      <Route path="/cookie-policy" element={<CookiePolicy />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/manage-cookies" element={<ManageCookies />} />
      <Route path="/accessibility" element={<Accessibility />} />
      <Route path="/dealers-information" element={<DealersInformation />} />
      <Route path="/advertisement" element={<Advertisement />} />
      <Route path="/edit-ad/:id" element={<EditAd />} />
      <Route path="*" element={<PageNotFound />} />
        </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <>
      <AnimatedRoutes />
      <BottomTabs />
    </>
  );
};


function ReloadRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    const navEntries = performance.getEntriesByType('navigation');
    const isReload = navEntries.length > 0 && navEntries[0].type === 'reload';
    if (isReload && window.location.pathname !== '/') {
      navigate('/', { replace: true });
    }
  }, []);
  return null;
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <SeoManager />
          <HardwareBackHandler />
          <ReloadRedirect />
          <AuthenticatedApp />
          <CookieBanner />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App