import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams, useNavigationType } from 'react-router-dom';
import { ArrowLeft, Upload, X, Youtube, User, Mail, Phone, MapPin, Tag, FileText, DollarSign, ChevronDown, Plus, Pencil, Car, Info, Star, RotateCw, Trash2 } from 'lucide-react';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import ImageViewer from '../components/automarket/ImageViewer';
import AdPackageSelector, { packages } from '../components/automarket/AdPackageSelector';
import AdPreview from '../components/automarket/AdPreview';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import keywordToCategory from '@/lib/keywordToCategory';
import { modelsByMake } from '@/components/automarket/modelsData';
import OtherSelect from '../components/automarket/OtherSelect';
import MobileSelect from '../components/automarket/MobileSelect';

const counties = ['Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford', 'Kilkenny', 'Mayo', 'Kerry', 'Clare', 'Tipperary', 'Roscommon', 'Westmeath', 'Wexford', 'Wicklow', 'Meath', 'Kildare'];

const areasByCounty = {
  Dublin: ['Dublin City Centre', 'North Dublin', 'South Dublin', 'West Dublin', 'East Dublin'],
  Cork: ['Cork City', 'North Cork', 'South Cork', 'West Cork'],
  Galway: ['Galway City', 'Connemara', 'East Galway'],
  Limerick: ['Limerick City', 'North Limerick', 'South Limerick'],
  default: ['North', 'South', 'East', 'West', 'City Centre']
};

const sections = [
{
  label: 'Cars',
  subsections: ['New Cars', 'Cars', 'Electric & Hybrid Cars', 'Dealership Cars', 'Vintage Cars', 'Modified Cars', 'Car Parts', 'Car Extras', 'Rally Cars', 'Breaking & Repairables']
},
{
  label: 'Trucks & Vans',
  subsections: ['Trucks', 'Commercials', 'Trailers', 'Campers', 'Coaches & Buses', 'Plant Machinery', 'Motorbike Extras', 'Caravans', 'Bikes & Bicycles']
},
{
  label: 'Bikes & Boats',
  subsections: ['Motorbikes', 'Vintage Bikes', 'Scooters', 'Quads', 'Boats & Jet Skis', 'Boat Extras', 'Other items']
}];


// All individual category names matching BrowseByCategory
const browseCategories = [
'New Cars', 'Cars', 'Electric & Hybrid Cars', 'Dealership Cars', 'Vintage Cars', 'Modified Cars',
'Car Parts', 'Car Extras', 'Rally Cars', 'Breaking & Repairables',
'Trucks', 'Commercials', 'Trailers', 'Campers', 'Coaches & Buses',
'Plant Machinery', 'Motorbike Extras', 'Caravans', 'Bikes & Bicycles',
'Motorbikes', 'Vintage Bikes', 'Scooters', 'Quads', 'Boats & Jet Skis',
'Boat Extras', 'Other items'].
filter((c) => c !== 'Other items').
sort((a, b) => a.localeCompare(b)).
concat('Other items');


const categoryToSection = {
  'new cars': { section: 'Cars', subsection: 'New Cars' },
  cars: { section: 'Cars', subsection: 'Cars' },
  'electric & hybrid cars': { section: 'Cars', subsection: 'Electric & Hybrid Cars' },
  'electric and hybrid cars': { section: 'Cars', subsection: 'Electric & Hybrid Cars' },
  'electric cars': { section: 'Cars', subsection: 'Electric & Hybrid Cars' },
  'hybrid cars': { section: 'Cars', subsection: 'Electric & Hybrid Cars' },
  'ev': { section: 'Cars', subsection: 'Electric & Hybrid Cars' },
  'dealership cars': { section: 'Cars', subsection: 'Dealership Cars' },
  'cars from dealerships': { section: 'Cars', subsection: 'Dealership Cars' },
  'vintage cars': { section: 'Cars', subsection: 'Vintage Cars' },
  'modified cars': { section: 'Cars', subsection: 'Modified Cars' },
  'car parts': { section: 'Cars', subsection: 'Car Parts' },
  'car extras': { section: 'Cars', subsection: 'Car Extras' },
  'rally cars': { section: 'Cars', subsection: 'Rally Cars' },
  'breaking & repairables': { section: 'Cars', subsection: 'Breaking & Repairables' },
  trucks: { section: 'Trucks & Vans', subsection: 'Trucks' },
  commercials: { section: 'Trucks & Vans', subsection: 'Commercials' },
  trailers: { section: 'Trucks & Vans', subsection: 'Trailers' },
  campers: { section: 'Trucks & Vans', subsection: 'Campers' },
  'coaches & buses': { section: 'Trucks & Vans', subsection: 'Coaches & Buses' },
  'plant machinery': { section: 'Trucks & Vans', subsection: 'Plant Machinery' },
  'motorbike extras': { section: 'Trucks & Vans', subsection: 'Motorbike Extras' },
  caravans: { section: 'Trucks & Vans', subsection: 'Caravans' },
  'bikes & bicycles': { section: 'Trucks & Vans', subsection: 'Bikes & Bicycles' },
  motorbikes: { section: 'Bikes & Boats', subsection: 'Motorbikes' },
  'vintage bikes': { section: 'Bikes & Boats', subsection: 'Vintage Bikes' },
  scooters: { section: 'Bikes & Boats', subsection: 'Scooters' },
  quads: { section: 'Bikes & Boats', subsection: 'Quads' },
  'boats & jet skis': { section: 'Bikes & Boats', subsection: 'Boats & Jet Skis' },
  'boat extras': { section: 'Bikes & Boats', subsection: 'Boat Extras' },
  other: { section: 'Bikes & Boats', subsection: 'Other items' },
  'other items': { section: 'Bikes & Boats', subsection: 'Other items' },
  'other motor': { section: 'Bikes & Boats', subsection: 'Other items' },
  bikes: { section: 'Trucks & Vans', subsection: 'Bikes & Bicycles' },
  bicycle: { section: 'Trucks & Vans', subsection: 'Bikes & Bicycles' }
};

// All category names flattened for suggestions
const allCategories = sections.flatMap((s) => s.subsections);


const emptyForm = {
  category: '',
  section: '',
  subsection: '',
  adType: 'for_sale',
  currency: '€',
  title: '',
  description: '',
  price: '',
  youtubeUrl: '',
  mileage: '',
  mileageUnit: 'km',
  vehicleMake: '',
  vehicleModel: '',
  vehicleYear: '',
  vehicleFuel: '',
  vehicleTransmission: '',
  bodyType: '',
  colour: '',
  engineSize: '',
  numberOfDoors: '',
  numberOfSeats: '',
  enginePower: '',
  batteryRange: '',
  batterySize: '',
  previousOwners: '',
  fullServiceHistory: false,
  noAccidents: false,
  roadTax: '',
  currentCountryOfReg: '',
  nctExpiry: '',
  taxExpiry: '',
  fullName: '',
  email: '',
  phone: '',
  county: 'Dublin',
  area: '',
  areaCustom: '',
  contactByMessage: true,
  contactByPhone: true,
  isTrader: false,
  businessName: '',
  businessAddress: '',
  vatNumber: '',
  bikeSubsection: ''
};

export default function PlaceAd() {
  const { user, isLoadingAuth, navigateToLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Placing an ad requires login (browsing the site stays public).
  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      navigateToLogin();
    }
  }, [isLoadingAuth, isAuthenticated]);

  // Read package limits from URL params (set after Stripe redirect)
  const urlParams = new URLSearchParams(window.location.search);
  const urlListingDays = parseInt(urlParams.get('listingDays') || '72', 10);
  const urlMaxPhotos = parseInt(urlParams.get('maxPhotos') || '12', 10);
  const [packageLimits, setPackageLimits] = useState({ listingDays: urlListingDays, maxPhotos: urlMaxPhotos });

  const [form, setForm] = useState({
    ...emptyForm,
    fullName: user?.full_name || '',
    email: user?.email || ''
  });
  const profilePrefilled = useRef(false);

  // Reflect the saved My Profile details in the contact section.
  useEffect(() => {
    if (user && !profilePrefilled.current) {
      profilePrefilled.current = true;
      setForm((f) => ({
        ...f,
        fullName: user.display_name || user.full_name || f.fullName,
        email: user.email || f.email,
        county: user.county || f.county,
        area: user.area || f.area,
        phone: user.phone || f.phone,
        isTrader: user.seller_type === 'trader' ? true : f.isTrader,
        businessName: user.business_name || f.businessName,
        vatNumber: user.vat_number || f.vatNumber
      }));
    }
  }, [user]);
  const [photos, setPhotos] = useState([]);
  const [video, setVideo] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'preview'
  const [categoryStarted, setCategoryStarted] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [sellError, setSellError] = useState('');
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [vintageSuggestionDismissed, setVintageSuggestionDismissed] = useState(false);
  const adSavedRef = useRef(false);
  const submittingRef = useRef(false);

  // When vehicle year is set to 2000 or under and subsection is a car category, auto-suggest Vintage Cars
  const isVintageYear = form.vehicleYear && parseInt(form.vehicleYear, 10) <= 2000;
  const isCarSubsection = ['Cars', 'New Cars', 'Electric & Hybrid Cars', 'Dealership Cars', 'Modified Cars', 'Rally Cars', 'Breaking & Repairables', ''].includes(form.subsection);
  const showVintageSuggestion = isVintageYear && isCarSubsection && form.subsection !== 'Vintage Cars' && !vintageSuggestionDismissed;

  // Subsection → route mapping for redirect after payment
  const subsectionToRoute = {
    'Cars': '/cars-for-sale',
    'New Cars': '/new-cars',
    'Dealership Cars': '/dealership-cars',
    'Electric & Hybrid Cars': '/electric-hybrid-cars',
    'Cars from Dealerships': '/dealership-cars',
    'Vintage Cars': '/vintage-cars',
    'Modified Cars': '/modified-cars',
    'Rally Cars': '/rally-cars',
    'Breaking & Repairables': '/breaking-repairables',
    'Car Parts': '/car-parts',
    'Car Extras': '/car-extras',
    'Trucks': '/trucks',
    'Commercials': '/commercials',
    'Trailers': '/trailers',
    'Campers': '/campers',
    'Coaches & Buses': '/coaches-buses',
    'Plant Machinery': '/plant-machinery',
    'Caravans': '/caravans',
    'Motorbike Extras': '/motorbike-extras',
    'Bikes & Bicycles': '/bikes-bicycles',
    'Motorbikes': '/motorbikes',
    'Vintage Bikes': '/vintage-bikes',
    'Scooters': '/scooters',
    'Quads': '/quads',
    'Boats & Jet Skis': '/boats',
    'Boat Extras': '/boat-extras',
    'Other items': '/other-motor'
  };

  // Redirect after successful Stripe payment.
  // The ad was already created as 'pending' before checkout and is activated
  // server-side by the Stripe webhook — we never trust client-side payment status.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') !== 'success') return;
    if (isLoadingAuth || !user) return;
    if (adSavedRef.current) return;
    adSavedRef.current = true;
    localStorage.removeItem('pendingAd');
    navigate('/my-ads');
  }, [isLoadingAuth, user]);

  const isBikeCategory = ['Bikes & Bicycles', 'Car Extras', 'Car Parts', 'Boat Extras', 'Other items', 'Motorbike Extras'].includes(form.subsection);

  const vehicleDetailsCategories = ['Cars', 'New Cars', 'Electric & Hybrid Cars', 'Trucks', 'Motorbikes', 'Coaches & Buses', 'Commercials'];
  const showVehicleDetails = vehicleDetailsCategories.includes(form.subsection);

  const validateForm = () => {
    const errors = {};
    if (!form.subsection) errors.subsection = 'Please select a section';
    if (!form.title.trim()) errors.title = 'Please enter a title for your ad';
    if (!form.description.trim()) errors.description = 'Please enter a description for your ad';
    if (!form.price.trim()) errors.price = 'Please enter a price for your ad';
    if (!form.fullName.trim()) errors.fullName = 'Please enter your full name';
    if (!form.email.trim()) errors.email = 'Please enter your email address';
    if (!form.phone.trim()) errors.phone = 'Please enter your phone number';
    if (!form.area || form.area === '__other__') errors.area = 'Please select an area';
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      // Scroll to first error
      const firstErrorKey = Object.keys(errors)[0];
      const el = document.getElementById(`field-${firstErrorKey}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    return true;
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const toggle = (field) => () => setForm((f) => ({ ...f, [field]: !f[field] }));

  const resolveSubsection = (text) => {
    const lower = text.trim().toLowerCase();
    if (!lower) return '';
    // 1. Check full phrase first (most specific)
    if (keywordToCategory[lower]) return keywordToCategory[lower];
    // 2. Check multi-word keys contained in the input
    const multiWordKeys = Object.keys(keywordToCategory).filter((k) => k.includes(' '));
    for (const key of multiWordKeys) {
      if (lower.includes(key)) return keywordToCategory[key];
    }
    // 3. Check individual words last
    const words = lower.split(/\s+/);
    for (const word of words) {
      if (keywordToCategory[word]) return keywordToCategory[word];
    }
    return 'Other';
  };

  const handleCategoryChange = (e) => {
    const val = e.target.value;
    if (!val.trim()) {
      setForm((f) => ({ ...f, category: val, section: '', subsection: '' }));
      return;
    }
    const subsection = resolveSubsection(val);
    const sectionMatch = categoryToSection[subsection.toLowerCase()];
    setForm((f) => ({
      ...f,
      category: val,
      subsection,
      section: sectionMatch ? sectionMatch.section : 'Bikes & Boats'
    }));
  };

  const handleSelectSuggestion = (categoryName) => {
    const key = categoryName.toLowerCase();
    const match = categoryToSection[key];
    if (match) {
      setForm((f) => ({ ...f, category: categoryName, section: match.section, subsection: match.subsection }));
    } else {
      setForm((f) => ({ ...f, category: categoryName, section: categoryName, subsection: categoryName }));
    }
    setShowSuggestions(false);
    setCategoryStarted(true);
  };

  const filteredSuggestions = form.category.trim() ?
  allCategories.filter((c) => c.toLowerCase().includes(form.category.trim().toLowerCase())) :
  [];

  const currentSectionObj = sections.find((s) => s.label === form.section);
  const subsections = currentSectionObj ? currentSectionObj.subsections : [];

  const areas = areasByCounty[form.county] || areasByCounty.default;

  const handleReset = () => {
    setForm({ ...emptyForm, fullName: user?.full_name || '', email: user?.email || '' });
    setPhotos([]);
    setVideo(null);
    setCategoryStarted(false);
    setFormErrors({});
    setSellError('');
    setSelectedPackage(null);
  };

  const handleFiles = (files) => {
    const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const remaining = packageLimits.maxPhotos - photos.length;
    const toAdd = validFiles.slice(0, remaining).map((f) => ({
      file: f,
      preview: URL.createObjectURL(f)
    }));
    setPhotos((prev) => [...prev, ...toAdd]);
  };

  const removePhoto = (idx) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSetCover = (idx) => {
    if (idx === 0) return; // Already cover
    setPhotos((prev) => {
      const newPhotos = [...prev];
      const [cover] = newPhotos.splice(idx, 1);
      newPhotos.unshift(cover);
      return newPhotos;
    });
    setViewerIndex(null); // Close viewer to show updated gallery
  };

  const handleRotate = (idx, rotation) => {
    setPhotos((prev) => {
      const newPhotos = [...prev];
      newPhotos[idx] = { ...newPhotos[idx], rotation };
      return newPhotos;
    });
  };

  const handleDeleteFromViewer = (idx) => {
    removePhoto(idx);
    setViewerIndex(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const uploadPhotos = async (photoList) => {
    const uploaded = await Promise.all(
      photoList.map(async (p) => {
        try {
          const res = await fetch(p.preview);
          const blob = await res.blob();
          const file = new File([blob], 'photo.jpg', { type: blob.type || 'image/jpeg' });
          const result = await base44.integrations.Core.UploadFile({ file });
          return result.file_url;
        } catch {
          return null;
        }
      })
    );
    return uploaded.filter(Boolean);
  };

  // While auth is resolving or the user is being redirected to login, don't render the form.
  if (isLoadingAuth || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-24 text-center text-muted-foreground text-sm">
          Please log in to place an ad. Redirecting…
        </div>
        <Footer />
      </div>);

  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {showPreview &&
      <AdPreview
        form={form}
        photos={photos}
        selectedPackage={selectedPackage}
        onClose={() => setShowPreview(false)}
        onBack={() => setShowPreview(false)} />

      }

      {viewerIndex !== null &&
      <ImageViewer
        photos={photos}
        initialIndex={viewerIndex}
        onClose={() => setViewerIndex(null)}
        onSetCover={handleSetCover}
        onRotate={handleRotate}
        onDelete={handleDeleteFromViewer} />

      }

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Place Ad</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-bold text-foreground text-lg">Complete your ad.</h1>
          </div>
          <button onClick={handleReset} className="border border-foreground text-foreground font-semibold px-6 py-2 rounded-lg hover:bg-secondary transition-colors text-sm">
            Reset Form
          </button>
        </div>

        <div className="flex flex-col gap-8">

          {/* Section 1: Category */}
          <Section title="What's for sale?">
            <div className="flex flex-col gap-4">
              <div className="relative">
                <input
                  type="text"
                  value={form.category}
                  onChange={handleCategoryChange}
                  placeholder="e.g. Car, Van, Truck"
                  className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary pr-9" />

                {form.category &&
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, category: '', section: '', subsection: '' }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">

                    <X className="w-4 h-4" />
                  </button>
                }
              </div>

              {/* Select Category */}
              <div id="field-subsection">
                <label className="block text-sm font-medium text-foreground mb-1.5">Select Category</label>
                <MobileSelect
                  value={form.subsection}
                  onChange={(val) => {
                    const key = val.toLowerCase();
                    const match = categoryToSection[key];
                    setForm((f) => ({
                      ...f,
                      subsection: val,
                      section: match ? match.section : val
                    }));
                    setFormErrors((e) => ({ ...e, subsection: undefined }));
                  }}
                  options={browseCategories}
                  placeholder="Select a section..."
                />
                {formErrors.subsection && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><span>⚠</span>{formErrors.subsection}</p>}
              </div>

              {/* Bikes & Bicycles Subsection */}
              {form.subsection === 'Bikes & Bicycles' &&
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Select Subcategory</label>
                <MobileSelect
                  value={form.bikeSubsection}
                  onChange={(val) => setForm((f) => ({ ...f, bikeSubsection: val }))}
                  options={['Folding bike', 'Road Bike', 'Ladies bicycle', 'Electric bike', 'Mountain bike', 'Kids bike', 'E-Bike']}
                  placeholder="Select a subsection..."
                />
              </div>
              }

              {/* Ad Type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Ad Type</label>
                <div className="flex gap-4">
                  {['for_sale', 'wanted'].map((type) =>
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                      type="radio"
                      name="adType"
                      value={type}
                      checked={form.adType === type}
                      onChange={set('adType')}
                      className="w-4 h-4 accent-primary" />
                  
                      <span className="text-sm font-medium">{type === 'for_sale' ? 'For Sale' : 'Wanted'}</span>
                    </label>
                  )}
                </div>
              </div>
            </div>
          </Section>

          {/* Section 2: Photos */}
          <Section id="photos-section" title="Photos and Video" icon={<Upload className="w-5 h-5" />} subtitle={`Up to ${packageLimits.maxPhotos} photos`}>
            {/* Photo grid */}
            {photos.length > 0 &&
            <div className="mb-4">
                <div className="grid grid-cols-4 gap-3 items-start">
                  {photos.map((p, i) =>
                <button
                  key={i}
                  onClick={() => setViewerIndex(i)}
                  className="relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition-colors w-full">
                  <img src={p.preview} alt="" className="w-full h-full object-cover" style={{ transform: `rotate(${p.rotation || 0}deg)` }} />
                  {i === 0 &&
                    <div className="absolute top-1 left-1 bg-yellow-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      ★ COVER
                    </div>
                  }
                </button>
                )}
                  {photos.length < packageLimits.maxPhotos &&
                <div
                  onDragOver={(e) => {e.preventDefault();setDragOver(true);}}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-colors cursor-pointer ${dragOver ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  
                      <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                        <Plus className="w-8 h-8 text-primary mb-1" />
                        <span className="text-sm text-muted-foreground font-medium">{photos.length}/{packageLimits.maxPhotos}</span>
                        <input key={photos.length} type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
                      </label>
                    </div>
                }
                </div>
              </div>
            }

            {photos.length === 0 &&
            <div
              onDragOver={(e) => {e.preventDefault();setDragOver(true);}}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-border'}`}>
              
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <label className="cursor-pointer">
                  <span className="text-primary font-semibold hover:underline">Add Photos</span>
                  <input key="initial" type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
                </label>
                <span className="text-muted-foreground text-sm"> or drag and drop</span>
                <p className="text-xs text-muted-foreground mt-2">Up to {packageLimits.maxPhotos} images · .jpg, .png and .gif files</p>
              </div>
            }

            {/* Video upload */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-foreground mb-1.5">Upload Video <span className="text-muted-foreground font-normal">(1 video, max 100MB)</span></label>
              {video ?
              <div className="flex items-center gap-3 border border-border rounded-lg px-4 py-3 bg-secondary/50">
                  <span className="text-sm text-foreground flex-1 truncate">{video.name}</span>
                  <button onClick={() => setVideo(null)} className="text-muted-foreground hover:text-destructive">
                    <X className="w-4 h-4" />
                  </button>
                </div> :

              <label className="cursor-pointer flex items-center gap-3 border border-dashed border-border rounded-lg px-4 py-3 hover:bg-secondary/50 transition-colors">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-primary font-medium">Choose video file</span>
                  <span className="text-sm text-muted-foreground">· .mp4, .mov, .avi</span>
                  <input type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files[0] && setVideo(e.target.files[0])} />
                </label>
              }
            </div>

            {/* YouTube */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-foreground mb-1.5">Optional YouTube Video</label>
              <div className="relative">
                <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                <input
                  type="text"
                  value={form.youtubeUrl}
                  onChange={set('youtubeUrl')}
                  placeholder="e.g. www.youtube.com/watch=0"
                  className="w-full border border-border rounded-lg px-4 py-3 text-sm pl-9 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                
              </div>
            </div>
          </Section>

          {/* Section 3: Vehicle Details — only for specific categories */}
          {showVehicleDetails && <Section title="Vehicle Details" icon={<Car className="w-5 h-5" />} subtitle="Enter your vehicle details manually only related">
            <div className="grid grid-cols-2 gap-4">

              {/* Make */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Make</label>
                {(() => {
                  const knownMakes = ['Alfa Romeo', 'Audi', 'BMW', 'Citroën', 'Fiat', 'Ford', 'Honda', 'Hyundai', 'Jaguar', 'Jeep', 'Kia', 'Land Rover', 'Lexus', 'Mazda', 'Mercedes-Benz', 'Mitsubishi', 'Nissan', 'Opel', 'Peugeot', 'Porsche', 'Renault', 'Seat', 'Skoda', 'Subaru', 'Suzuki', 'Tesla', 'Toyota', 'Vauxhall', 'Volkswagen', 'Volvo'];
                  // Show text input when "Other" was chosen (vehicleMake not in known list and not empty sentinel)
                  const isCustom = form.vehicleMake === '__other__' || form.vehicleMake !== '' && !knownMakes.includes(form.vehicleMake);
                  if (isCustom) {
                    return (
                      <div className="relative">
                        <input
                          type="text"
                          value={form.vehicleMake === '__other__' ? '' : form.vehicleMake}
                          onChange={(e) => setForm((f) => ({ ...f, vehicleMake: e.target.value || '__other__', vehicleModel: '' }))}
                          placeholder="Enter make..."
                          autoFocus
                          className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary pr-9" />
                        
                        <X className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer" onClick={() => setForm((f) => ({ ...f, vehicleMake: '', vehicleModel: '' }))} />
                      </div>);

                  }
                  return (
                    <MobileSelect
                      value={form.vehicleMake}
                      onChange={(val) => {
                        setForm((f) => ({ ...f, vehicleMake: val === 'Other' ? '__other__' : val, vehicleModel: '' }));
                      }}
                      options={[...knownMakes, 'Other']}
                      placeholder="Select make..."
                    />);

                })()}
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Model</label>
                {(() => {
                  const makeForLookup = form.vehicleMake === '__other__' || !form.vehicleMake ? null : form.vehicleMake;
                  const makeKey = makeForLookup ? Object.keys(modelsByMake).find((k) => k.toLowerCase() === makeForLookup.toLowerCase()) : null;
                  const availableModels = makeKey ? modelsByMake[makeKey].map((m) => m.name).filter((m) => m !== 'Other') : null;
                  const isCustom = form.vehicleModel === '__other__' || form.vehicleModel !== '' && availableModels && !availableModels.includes(form.vehicleModel);

                  if (!availableModels || isCustom) {
                    return (
                      <div className="relative">
                        <input
                          type="text"
                          value={form.vehicleModel === '__other__' ? '' : form.vehicleModel}
                          onChange={(e) => setForm((f) => ({ ...f, vehicleModel: e.target.value || '__other__' }))}
                          placeholder="Enter model..."
                          autoFocus={isCustom}
                          className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary pr-9" />
                        
                        <X className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer" onClick={() => setForm((f) => ({ ...f, vehicleModel: '' }))} />
                      </div>);

                  }
                  return (
                    <MobileSelect
                      value={form.vehicleModel}
                      onChange={(val) => {
                        setForm((f) => ({ ...f, vehicleModel: val === 'Other' ? '__other__' : val }));
                      }}
                      options={[...availableModels, 'Other']}
                      placeholder="Select model..."
                    />);

                })()}
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Year</label>
                <MobileSelect
                  value={form.vehicleYear}
                  onChange={(val) => {setForm((f) => ({ ...f, vehicleYear: val }));setVintageSuggestionDismissed(false);}}
                  options={Array.from({ length: 2026 - 1980 + 1 }, (_, i) => String(2026 - i))}
                  placeholder="Select year..."
                />
              </div>

              {/* Odometer */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Odometer</label>
                <div className="flex flex-col gap-2">
                  <input type="text" value={form.mileage} onChange={(e) => {const raw = e.target.value.replace(/[^0-9]/g, '');const formatted = raw ? Number(raw).toLocaleString('en-IE') : '';setForm((f) => ({ ...f, mileage: formatted }));}} placeholder="e.g. 12,000" className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                    <div>
                      <MobileSelect
                        value={form.mileageUnit}
                        onChange={(val) => setForm((f) => ({ ...f, mileageUnit: val }))}
                        options={['km', 'miles']}
                      />
                    </div>
                </div>
              </div>

              {/* Engine Size */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Engine Size</label>
                <OtherSelect
                  value={form.engineSize}
                  onChange={(val) => setForm((f) => ({ ...f, engineSize: val }))}
                  options={['1.0L', '1.2L', '1.4L', '1.6L', '1.8L', '2.0L', '2.5L', '3.0L+']}
                  placeholder="Select..."
                  enterLabel="Enter engine size..." />
              </div>

              {/* Fuel Type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Fuel Type</label>
                <OtherSelect
                  value={form.vehicleFuel}
                  onChange={(val) => setForm((f) => ({ ...f, vehicleFuel: val }))}
                  options={['Petrol', 'Diesel', 'LPG', 'Electric', 'Hybrid', 'Plug-in Hybrid']}
                  placeholder="Select..."
                  enterLabel="Enter fuel type..." />
              </div>

              {/* Transmission */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Transmission</label>
                <OtherSelect
                  value={form.vehicleTransmission}
                  onChange={(val) => setForm((f) => ({ ...f, vehicleTransmission: val }))}
                  options={['Manual', 'Automatic']}
                  placeholder="Select..."
                  enterLabel="Enter transmission..." />
              </div>

              {/* Body Type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Body Type</label>
                <OtherSelect
                  value={form.bodyType}
                  onChange={(val) => setForm((f) => ({ ...f, bodyType: val }))}
                  options={['Hatchback', 'Saloon', 'Estate', 'Coupe', 'Convertible', 'SUV', 'MPV', 'Van', 'Pick Up']}
                  placeholder="Select..."
                  enterLabel="Enter body type..." />
              </div>



              {/* NCT Expiry */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">NCT Expiry</label>
                <div className="flex flex-col gap-2">
                      <div>
                        <MobileSelect
                          value={form.nctMonth || ''}
                          onChange={(val) => setForm((f) => ({ ...f, nctMonth: val, nctExpiry: val && f.nctYear ? `${val}/${f.nctYear}` : '' }))}
                          options={['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']}
                          placeholder="Month"
                        />
                      </div>
                      <div>
                        <MobileSelect
                          value={form.nctYear || ''}
                          onChange={(val) => setForm((f) => ({ ...f, nctYear: val, nctExpiry: f.nctMonth && val ? `${f.nctMonth}/${val}` : '' }))}
                          options={Array.from({ length: 10 }, (_, i) => String(2025 + i))}
                          placeholder="Year"
                        />
                      </div>
                </div>
              </div>

              {/* Tax Expiry */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Tax Expiry</label>
                <div className="flex flex-col gap-2">
                      <div>
                        <MobileSelect
                          value={form.taxMonth || ''}
                          onChange={(val) => setForm((f) => ({ ...f, taxMonth: val, taxExpiry: val && f.taxYear ? `${val}/${f.taxYear}` : '' }))}
                          options={['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']}
                          placeholder="Month"
                        />
                      </div>
                      <div>
                        <MobileSelect
                          value={form.taxYear || ''}
                          onChange={(val) => setForm((f) => ({ ...f, taxYear: val, taxExpiry: f.taxMonth && val ? `${f.taxMonth}/${val}` : '' }))}
                          options={Array.from({ length: 10 }, (_, i) => String(2025 + i))}
                          placeholder="Year"
                        />
                      </div>
                </div>
              </div>

              {/* Battery size (kWh) */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Battery size (kWh)</label>
                <OtherSelect
                  value={form.batterySize}
                  onChange={(val) => setForm((f) => ({ ...f, batterySize: val }))}
                  options={['24 kWh', '30 kWh', '40 kWh', '50 kWh', '60 kWh', '64 kWh', '77 kWh', '82 kWh', '100 kWh', '100+ kWh']}
                  placeholder="Select..."
                  enterLabel="Enter battery size..." />
              </div>

              {/* Engine Power */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Engine Power</label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.enginePower}
                    onChange={(e) => {const raw = e.target.value.replace(/[^0-9]/g, '');setForm((f) => ({ ...f, enginePower: raw }));}}
                    placeholder="e.g. 150"
                    className="w-full border border-border rounded-lg px-4 py-3 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">hp</span>
                </div>
              </div>

              {/* Battery Range */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Battery Range (km)</label>
                <OtherSelect
                  value={form.batteryRange}
                  onChange={(val) => setForm((f) => ({ ...f, batteryRange: val }))}
                  options={['150 km', '200 km', '250 km', '300 km', '350 km', '400 km', '450 km', '500 km', '550 km', '600 km', '600+ km']}
                  placeholder="Select..."
                  enterLabel="Enter battery range..." />
              </div>

              {/* Seats */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Seats</label>
                <OtherSelect
                  value={form.numberOfSeats}
                  onChange={(val) => setForm((f) => ({ ...f, numberOfSeats: val }))}
                  options={['2', '4', '5', '6', '7', '8+']}
                  placeholder="Select..."
                  enterLabel="Enter seats..." />
              </div>

              {/* Doors */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Doors</label>
                <OtherSelect
                  value={form.numberOfDoors}
                  onChange={(val) => setForm((f) => ({ ...f, numberOfDoors: val }))}
                  options={['2', '3', '4', '5']}
                  placeholder="Select..."
                  enterLabel="Enter doors..." />
              </div>

              {/* Previous Owners */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Previous Owners</label>
                <OtherSelect
                  value={form.previousOwners}
                  onChange={(val) => setForm((f) => ({ ...f, previousOwners: val }))}
                  options={['1', '2', '3+']}
                  placeholder="Select..."
                  enterLabel="Enter previous owners..." />
              </div>

              {/* Road Tax */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Road Tax (annual)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">€</span>
                  <input
                    type="text"
                    value={form.roadTax}
                    onChange={(e) => {const raw = e.target.value.replace(/[^0-9]/g, '');const formatted = raw ? Number(raw).toLocaleString('en-IE') : '';setForm((f) => ({ ...f, roadTax: formatted }));}}
                    placeholder="e.g. 350"
                    className="w-full border border-border rounded-lg px-4 py-3 text-sm pl-7 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                </div>
              </div>

              {/* Colour */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Colour</label>
                <OtherSelect
                  value={form.colour}
                  onChange={(val) => setForm((f) => ({ ...f, colour: val }))}
                  options={['Black', 'White', 'Silver', 'Grey', 'Navy Blue', 'Blue', 'Red', 'Burgundy', 'Green', 'Yellow', 'Orange', 'Brown', 'Beige', 'Gold', 'Bronze', 'Purple', 'Pink', 'Turquoise', 'Champagne', 'Graphite', 'Copper']}
                  placeholder="Select..."
                  enterLabel="Enter colour..." />
              </div>

              {/* Full Service History & No Accidents */}
              <div className="col-span-2 flex flex-col gap-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.fullServiceHistory} onChange={(e) => setForm((f) => ({ ...f, fullServiceHistory: e.target.checked }))} className="w-4 h-4 accent-primary" />
                  <span className="text-sm font-medium">Full Service History</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.noAccidents} onChange={(e) => setForm((f) => ({ ...f, noAccidents: e.target.checked }))} className="w-4 h-4 accent-primary" />
                  <span className="text-sm font-medium">No Accidents</span>
                </label>
              </div>

            </div>
          </Section>}

          {/* Vintage Cars suggestion banner */}
          {showVintageSuggestion &&
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <h3 className="font-bold text-amber-900 text-sm">This looks like a vintage vehicle!</h3>
                  <p className="text-amber-800 text-sm mt-0.5">Your car year ({form.vehicleYear}) is 2000 or older — we recommend listing it in the <strong>Vintage Cars</strong> section to reach the right buyers.</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                type="button"
                onClick={() => {
                  setForm((f) => ({ ...f, subsection: 'Vintage Cars', section: 'Cars' }));
                  setVintageSuggestionDismissed(true);
                }}
                className="bg-amber-700 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-amber-800 transition-colors">
                  Move to Vintage Cars
                </button>
                <button
                type="button"
                onClick={() => setVintageSuggestionDismissed(true)}
                className="border border-amber-400 text-amber-800 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-amber-100 transition-colors">
                  Keep current section
                </button>
              </div>
            </div>
          }

          {/* Section 4: Ad Details */}
          <Section title="Ad Details" icon={<FileText className="w-5 h-5" />}>
            <div className="flex flex-col gap-4">
              <div id="field-title">
                <label className="block text-sm font-medium text-foreground mb-1.5">Ad Title <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => {set('title')(e);setFormErrors((err) => ({ ...err, title: undefined }));}}
                  placeholder="Type your title"
                  className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${formErrors.title ? 'border-destructive' : 'border-border'}`} />
                {formErrors.title ? <p className="text-xs text-destructive mt-1 flex items-center gap-1"><span>⚠</span>{formErrors.title}</p> : <p className="text-xs text-muted-foreground mt-1">This title will be displayed in search results</p>}
              </div>

              <div id="field-description">
                <label className="block text-sm font-medium text-foreground mb-1.5">Description <span className="text-destructive">*</span></label>
                <textarea
                  value={form.description}
                  onChange={(e) => {set('description')(e);setFormErrors((err) => ({ ...err, description: undefined }));}}
                  maxLength={2100}
                  rows={5}
                  placeholder="Type in your ad description. Enter related details of your ad."
                  className={`w-full border rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${formErrors.description ? 'border-destructive' : 'border-border'}`} />
                {formErrors.description && <p className="text-xs text-destructive flex items-center gap-1"><span>⚠</span>{formErrors.description}</p>}
                <p className="text-xs text-muted-foreground text-right">{form.description.length} / 2100</p>
              </div>

              <div id="field-price">
                <label className="block text-sm font-medium text-foreground mb-1.5">Price <span className="text-destructive">*</span></label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">{form.currency}</span>
                    <input
                      type="text"
                      value={form.price}
                      onChange={(e) => {const raw = e.target.value.replace(/[^0-9]/g, '');const formatted = raw ? Number(raw).toLocaleString('en-IE') : '';setForm((f) => ({ ...f, price: formatted }));setFormErrors((err) => ({ ...err, price: undefined }));}}
                      placeholder="e.g. 5,600"
                      className={`w-full border rounded-lg px-4 py-3 text-sm pl-7 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${formErrors.price ? 'border-destructive' : 'border-border'}`} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, currency: f.currency === '€' ? '£' : '€' }))}
                    className="border border-border rounded-lg px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary transition-colors whitespace-nowrap">
                    {form.currency === '€' ? '€ EUR' : '£ GBP'}
                  </button>
                </div>
                {formErrors.price && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><span>⚠</span>{formErrors.price}</p>}
              </div>
            </div>
          </Section>

          {/* Section 5: Contact Details */}
          <Section title="Contact Details" icon={<User className="w-5 h-5" />}>
            <div className="flex flex-col gap-4">
              <div id="field-fullName">
                <label className="block text-sm font-medium text-foreground mb-1.5">Full Name <span className="text-destructive">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" value={form.fullName} onChange={(e) => {set('fullName')(e);setFormErrors((err) => ({ ...err, fullName: undefined }));}} placeholder="Your full name"
                  className={`w-full border rounded-lg px-4 py-3 text-sm pl-9 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${formErrors.fullName ? 'border-destructive' : 'border-border'}`} />
                </div>
                {formErrors.fullName && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><span>⚠</span>{formErrors.fullName}</p>}
              </div>

              <div id="field-phone">
                <label className="block text-sm font-medium text-foreground mb-1.5">Phone <span className="text-destructive">*</span></label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="tel" value={form.phone} onChange={(e) => {setForm((f) => ({ ...f, phone: e.target.value.replace(/[^0-9 +\-()]/g, '') }));setFormErrors((err) => ({ ...err, phone: undefined }));}} placeholder="e.g. 086 123 4567"
                  className={`w-full border rounded-lg px-4 py-3 text-sm pl-9 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${formErrors.phone ? 'border-destructive' : 'border-border'}`} />
                </div>
                {formErrors.phone && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><span>⚠</span>{formErrors.phone}</p>}
              </div>

              <div id="field-email">
                <label className="block text-sm font-medium text-foreground mb-1.5">E-mail <span className="text-destructive">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="email" value={form.email} onChange={(e) => {set('email')(e);setFormErrors((err) => ({ ...err, email: undefined }));}} placeholder="you@example.com"
                  className={`w-full border rounded-lg px-4 py-3 text-sm pl-9 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${formErrors.email ? 'border-destructive' : 'border-border'}`} />
                </div>
                {formErrors.email && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><span>⚠</span>{formErrors.email}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Location <span className="text-destructive">*</span></label>
                  <OtherSelect
                    value={form.county}
                    onChange={(val) => setForm((f) => ({ ...f, county: val, area: '' }))}
                    options={counties}
                    placeholder="Select location..."
                    enterLabel="Enter location..." />
                </div>
                <div id="field-area">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Area <span className="text-destructive">*</span></label>
                  <OtherSelect
                    value={form.area}
                    onChange={(val) => {setForm((f) => ({ ...f, area: val }));setFormErrors((err) => ({ ...err, area: undefined }));}}
                    options={areas}
                    placeholder="Select area..."
                    enterLabel="Enter area..." />
                  {formErrors.area && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><span>⚠</span>{formErrors.area}</p>}
                </div>
              </div>

              {/* Allow contact by */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Allow contact by <span className="text-destructive">*</span></label>
                <div className="flex gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={toggle('contactByMessage')}
                    className={`flex items-center gap-2 border rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${form.contactByMessage ? 'border-primary bg-primary/5 text-primary' : 'border-border text-foreground hover:bg-secondary'}`}>
                    <Mail className="w-4 h-4" /> Message/Text
                  </button>
                  <button
                    type="button"
                    onClick={toggle('contactByPhone')}
                    className={`flex items-center gap-2 border rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${form.contactByPhone ? 'border-primary bg-primary/5 text-primary' : 'border-border text-foreground hover:bg-secondary'}`}>
                    <Phone className="w-4 h-4" /> Phone
                  </button>
                </div>

              </div>

              {/* Trader */}
              <div className="border border-border rounded-xl p-4 flex items-start gap-3">
                <input type="checkbox" id="trader" checked={form.isTrader} onChange={toggle('isTrader')}
                className="w-4 h-4 mt-0.5 accent-primary cursor-pointer" />
                <div>
                  <label htmlFor="trader" className="text-sm font-medium cursor-pointer">Yes, I'm a trader</label>
                  <p className="text-xs text-muted-foreground mt-0.5">Generates a VAT receipt</p>
                </div>
              </div>

              {/* Trader details */}
              {form.isTrader &&
              <div className="flex flex-col gap-4 border border-border rounded-xl p-4 bg-secondary/30">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Business Name <span className="text-destructive">*</span></label>
                    <input
                    type="text"
                    value={form.businessName}
                    onChange={set('businessName')}
                    placeholder="Business Name"
                    className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Business Address</label>
                    <textarea
                    value={form.businessAddress}
                    onChange={set('businessAddress')}
                    placeholder="Business Address"
                    rows={3}
                    className="w-full border border-border rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">VAT Number</label>
                    <input
                    type="text"
                    value={form.vatNumber}
                    onChange={set('vatNumber')}
                    placeholder="e.g. 12343234"
                    className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                  </div>
                </div>
              }
            </div>
          </Section>

          {/* Ad Package / Payment */}
          <AdPackageSelector
            isBikeCategory={isBikeCategory}
            selectedPackage={selectedPackage}
            onPackageSelected={(pkg) => {
              setSelectedPackage(pkg);
              setPackageLimits({ listingDays: pkg.listingDays, maxPhotos: pkg.maxPhotos });
            }} />
          

          {/* Actions */}
          <div className="flex flex-col gap-3 pb-10">
            <button
              onClick={() => setShowPreview(true)}
              className="w-full bg-primary text-white font-bold py-4 rounded-xl text-base hover:bg-primary/90 transition-colors">
              Preview Ad
            </button>
            {sellError &&
            <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium px-4 py-3 rounded-lg">
                <span>⚠</span> {sellError}
              </div>
            }
            <button
              onClick={async () => {
                if (submittingRef.current) return;
                submittingRef.current = true;
                setSellError('');
                const valid = validateForm();
                if (!valid) {
                  submittingRef.current = false;
                  setSellError('Please complete all missing fields before continuing.');
                  return;
                }
                if (!selectedPackage) {
                  submittingRef.current = false;
                  setSellError('Please select an ad package before proceeding.');
                  return;
                }
                if (window.self !== window.top) {
                  submittingRef.current = false;
                  setSellError('Checkout is only available from the published app, not the preview.');
                  return;
                }
                setCheckoutLoading(true);
                try {
                  // Upload photos to permanent storage before redirect
                  const uploadedPhotoUrls = photos.length > 0 ? await uploadPhotos(photos) : [];

                  // Create the ad as 'pending' — the Stripe webhook activates it
                  // only after a signature-verified checkout.session.completed event.
                  const adData = {
                    title: form.title,
                    description: form.description,
                    price: form.price,
                    currency: form.currency,
                    category: form.category,
                    subsection: form.subsection,
                    county: form.county,
                    area: form.area === '__other__' ? '' : form.area,
                    location: `${form.area === '__other__' ? '' : form.area}, ${form.county === '__other__' ? '' : form.county}`,
                    mileage: form.mileage ? `${form.mileage} ${form.mileageUnit}` : '',
                    vehicleMake: form.vehicleMake === '__other__' ? '' : form.vehicleMake,
                    vehicleModel: form.vehicleModel === '__other__' ? '' : form.vehicleModel,
                    vehicleYear: form.vehicleYear,
                    vehicleFuel: form.vehicleFuel === '__other__' ? '' : form.vehicleFuel,
                    vehicleTransmission: form.vehicleTransmission === '__other__' ? '' : form.vehicleTransmission,
                    bodyType: form.bodyType === '__other__' ? '' : form.bodyType,
                    colour: form.colour,
                    engineSize: form.engineSize === '__other__' ? '' : form.engineSize,
                    nctExpiry: form.nctExpiry,
                    taxExpiry: form.taxExpiry,
                    enginePower: form.enginePower,
                    batteryRange: form.batteryRange,
                    batterySize: form.batterySize,
                    numberOfSeats: form.numberOfSeats,
                    numberOfDoors: form.numberOfDoors,
                    previousOwners: form.previousOwners,
                    fullServiceHistory: form.fullServiceHistory,
                    noAccidents: form.noAccidents,
                    roadTax: form.roadTax,
                    fullName: form.fullName,
                    email: form.email,
                    phone: form.phone,
                    adType: form.adType,
                    isTrader: form.isTrader,
                    photos: uploadedPhotoUrls,
                    status: 'pending'
                  };
                  // Reuse an existing pending ad with the same title instead of
                  // creating a duplicate — prevents abandoned/pending ads from
                  // piling up when a user retries "Sell Now" after abandoning a
                  // previous checkout.
                  let createdAd;
                  const existingPending = await base44.entities.UserAd.filter(
                    { title: form.title, status: 'pending' },
                    '-created_date',
                    1
                  );
                  if (existingPending && existingPending.length > 0) {
                    await base44.entities.UserAd.update(existingPending[0].id, adData);
                    createdAd = { id: existingPending[0].id };
                  } else {
                    createdAd = await base44.entities.UserAd.create(adData);
                  }

                  const res = await base44.functions.invoke('createCheckoutSession', {
                    packageName: selectedPackage.name,
                    listingDays: selectedPackage.listingDays,
                    maxPhotos: selectedPackage.maxPhotos,
                    bumps: selectedPackage.bumps,
                    bumpIntervalWeeks: selectedPackage.bumpIntervalWeeks,
                    spotlightDays: selectedPackage.spotlightDays,
                    adId: createdAd.id,
                    isBikeCategory: isBikeCategory
                  });
                  if (res.data.url) {
                    window.location.href = res.data.url;
                  } else {
                    setSellError('Could not start checkout. Please try again.');
                  }
                } catch (e) {
                  setSellError('Could not start checkout. Please try again.');
                } finally {
                  setCheckoutLoading(false);
                  submittingRef.current = false;
                }
              }}
              disabled={checkoutLoading}
              className="w-full bg-foreground text-background font-bold py-4 rounded-xl text-base hover:opacity-90 transition-opacity disabled:opacity-60">
              {checkoutLoading ? photos.length > 0 ? 'Uploading photos...' : 'Redirecting to payment...' : 'Sell Now'}
            </button>
            <p className="text-xs text-muted-foreground text-center">
              By clicking "Sell Now", you agree to the AutoMax{' '}
              <Link to="/terms-and-conditions" className="text-primary hover:underline">Terms & Conditions</Link>.
            </p>
            <button onClick={handleReset} className="w-full border border-foreground text-foreground font-semibold py-3 rounded-xl hover:bg-secondary transition-colors text-sm">
              Reset Form
            </button>
          </div>

        </div>
      </div>

      <Footer />
    </div>);

}

function Section({ id, title, icon, subtitle, children }) {
  return (
    <div id={id} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-primary">{icon}</span>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
      </div>
      {subtitle && <p className="text-sm mb-4 text-[hsl(var(--primary))]">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </div>);

}