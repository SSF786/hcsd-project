import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import Header from '../common/Header';
import { complaintsAPI } from '../../services/api';
import { Upload, MapPin, CheckCircle, AlertCircle, Navigation, X } from 'lucide-react';

const TYPES = [
  { id: 'electricity', label: 'Electricity', emoji: '⚡', color: '#F39C12', desc: 'Power outages, streetlights', requiresImage: false, requiresLocation: false },
  { id: 'water', label: 'Water Supply', emoji: '💧', color: '#3498DB', desc: 'Shortage, leaks', requiresImage: false, requiresLocation: false },
  { id: 'roads', label: 'Roads & Infrastructure', emoji: '🛣️', color: '#9B59B6', desc: 'Potholes, damage', requiresImage: true, requiresLocation: true },
  { id: 'drainage', label: 'Drainage & Sewerage', emoji: '🌊', color: '#1AB5A0', desc: 'Blocked drains', requiresImage: false, requiresLocation: false },
  { id: 'garbage', label: 'Garbage Collection', emoji: '🗑️', color: '#2ECC71', desc: 'Waste management', requiresImage: true, requiresLocation: true },
  { id: 'facilities', label: 'Public Facilities', emoji: '🏛️', color: '#E74C3C', desc: 'Parks, community halls', requiresImage: true, requiresLocation: true },
];

export default function RaiseComplaint() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);
  const [form, setForm] = useState({ description: '', priority: 'medium' });
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [location, setLocation] = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);

  const typeConf = TYPES.find(t => t.id === selectedType);

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files);
    setPhotos(files);
    setPhotoPreviews(files.map(f => URL.createObjectURL(f)));
  };
  const removePhoto = (i) => {
    setPhotos(p => p.filter((_, idx) => idx !== i));
    setPhotoPreviews(p => p.filter((_, idx) => idx !== i));
  };

  const getLocation = () => {
    if (!navigator.geolocation) { setLocError('Geolocation is not supported by your browser.'); return; }
    setLocLoading(true); setLocError('');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, address: `${currentUser.area}, Hyderabad` });
        setLocError('');
        setLocLoading(false);
      },
      err => {
        setLocLoading(false);
        if (err.code === 1) {
          setLocError('Location access denied. Please click the 🔒 lock icon in your browser address bar → allow Location → then try again.');
        } else if (err.code === 2) {
          setLocError('Unable to detect your position. Make sure GPS/Wi-Fi is enabled and try again.');
        } else if (err.code === 3) {
          setLocError('Location request timed out. Please check your connection and try again.');
        } else {
          setLocError('Could not get location. Please allow location access and try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.description.trim()) return setError('Please describe the issue');
    if (typeConf?.requiresImage && photos.length === 0) return setError('Please upload at least one photo for this complaint type');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('type', selectedType);
      fd.append('description', form.description);
      fd.append('priority', form.priority);
      photos.forEach(p => fd.append('photos', p));
      if (location) {
        fd.append('locationLat', location.lat);
        fd.append('locationLng', location.lng);
        fd.append('locationAddress', location.address || '');
        fd.append('locationAccuracy', location.accuracy || '');
      }
      const res = await complaintsAPI.create(fd);
      setDone(res.data.complaint.complaintId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit complaint');
    } finally { setLoading(false); }
  };

  if (done) return (
    <>
      <Header title="Raise Complaint" />
      <div className="page-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', animation: 'scaleIn 0.35s ease', maxWidth: 440 }}>
          <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'rgba(46,204,113,0.1)', border: '2px solid rgba(46,204,113,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle size={44} color="#2ECC71" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontWeight: 800, marginBottom: 10, color: '#F0EDE4' }}>Complaint Registered!</h2>
          <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 20, color: '#C9A84C', fontWeight: 700, fontSize: '0.9rem', marginBottom: 14 }}>{done}</div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.7 }}>Your complaint has been submitted. A technician will be assigned within 5 minutes.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-gold" onClick={() => navigate('/user/complaints')}>Track Complaint</button>
            <button className="btn btn-ghost" onClick={() => { setDone(null); setStep(1); setSelectedType(null); setPhotos([]); setPhotoPreviews([]); setLocation(null); setForm({ description: '', priority: 'medium' }); }}>Raise Another</button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <Header title="Raise Complaint" subtitle="Report a civic issue in your area" />
      <div className="page-body animate-fadeIn">
        {/* Steps */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 36, maxWidth: 440 }}>
          {['Select Type', 'Add Details', 'Review'].map((label, i) => {
            const n = i + 1; const active = step === n; const done2 = step > n;
            return (
              <React.Fragment key={label}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: done2 ? '#2ECC71' : active ? 'linear-gradient(135deg,#C9A84C,#8B6914)' : 'rgba(255,255,255,0.05)', border: done2 ? '2px solid #2ECC71' : active ? '2px solid #C9A84C' : '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem', fontWeight: 700, color: done2 || active ? (done2 ? '#fff' : '#040812') : 'var(--text-muted)', transition: 'all 0.25s' }}>
                    {done2 ? '✓' : n}
                  </div>
                  <span style={{ fontSize: '0.68rem', color: active ? '#C9A84C' : 'var(--text-muted)', whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>{label}</span>
                </div>
                {i < 2 && <div style={{ flex: 1, height: 1.5, background: done2 ? '#2ECC71' : 'rgba(255,255,255,0.08)', margin: '0 6px', marginBottom: 20, transition: 'background 0.25s' }} />}
              </React.Fragment>
            );
          })}
        </div>

        {step === 1 && (
          <div className="step-enter">
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem', color: '#F0EDE4', marginBottom: 6 }}>What type of issue are you facing?</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Select the category that best describes your complaint</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              {TYPES.map(t => (
                <button key={t.id} onClick={() => { setSelectedType(t.id); setStep(2); }}
                  style={{ padding: '24px 18px', borderRadius: 18, cursor: 'pointer', background: 'rgba(12,22,48,0.9)', border: `1px solid ${t.color}20`, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14, transition: 'all 0.22s', backdropFilter: 'blur(12px)' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = `${t.color}50`; e.currentTarget.style.boxShadow = `0 16px 40px rgba(0,0,0,0.4), 0 0 0 1px ${t.color}20`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = `${t.color}20`; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: t.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>{t.emoji}</div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: t.color, marginBottom: 4, fontSize: '0.95rem' }}>{t.label}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{t.desc}</div>
                    {(t.requiresImage || t.requiresLocation) && (
                      <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {t.requiresImage && <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 20, background: t.color + '10', color: t.color, fontWeight: 600 }}>📷 Photo req.</span>}
                        {t.requiresLocation && <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 20, background: t.color + '10', color: t.color, fontWeight: 600 }}>📍 Location req.</span>}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && typeConf && (
          <div className="step-enter" style={{ maxWidth: 680 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28, padding: '16px 20px', borderRadius: 14, background: typeConf.color + '08', border: `1px solid ${typeConf.color}25` }}>
              <span style={{ fontSize: '2rem' }}>{typeConf.emoji}</span>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: typeConf.color, fontSize: '1rem' }}>{typeConf.label}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fill in the details below to submit your complaint</div>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {/* Location alert */}
              <div className="alert alert-gold" style={{ fontSize: '0.82rem' }}>
                <MapPin size={14} /> Complaint will be registered for <strong style={{ color: '#C9A84C' }}>{currentUser.area}</strong> ({currentUser.pincode})
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Issue Description <span style={{ color: '#E74C3C' }}>*</span></label>
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Describe the issue clearly — where exactly, how long, impact on residents..." rows={5} required style={{ resize: 'vertical', minHeight: 110 }} />
              </div>

              {/* Priority */}
              <div className="form-group">
                <label className="form-label">Priority Level</label>
                <select value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value}))}>
                  <option value="low">Low — Minor inconvenience</option>
                  <option value="medium">Medium — Affects daily routine</option>
                  <option value="high">High — Significant impact</option>
                  <option value="urgent">Urgent — Safety hazard</option>
                </select>
              </div>

              {/* Real-time Location */}
              <div className="form-group">
                <label className="form-label">
                  GPS Location {typeConf.requiresLocation && <span style={{ color: '#E74C3C' }}>*</span>}
                </label>
                {location ? (
                  <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Navigation size={18} color="#2ECC71" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.82rem', color: '#2ECC71', fontWeight: 600 }}>✓ Location Captured</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {location.lat.toFixed(6)}, {location.lng.toFixed(6)} · Accuracy: ±{Math.round(location.accuracy || 0)}m
                        </div>
                      </div>
                      <button type="button" onClick={() => setLocation(null)} style={{ color: 'var(--text-muted)', cursor: 'pointer' }}><X size={14} /></button>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${location.lat},${location.lng}&z=17`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: '0.76rem', color: '#1AB5A0', fontWeight: 600, textDecoration: 'none', padding: '5px 10px', borderRadius: 8, background: 'rgba(26,181,160,0.1)', border: '1px solid rgba(26,181,160,0.2)', transition: 'all 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(26,181,160,0.18)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(26,181,160,0.1)'}>
                      🗺️ Verify on Google Maps
                    </a>
                  </div>
                ) : (
                  <button type="button" onClick={getLocation} disabled={locLoading}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 12, background: 'rgba(26,181,160,0.08)', border: '1px dashed rgba(26,181,160,0.3)', color: '#1AB5A0', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, transition: 'all 0.2s', width: '100%', justifyContent: 'center' }}>
                    {locLoading ? <span className="spinner" style={{ borderTopColor: '#1AB5A0' }} /> : <Navigation size={16} />}
                    {locLoading ? 'Getting your location...' : 'Capture My Current Location'}
                  </button>
                )}
                {locError && <div className="form-error"><AlertCircle size={12} /> {locError}</div>}
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>Your location helps technicians reach the exact spot faster. Requires browser location permission.</p>
              </div>

              {/* Photo Upload */}
              <div className="form-group">
                <label className="form-label">
                  Upload Photos {typeConf.requiresImage && <span style={{ color: '#E74C3C' }}>*</span>}
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', marginLeft: 6 }}>(max 5, JPG/PNG/WEBP)</span>
                </label>
                <div style={{ border: `2px dashed ${photos.length > 0 ? '#2ECC71' : 'rgba(201,168,76,0.25)'}`, borderRadius: 14, padding: '22px', textAlign: 'center', background: photos.length > 0 ? 'rgba(46,204,113,0.04)' : 'rgba(201,168,76,0.02)', cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}>
                  <input type="file" accept="image/*" multiple onChange={handlePhotos} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
                  <Upload size={28} color={photos.length > 0 ? '#2ECC71' : 'var(--text-muted)'} style={{ marginBottom: 8 }} />
                  <p style={{ fontSize: '0.875rem', color: photos.length > 0 ? '#2ECC71' : 'var(--text-secondary)' }}>
                    {photos.length > 0 ? `${photos.length} photo(s) selected` : 'Click or drag to upload photos'}
                  </p>
                </div>
                {photoPreviews.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8, marginTop: 10 }}>
                    {photoPreviews.map((url, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <div className="photo-thumb" style={{ height: 100 }}>
                          <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <button type="button" onClick={() => removePhoto(i)} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', fontSize: '0.7rem' }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && <div className="alert alert-error"><AlertCircle size={14} /> {error}</div>}

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
                <button type="submit" className="btn btn-gold" disabled={loading} style={{ flex: 1, justifyContent: 'center', padding: '13px' }}>
                  {loading ? <span className="spinner" style={{ borderTopColor: '#040812' }} /> : 'Submit Complaint'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
