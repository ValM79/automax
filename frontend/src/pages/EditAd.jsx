import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useNavigationType } from 'react-router-dom';
import { Upload, X, Plus, Trash2, Save, Car, FileText, User, Phone, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import MobileSelect from '../components/automarket/MobileSelect';
import OtherSelect from '../components/automarket/OtherSelect';
import { modelsByMake } from '@/components/automarket/modelsData';
import ImageViewer from '../components/automarket/ImageViewer';

const counties = ['Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford', 'Kilkenny', 'Mayo', 'Kerry', 'Clare', 'Tipperary', 'Roscommon', 'Westmeath', 'Wexford', 'Wicklow', 'Meath', 'Kildare'];

const areasByCounty = {
  Dublin: ['Dublin City Centre', 'North Dublin', 'South Dublin', 'West Dublin', 'East Dublin'],
  Cork: ['Cork City', 'North Cork', 'South Cork', 'West Cork'],
  Galway: ['Galway City', 'Connemara', 'East Galway'],
  Limerick: ['Limerick City', 'North Limerick', 'South Limerick'],
  default: ['North', 'South', 'East', 'West', 'City Centre']
};

const browseCategories = ['New Cars', 'Cars', 'Electric & Hybrid Cars', 'Dealership Cars', 'Vintage Cars', 'Modified Cars', 'Car Parts', 'Car Extras', 'Rally Cars', 'Breaking & Repairables', 'Trucks', 'Commercials', 'Trailers', 'Campers', 'Coaches & Buses', 'Plant Machinery', 'Motorbike Extras', 'Caravans', 'Bikes & Bicycles', 'Motorbikes', 'Vintage Bikes', 'Scooters', 'Quads', 'Boats & Jet Skis', 'Boat Extras', 'Other items'];

const knownMakes = ['Alfa Romeo', 'Audi', 'BMW', 'Citroën', 'Fiat', 'Ford', 'Honda', 'Hyundai', 'Jaguar', 'Jeep', 'Kia', 'Land Rover', 'Lexus', 'Mazda', 'Mercedes-Benz', 'Mitsubishi', 'Nissan', 'Opel', 'Peugeot', 'Porsche', 'Renault', 'Seat', 'Skoda', 'Subaru', 'Suzuki', 'Tesla', 'Toyota', 'Vauxhall', 'Volkswagen', 'Volvo'];

const vehicleDetailsCategories = ['Cars', 'New Cars', 'Electric & Hybrid Cars', 'Trucks', 'Motorbikes', 'Coaches & Buses', 'Commercials'];

const MAX_PHOTOS = 12;

export default function EditAd() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoadingAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const [form, setForm] = useState({});
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [newPhotos, setNewPhotos] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(null);
  const fileInputRef = useRef(null);
  const navDepthRef = useRef(0);
  const navType = useNavigationType();

  useEffect(() => {
    if (navType === 'PUSH') navDepthRef.current += 1;
    else if (navType === 'POP') navDepthRef.current = Math.max(0, navDepthRef.current - 1);
  }, [navType]);

  const handleBack = () => {
    if (navDepthRef.current > 0 || window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/my-ads', { replace: true });
    }
  };

  const allPhotoUrls = [...existingPhotos, ...newPhotos.map((p) => p.preview)];

  useEffect(() => {
    if (!isLoadingAuth && !user) {
      navigate(`/login?next=/edit-ad/${id}`);
      return;
    }
    if (!id || !user) return;
    (async () => {
      try {
        const ad = await api.entities.UserAd.get(id);
        if (ad.created_by_id !== user.id) {
          setError('You do not have permission to edit this ad.');
          setLoading(false);
          return;
        }
        const mileageParts = (ad.mileage || '').split(' ');
        const nctParts = (ad.nctExpiry || '').split('/');
        const taxParts = (ad.taxExpiry || '').split('/');
        setForm({
          subsection: ad.subsection || '',
          adType: ad.adType || 'for_sale',
          currency: ad.currency || '€',
          title: ad.title || '',
          description: ad.description || '',
          price: ad.price || '',
          mileage: mileageParts[0] || '',
          mileageUnit: mileageParts[1] || 'km',
          vehicleMake: ad.vehicleMake || '',
          vehicleModel: ad.vehicleModel || '',
          vehicleYear: ad.vehicleYear || '',
          vehicleFuel: ad.vehicleFuel || '',
          vehicleTransmission: ad.vehicleTransmission || '',
          bodyType: ad.bodyType || '',
          colour: ad.colour || '',
          engineSize: ad.engineSize || '',
          enginePower: ad.enginePower || '',
          batteryRange: ad.batteryRange || '',
          batterySize: ad.batterySize || '',
          numberOfSeats: ad.numberOfSeats || '',
          numberOfDoors: ad.numberOfDoors || '',
          previousOwners: ad.previousOwners || '',
          fullServiceHistory: ad.fullServiceHistory || false,
          noAccidents: ad.noAccidents || false,
          roadTax: ad.roadTax || '',
          nctMonth: nctParts[0] || '',
          nctYear: nctParts[1] || '',
          taxMonth: taxParts[0] || '',
          taxYear: taxParts[1] || '',
          fullName: ad.fullName || '',
          email: ad.email || '',
          phone: ad.phone || '',
          county: ad.county || 'Dublin',
          area: ad.area || '',
          location: ad.location || '',
          isTrader: ad.isTrader || false
        });
        setExistingPhotos(ad.photos || []);
      } catch {
        setError('Could not load this ad.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user, isLoadingAuth]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const toggle = (field) => () => setForm((f) => ({ ...f, [field]: !f[field] }));
  const areas = areasByCounty[form.county] || areasByCounty.default;
  const showVehicleDetails = vehicleDetailsCategories.includes(form.subsection);
  const totalPhotos = existingPhotos.length + newPhotos.length;

  const handleFiles = (files) => {
    const valid = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const remaining = MAX_PHOTOS - totalPhotos;
    const toAdd = valid.slice(0, remaining).map((f) => ({ file: f, preview: URL.createObjectURL(f) }));
    setNewPhotos((prev) => [...prev, ...toAdd]);
  };

  const removeExistingPhoto = (idx) => {
    setExistingPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeNewPhoto = (idx) => {
    setNewPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSetCover = (idx) => {
    if (idx === 0) return;
    const existingCount = existingPhotos.length;
    if (idx < existingCount) {
      setExistingPhotos((prev) => {
        const arr = [...prev];
        const [item] = arr.splice(idx, 1);
        arr.unshift(item);
        return arr;
      });
    } else {
      const newIdx = idx - existingCount;
      setNewPhotos((prev) => {
        const arr = [...prev];
        const [item] = arr.splice(newIdx, 1);
        arr.unshift(item);
        return arr;
      });
    }
    setViewerIndex(null);
  };

  const handleRotate = (idx, rotation) => {
    const existingCount = existingPhotos.length;
    if (idx >= existingCount) {
      const newIdx = idx - existingCount;
      setNewPhotos((prev) => {
        const arr = [...prev];
        arr[newIdx] = { ...arr[newIdx], rotation };
        return arr;
      });
    }
  };

  const handleDeleteFromViewer = (idx) => {
    const existingCount = existingPhotos.length;
    if (idx < existingCount) {
      removeExistingPhoto(idx);
    } else {
      removeNewPhoto(idx - existingCount);
    }
    setViewerIndex(null);
  };

  const uploadNewPhotos = async () => {
    return await Promise.all(
      newPhotos.map(async (p) => {
        try {
          const res = await fetch(p.preview);
          const blob = await res.blob();
          const file = new File([blob], 'photo.jpg', { type: blob.type || 'image/jpeg' });
          const result = await api.integrations.Core.UploadFile({ file });
          return result.file_url;
        } catch {
          return null;
        }
      })
    ).then(urls => urls.filter(Boolean));
  };

  const validateForm = () => {
    const errors = {};
    if (!form.title?.trim()) errors.title = 'Title is required';
    if (!form.description?.trim()) errors.description = 'Description is required';
    if (!form.price?.trim()) errors.price = 'Price is required';
    if (!form.subsection) errors.subsection = 'Category is required';
    if (!form.fullName?.trim()) errors.fullName = 'Full name is required';
    if (!form.email?.trim()) errors.email = 'Email is required';
    if (!form.phone?.trim()) errors.phone = 'Phone is required';
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      const firstKey = Object.keys(errors)[0];
      const el = document.getElementById(`field-${firstKey}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    setError('');
    if (!validateForm()) return;
    setSaving(true);
    try {
      const uploadedNew = await uploadNewPhotos();
      const allPhotos = [...existingPhotos, ...uploadedNew];
      await api.entities.UserAd.update(id, {
        title: form.title,
        description: form.description,
        price: form.price,
        currency: form.currency,
        subsection: form.subsection,
        county: form.county,
        area: form.area,
        location: `${form.area || ''}, ${form.county || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, ''),
        mileage: form.mileage ? `${form.mileage} ${form.mileageUnit}` : '',
        vehicleMake: form.vehicleMake === '__other__' ? '' : form.vehicleMake,
        vehicleModel: form.vehicleModel === '__other__' ? '' : form.vehicleModel,
        vehicleYear: form.vehicleYear,
        vehicleFuel: form.vehicleFuel === '__other__' ? '' : form.vehicleFuel,
        vehicleTransmission: form.vehicleTransmission === '__other__' ? '' : form.vehicleTransmission,
        bodyType: form.bodyType === '__other__' ? '' : form.bodyType,
        colour: form.colour,
        engineSize: form.engineSize === '__other__' ? '' : form.engineSize,
        enginePower: form.enginePower,
        batteryRange: form.batteryRange,
        batterySize: form.batterySize,
        numberOfSeats: form.numberOfSeats,
        numberOfDoors: form.numberOfDoors,
        previousOwners: form.previousOwners,
        fullServiceHistory: form.fullServiceHistory,
        noAccidents: form.noAccidents,
        roadTax: form.roadTax,
        nctExpiry: form.nctMonth && form.nctYear ? `${form.nctMonth}/${form.nctYear}` : '',
        taxExpiry: form.taxMonth && form.taxYear ? `${form.taxMonth}/${form.taxYear}` : '',
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        adType: form.adType,
        isTrader: form.isTrader,
        photos: allPhotos
      });
      navigate('/my-ads');
    } catch (e) {
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || isLoadingAuth) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error && !form.title) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <p className="text-sm text-destructive mb-4">{error}</p>
          <Link to="/my-ads" className="text-primary hover:underline text-sm">Back to My Ads</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <button onClick={handleBack} className="flex items-center gap-1 hover:text-primary transition-colors min-h-[44px]">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <span>›</span>
          <Link to="/my-ads" className="hover:text-primary transition-colors">My Ads</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Edit Ad</span>
        </div>
        <h1 className="text-xl font-bold text-foreground mb-6">Edit Your Ad</h1>

        <div className="flex flex-col gap-6">
          {/* Photos Section */}
          <Section title="Photos" icon={<Upload className="w-5 h-5" />} subtitle={`${totalPhotos}/${MAX_PHOTOS} photos`}>
            {(existingPhotos.length > 0 || newPhotos.length > 0) && (
              <div className="grid grid-cols-4 gap-3 mb-4">
                {existingPhotos.map((url, i) => (
                  <button
                    key={`ex-${i}`}
                    onClick={() => setViewerIndex(i)}
                    className="relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition-colors w-full">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    {i === 0 && <div className="absolute top-1 left-1 bg-yellow-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">★ COVER</div>}
                  </button>
                ))}
                {newPhotos.map((p, i) => (
                  <button
                    key={`new-${i}`}
                    onClick={() => setViewerIndex(existingPhotos.length + i)}
                    className="relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition-colors w-full">
                    <img src={p.preview} alt="" className="w-full h-full object-cover" style={{ transform: `rotate(${p.rotation || 0}deg)` }} />
                  </button>
                ))}
                {totalPhotos < MAX_PHOTOS && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors">
                    <Plus className="w-6 h-6 text-primary mb-1" />
                    <span className="text-xs text-muted-foreground">Add</span>
                  </button>
                )}
              </div>
            )}
            {totalPhotos === 0 && (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <button onClick={() => fileInputRef.current?.click()} className="text-primary font-semibold hover:underline">Add Photos</button>
                <span className="text-muted-foreground text-sm"> or drag and drop</span>
                <p className="text-xs text-muted-foreground mt-2">Up to {MAX_PHOTOS} images</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          </Section>

          {/* Category Section */}
          <Section title="Category" icon={<FileText className="w-5 h-5" />}>
            <div id="field-subsection">
              <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
              <MobileSelect
                value={form.subsection}
                onChange={(val) => setForm((f) => ({ ...f, subsection: val }))}
                options={browseCategories}
                placeholder="Select a category..." />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-foreground mb-2">Ad Type</label>
              <div className="flex gap-4">
                {['for_sale', 'wanted'].map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="adType" value={type} checked={form.adType === type} onChange={set('adType')} className="w-4 h-4 accent-primary" />
                    <span className="text-sm font-medium">{type === 'for_sale' ? 'For Sale' : 'Wanted'}</span>
                  </label>
                ))}
              </div>
            </div>
          </Section>

          {/* Vehicle Details Section */}
          {showVehicleDetails && (
            <Section title="Vehicle Details" icon={<Car className="w-5 h-5" />} subtitle="Enter your vehicle details manually only related">
              <div className="grid grid-cols-2 gap-4">
                {/* Make */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Make</label>
                  {(() => {
                    const isCustom = form.vehicleMake === '__other__' || (form.vehicleMake && !knownMakes.includes(form.vehicleMake));
                    if (isCustom) {
                      return (
                        <div className="relative">
                          <input type="text" value={form.vehicleMake === '__other__' ? '' : form.vehicleMake}
                            onChange={(e) => setForm((f) => ({ ...f, vehicleMake: e.target.value || '__other__', vehicleModel: '' }))}
                            placeholder="Enter make..."
                            className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary pr-9" />
                          <X className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground cursor-pointer" onClick={() => setForm((f) => ({ ...f, vehicleMake: '', vehicleModel: '' }))} />
                        </div>
                      );
                    }
                    return (
                      <MobileSelect value={form.vehicleMake}
                        onChange={(val) => setForm((f) => ({ ...f, vehicleMake: val === 'Other' ? '__other__' : val, vehicleModel: '' }))}
                        options={[...knownMakes, 'Other']} placeholder="Select make..." />
                    );
                  })()}
                </div>
                {/* Model */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Model</label>
                  {(() => {
                    const makeKey = form.vehicleMake && form.vehicleMake !== '__other__' ? Object.keys(modelsByMake).find((k) => k.toLowerCase() === form.vehicleMake.toLowerCase()) : null;
                    const availableModels = makeKey ? modelsByMake[makeKey].map((m) => m.name).filter((m) => m !== 'Other') : null;
                    const isCustom = form.vehicleModel === '__other__' || (form.vehicleModel && availableModels && !availableModels.includes(form.vehicleModel));
                    if (!availableModels || isCustom) {
                      return (
                        <div className="relative">
                          <input type="text" value={form.vehicleModel === '__other__' ? '' : form.vehicleModel}
                            onChange={(e) => setForm((f) => ({ ...f, vehicleModel: e.target.value || '__other__' }))}
                            placeholder="Enter model..."
                            className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary pr-9" />
                          <X className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground cursor-pointer" onClick={() => setForm((f) => ({ ...f, vehicleModel: '' }))} />
                        </div>
                      );
                    }
                    return (
                      <MobileSelect value={form.vehicleModel}
                        onChange={(val) => setForm((f) => ({ ...f, vehicleModel: val === 'Other' ? '__other__' : val }))}
                        options={[...availableModels, 'Other']} placeholder="Select model..." />
                    );
                  })()}
                </div>
                {/* Year */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Year</label>
                  <MobileSelect value={form.vehicleYear} onChange={(val) => setForm((f) => ({ ...f, vehicleYear: val }))}
                    options={Array.from({ length: 2026 - 1980 + 1 }, (_, i) => String(2026 - i))} placeholder="Select year..." />
                </div>
                {/* Odometer */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Odometer</label>
                  <div className="flex flex-col gap-2">
                    <input type="text" value={form.mileage}
                      onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ''); const formatted = raw ? Number(raw).toLocaleString('en-IE') : ''; setForm((f) => ({ ...f, mileage: formatted })); }}
                      placeholder="e.g. 12,000" className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                    <div>
                      <MobileSelect value={form.mileageUnit} onChange={(val) => setForm((f) => ({ ...f, mileageUnit: val }))} options={['km', 'miles']} />
                    </div>
                  </div>
                </div>
                {/* Engine Size */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Engine Size</label>
                  <OtherSelect value={form.engineSize} onChange={(val) => setForm((f) => ({ ...f, engineSize: val }))}
                    options={['1.0L', '1.2L', '1.4L', '1.6L', '1.8L', '2.0L', '2.5L', '3.0L+']} placeholder="Select..." enterLabel="Enter engine size..." />
                </div>
                {/* Fuel Type */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Fuel Type</label>
                  <OtherSelect value={form.vehicleFuel} onChange={(val) => setForm((f) => ({ ...f, vehicleFuel: val }))}
                    options={['Petrol', 'Diesel', 'LPG', 'Electric', 'Hybrid', 'Plug-in Hybrid']} placeholder="Select..." enterLabel="Enter fuel type..." />
                </div>
                {/* Transmission */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Transmission</label>
                  <OtherSelect value={form.vehicleTransmission} onChange={(val) => setForm((f) => ({ ...f, vehicleTransmission: val }))}
                    options={['Manual', 'Automatic']} placeholder="Select..." enterLabel="Enter transmission..." />
                </div>
                {/* Body Type */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Body Type</label>
                  <OtherSelect value={form.bodyType} onChange={(val) => setForm((f) => ({ ...f, bodyType: val }))}
                    options={['Hatchback', 'Saloon', 'Estate', 'Coupe', 'Convertible', 'SUV', 'MPV', 'Van', 'Pick Up']} placeholder="Select..." enterLabel="Enter body type..." />
                </div>
                {/* NCT Expiry */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">NCT Expiry</label>
                  <div className="flex flex-col gap-2">
                    <div>
                      <MobileSelect value={form.nctMonth || ''} onChange={(val) => setForm((f) => ({ ...f, nctMonth: val }))}
                        options={['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']} placeholder="Month" />
                    </div>
                    <div>
                      <MobileSelect value={form.nctYear || ''} onChange={(val) => setForm((f) => ({ ...f, nctYear: val }))}
                        options={Array.from({ length: 10 }, (_, i) => String(2025 + i))} placeholder="Year" />
                    </div>
                  </div>
                </div>
                {/* Tax Expiry */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Tax Expiry</label>
                  <div className="flex flex-col gap-2">
                    <div>
                      <MobileSelect value={form.taxMonth || ''} onChange={(val) => setForm((f) => ({ ...f, taxMonth: val }))}
                        options={['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']} placeholder="Month" />
                    </div>
                    <div>
                      <MobileSelect value={form.taxYear || ''} onChange={(val) => setForm((f) => ({ ...f, taxYear: val }))}
                        options={Array.from({ length: 10 }, (_, i) => String(2025 + i))} placeholder="Year" />
                    </div>
                  </div>
                </div>
                {/* Battery size */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Battery size (kWh)</label>
                  <OtherSelect value={form.batterySize} onChange={(val) => setForm((f) => ({ ...f, batterySize: val }))}
                    options={['24 kWh', '30 kWh', '40 kWh', '50 kWh', '60 kWh', '64 kWh', '77 kWh', '82 kWh', '100 kWh', '100+ kWh']} placeholder="Select..." enterLabel="Enter battery size..." />
                </div>
                {/* Engine Power */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Engine Power</label>
                  <div className="relative">
                    <input type="text" value={form.enginePower}
                      onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ''); setForm((f) => ({ ...f, enginePower: raw })); }}
                      placeholder="e.g. 150" className="w-full border border-border rounded-lg px-4 py-3 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">hp</span>
                  </div>
                </div>
                {/* Battery Range */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Battery Range (km)</label>
                  <OtherSelect value={form.batteryRange} onChange={(val) => setForm((f) => ({ ...f, batteryRange: val }))}
                    options={['150 km', '200 km', '250 km', '300 km', '350 km', '400 km', '450 km', '500 km', '550 km', '600 km', '600+ km']} placeholder="Select..." enterLabel="Enter battery range..." />
                </div>
                {/* Seats */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Seats</label>
                  <OtherSelect value={form.numberOfSeats} onChange={(val) => setForm((f) => ({ ...f, numberOfSeats: val }))}
                    options={['2', '4', '5', '6', '7', '8+']} placeholder="Select..." enterLabel="Enter seats..." />
                </div>
                {/* Doors */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Doors</label>
                  <OtherSelect value={form.numberOfDoors} onChange={(val) => setForm((f) => ({ ...f, numberOfDoors: val }))}
                    options={['2', '3', '4', '5']} placeholder="Select..." enterLabel="Enter doors..." />
                </div>
                {/* Previous Owners */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Previous Owners</label>
                  <OtherSelect value={form.previousOwners} onChange={(val) => setForm((f) => ({ ...f, previousOwners: val }))}
                    options={['1', '2', '3+']} placeholder="Select..." enterLabel="Enter previous owners..." />
                </div>
                {/* Road Tax */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Road Tax (annual)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">€</span>
                    <input type="text" value={form.roadTax}
                      onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ''); const formatted = raw ? Number(raw).toLocaleString('en-IE') : ''; setForm((f) => ({ ...f, roadTax: formatted })); }}
                      placeholder="e.g. 350" className="w-full border border-border rounded-lg px-4 py-3 text-sm pl-7 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                  </div>
                </div>
                {/* Colour */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Colour</label>
                  <OtherSelect value={form.colour} onChange={(val) => setForm((f) => ({ ...f, colour: val }))}
                    options={['Black', 'White', 'Silver', 'Grey', 'Navy Blue', 'Blue', 'Red', 'Burgundy', 'Green', 'Yellow', 'Orange', 'Brown', 'Beige', 'Gold', 'Bronze', 'Purple', 'Pink', 'Turquoise', 'Champagne', 'Graphite', 'Copper']}
                    placeholder="Select..." enterLabel="Enter colour..." />
                </div>
                {/* Checkboxes */}
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
            </Section>
          )}

          {/* Ad Details Section */}
          <Section title="Ad Details" icon={<FileText className="w-5 h-5" />}>
            <div className="flex flex-col gap-4">
              <div id="field-title">
                <label className="block text-sm font-medium text-foreground mb-1.5">Ad Title <span className="text-destructive">*</span></label>
                <input type="text" value={form.title} onChange={set('title')}
                  className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${formErrors.title ? 'border-destructive' : 'border-border'}`} />
                {formErrors.title && <p className="text-xs text-destructive mt-1">{formErrors.title}</p>}
              </div>
              <div id="field-description">
                <label className="block text-sm font-medium text-foreground mb-1.5">Description <span className="text-destructive">*</span></label>
                <textarea value={form.description} onChange={set('description')} maxLength={2100} rows={5}
                  className={`w-full border rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${formErrors.description ? 'border-destructive' : 'border-border'}`} />
                {formErrors.description && <p className="text-xs text-destructive mt-1">{formErrors.description}</p>}
              </div>
              <div id="field-price">
                <label className="block text-sm font-medium text-foreground mb-1.5">Price <span className="text-destructive">*</span></label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">{form.currency}</span>
                    <input type="text" value={form.price}
                      onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ''); const formatted = raw ? Number(raw).toLocaleString('en-IE') : ''; setForm((f) => ({ ...f, price: formatted })); }}
                      className={`w-full border rounded-lg px-4 py-3 text-sm pl-7 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${formErrors.price ? 'border-destructive' : 'border-border'}`} />
                  </div>
                  <button type="button" onClick={() => setForm((f) => ({ ...f, currency: f.currency === '€' ? '£' : '€' }))}
                    className="border border-border rounded-lg px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary transition-colors whitespace-nowrap">
                    {form.currency === '€' ? '€ EUR' : '£ GBP'}
                  </button>
                </div>
                {formErrors.price && <p className="text-xs text-destructive mt-1">{formErrors.price}</p>}
              </div>
            </div>
          </Section>

          {/* Contact Details Section */}
          <Section title="Contact Details" icon={<User className="w-5 h-5" />}>
            <div className="flex flex-col gap-4">
              <div id="field-fullName">
                <label className="block text-sm font-medium text-foreground mb-1.5">Full Name <span className="text-destructive">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" value={form.fullName} onChange={set('fullName')}
                    className={`w-full border rounded-lg px-4 py-3 text-sm pl-9 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${formErrors.fullName ? 'border-destructive' : 'border-border'}`} />
                </div>
                {formErrors.fullName && <p className="text-xs text-destructive mt-1">{formErrors.fullName}</p>}
              </div>
              <div id="field-phone">
                <label className="block text-sm font-medium text-foreground mb-1.5">Phone <span className="text-destructive">*</span></label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/[^0-9 +\-()]/g, '') }))}
                    className={`w-full border rounded-lg px-4 py-3 text-sm pl-9 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${formErrors.phone ? 'border-destructive' : 'border-border'}`} />
                </div>
                {formErrors.phone && <p className="text-xs text-destructive mt-1">{formErrors.phone}</p>}
              </div>
              <div id="field-email">
                <label className="block text-sm font-medium text-foreground mb-1.5">E-mail <span className="text-destructive">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="email" value={form.email} onChange={set('email')}
                    className={`w-full border rounded-lg px-4 py-3 text-sm pl-9 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${formErrors.email ? 'border-destructive' : 'border-border'}`} />
                </div>
                {formErrors.email && <p className="text-xs text-destructive mt-1">{formErrors.email}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Location</label>
                  <OtherSelect value={form.county} onChange={(val) => setForm((f) => ({ ...f, county: val, area: '' }))}
                    options={counties} placeholder="Select location..." enterLabel="Enter location..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Area</label>
                  <OtherSelect value={form.area} onChange={(val) => setForm((f) => ({ ...f, area: val }))}
                    options={areas} placeholder="Select area..." enterLabel="Enter area..." />
                </div>
              </div>
              <div className="border border-border rounded-xl p-4 flex items-start gap-3">
                <input type="checkbox" id="trader" checked={form.isTrader} onChange={toggle('isTrader')} className="w-4 h-4 mt-0.5 accent-primary cursor-pointer" />
                <div>
                  <label htmlFor="trader" className="text-sm font-medium cursor-pointer">Yes, I'm a trader</label>
                  <p className="text-xs text-muted-foreground mt-0.5">Generates a VAT receipt</p>
                </div>
              </div>
            </div>
          </Section>

          {/* Save / Cancel */}
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
          <div className="flex gap-3 pb-10">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 bg-primary text-white font-bold py-4 rounded-xl text-base hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button onClick={() => navigate('/my-ads')}
              className="flex-1 border border-foreground text-foreground font-semibold py-4 rounded-xl hover:bg-secondary transition-colors text-base">
              Cancel
            </button>
          </div>
        </div>
      </div>

      {viewerIndex !== null && allPhotoUrls.length > 0 && (
        <ImageViewer
          photos={allPhotoUrls.map(url => ({ preview: url }))}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onSetCover={handleSetCover}
          onRotate={handleRotate}
          onDelete={handleDeleteFromViewer} />
      )}

      <Footer />
    </div>
  );
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
    </div>
  );
}