import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronRight, Shield, Heart, Flame, Building2, CheckCircle, Clock, Users, Star } from 'lucide-react';

const SERVICES = [
  { label: 'Electricity',      desc: 'Power outages, street lights, transformer faults', color: '#F39C12', emoji: '⚡' },
  { label: 'Water Supply',     desc: 'Shortage, pipe leaks, quality issues',             color: '#3498DB', emoji: '💧' },
  { label: 'Roads',            desc: 'Potholes, damaged roads, footpaths',               color: '#9B59B6', emoji: '🛣️' },
  { label: 'Drainage',         desc: 'Blocked drains, sewage overflow',                  color: '#1AB5A0', emoji: '🌊' },
  { label: 'Garbage',          desc: 'Waste collection, sanitation',                     color: '#2ECC71', emoji: '🗑️' },
  { label: 'Public Facilities', desc: 'Parks, community halls, amenities',              color: '#E74C3C', emoji: '🏛️' },
];

// Stat targets — numeric extraction for counting animation
const STATS = [
  { raw: 12400, suffix: '+', label: 'Complaints Resolved', icon: CheckCircle, color: '#2ECC71', display: '12,400+' },
  { raw: null,  prefix: '< ', suffix: 'hrs', numVal: 4, label: 'Avg Response Time', icon: Clock, color: '#F39C12', display: '< 4hrs' },
  { raw: 98.2,  suffix: '%',  label: 'Satisfaction Rate',  icon: Star,         color: '#C9A84C', display: '98.2%', decimal: 1 },
  { raw: 340,   suffix: '+',  label: 'Field Technicians',  icon: Users,        color: '#1AB5A0', display: '340+' },
];

const EMERGENCY = [
  { icon: Shield, label: 'Police',       color: '#3498DB', desc: 'Crime, assault, law & order' },
  { icon: Heart,  label: 'Ambulance',    color: '#E74C3C', desc: 'Medical emergencies, accidents' },
  { icon: Flame,  label: 'Fire Brigade', color: '#E67E22', desc: 'Fire, gas leaks, hazards' },
];

function useW() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => { const f = () => setW(window.innerWidth); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, []);
  return w;
}

// Intersection observer hook — fires only when element enters viewport
function useInView(threshold = 0.25) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// Speedometer counter — counts from 0 to target fast with easing
function SpeedCounter({ stat, started }) {
  const [val, setVal] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!started) return;
    const target = stat.raw ?? stat.numVal;
    if (target == null) return;
    const duration = 1400; // ms
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Speedometer easing: fast start, slight deceleration at end
      const eased = progress < 0.7
        ? (progress / 0.7) * 0.85           // fast phase
        : 0.85 + ((progress - 0.7) / 0.3) * 0.15; // slow-down phase
      const current = eased * target;
      const decimals = stat.decimal || 0;
      setVal(parseFloat(current.toFixed(decimals)));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
      else setVal(target);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [started, stat]);

  const target = stat.raw ?? stat.numVal;
  if (target == null) return <>{stat.display}</>;

  const formatted = stat.decimal
    ? val.toFixed(stat.decimal)
    : val >= 1000 ? Math.round(val).toLocaleString() : Math.round(val).toString();

  return <>{stat.prefix || ''}{formatted}{stat.suffix}</>;
}

function StatCard({ stat, idx }) {
  const [ref, inView] = useInView(0.2);
  const Icon = stat.icon;
  return (
    <div ref={ref} style={{
      padding: '28px 20px',
      background: 'rgba(12,22,48,0.92)',
      border: `1px solid ${stat.color}25`,
      borderRadius: 18,
      textAlign: 'center',
      backdropFilter: 'blur(16px)',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.25s, box-shadow 0.25s',
      animation: inView ? `slideInUp 0.55s cubic-bezier(0.34,1.1,0.64,1) ${idx * 0.1}s both` : 'none',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = `0 20px 48px rgba(0,0,0,0.5), 0 0 0 1px ${stat.color}30`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
      {/* Top color bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${stat.color}, transparent)` }} />
      {/* Glow bg */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${stat.color}08, transparent 70%)`, pointerEvents: 'none' }} />

      <div style={{ width: 48, height: 48, borderRadius: 14, background: stat.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', transition: 'transform 0.3s' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'rotate(-10deg) scale(1.15)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
        <Icon size={22} color={stat.color} />
      </div>

      <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 900, color: stat.color, lineHeight: 1, letterSpacing: '-0.02em' }}>
        <SpeedCounter stat={stat} started={inView} />
      </div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>{stat.label}</div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const w = useW();

  const [mapRef, mapInView] = useInView(0.15);
  const [servRef, servInView] = useInView(0.1);
  const [emgRef, emgInView] = useInView(0.1);

  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const px    = w < 480 ? '16px' : w < 768 ? '20px' : w < 1024 ? '36px' : '64px';
  const cols4 = w < 480 ? '1fr 1fr' : w < 768 ? '1fr 1fr' : 'repeat(4,1fr)';
  const cols3 = w < 640 ? '1fr' : w < 1024 ? '1fr 1fr' : 'repeat(3,1fr)';
  const isSm  = w < 640;

  return (
    <div style={{ background: '#040812', minHeight: '100vh', fontFamily: 'var(--font-body)', color: '#F0EDE4', position: 'relative', overflow: 'hidden' }}>

      {/* Ambient background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: 800, height: 800, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.015, backgroundImage: 'linear-gradient(rgba(201,168,76,1) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,1) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
      </div>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `0 ${px}`,
        background: scrollY > 50 ? 'rgba(4,8,18,0.96)' : 'transparent',
        backdropFilter: scrollY > 50 ? 'blur(20px)' : 'none',
        borderBottom: scrollY > 50 ? '1px solid rgba(201,168,76,0.12)' : '1px solid transparent',
        transition: 'all 0.3s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #C9A84C, #8B6914)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Building2 size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: '#F0EDE4' }}>GHMC</div>
            {!isSm && <div style={{ fontSize: '0.58rem', color: 'rgba(201,168,76,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Civic Support Desk</div>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => navigate('/login')} style={{ padding: isSm ? '7px 14px' : '8px 22px', fontSize: isSm ? '0.8rem' : undefined }}>Sign In</button>
          <button className="btn btn-gold" onClick={() => navigate('/register')} style={{ padding: isSm ? '7px 14px' : '8px 22px', fontSize: isSm ? '0.8rem' : undefined }}>
            {isSm ? 'Register' : 'Register Free'} {!isSm && <ArrowRight size={14} />}
          </button>
        </div>
      </nav>

      {/* ── Hero — Charminar background ── */}
      <section style={{
        position: 'relative', zIndex: 1, minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: `${isSm ? '100px' : '120px'} ${px} 80px`,
      }}>
        {/* Charminar background image */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'url(/charminar.png)',
          backgroundSize: 'cover', backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
        }} />
        {/* Dark overlay gradient — keeps text readable */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(180deg, rgba(4,8,18,0.65) 0%, rgba(4,8,18,0.55) 40%, rgba(4,8,18,0.80) 80%, rgba(4,8,18,1) 100%)',
        }} />

        <div style={{ maxWidth: 860, animation: 'fadeIn 1.2s ease', width: '100%', position: 'relative', zIndex: 2 }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 40, padding: '7px 18px', marginBottom: 32, fontSize: '0.76rem', color: '#D4B86A', fontWeight: 600, letterSpacing: '0.05em', backdropFilter: 'blur(8px)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#C9A84C', animation: 'pulse 2s infinite', flexShrink: 0 }} />
            Hyderabad Citizen Support — Platform
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem, 7vw, 5.5rem)', fontWeight: 900, lineHeight: 1.04, letterSpacing: '-0.03em', marginBottom: 24, textShadow: '0 4px 32px rgba(0,0,0,0.6)' }}>
            <span style={{ color: '#F0EDE4' }}>Hyderabad</span>
            <br />
            <span style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #E0CC8F 50%, #C9A84C 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Civic Support Desk</span>
          </h1>

          <p style={{ fontSize: isSm ? '0.95rem' : '1.08rem', color: 'rgba(240,237,228,0.85)', lineHeight: 1.8, maxWidth: 600, margin: '0 auto 40px', textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
            Report civic issues, trigger emergency services, and track resolutions — all through one intelligent platform designed for every citizen of Hyderabad.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-gold btn-lg" onClick={() => navigate('/register')} style={{ boxShadow: '0 8px 32px rgba(201,168,76,0.35)' }}>
              Get Started — It's Free <ChevronRight size={16} />
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => navigate('/login')} style={{ backdropFilter: 'blur(8px)', background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.2)' }}>
              Sign In to Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats — speedometer counters triggered on scroll ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: `0 ${px} 90px`, maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: cols4, gap: 18 }}>
          {STATS.map((s, i) => <StatCard key={s.label} stat={s} idx={i} />)}
        </div>
      </section>

      {/* ── Services ── */}
      <section ref={servRef} style={{ position: 'relative', zIndex: 1, padding: `0 ${px} 90px`, maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 12 }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.3))' }} />
            <div style={{ fontSize: '0.68rem', color: '#C9A84C', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, whiteSpace: 'nowrap' }}>Our Services</div>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(201,168,76,0.3), transparent)' }} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 4vw, 2.6rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>Civic Services We Cover</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 10, fontSize: '0.95rem' }}>From daily inconveniences to full emergencies — we handle them all</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: cols3, gap: 16 }}>
          {SERVICES.map((svc, si) => (
            <div key={svc.label} style={{ padding: '22px', background: 'rgba(12,22,48,0.9)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, display: 'flex', gap: 16, alignItems: 'flex-start', backdropFilter: 'blur(12px)', transition: 'all 0.25s', animation: servInView ? `slideInUp 0.45s cubic-bezier(0.34,1.1,0.64,1) ${0.05 + si * 0.07}s both` : 'none' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${svc.color}30`; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px ${svc.color}15`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: svc.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>{svc.emoji}</div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: svc.color, marginBottom: 5 }}>{svc.label}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>{svc.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Emergency ── */}
      <section ref={emgRef} style={{ position: 'relative', zIndex: 1, padding: `0 ${px} 90px`, maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ padding: isSm ? '32px 20px' : '52px', background: 'linear-gradient(135deg, rgba(192,57,43,0.08) 0%, rgba(12,22,48,0.95) 50%, rgba(192,57,43,0.06) 100%)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: 22, backdropFilter: 'blur(12px)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(231,76,60,0.5), transparent)' }} />
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem, 4vw, 2.2rem)', fontWeight: 800 }}>🚨 Emergency Response System</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: '0.9rem' }}>One tap — instantly dispatched to all available responders</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: cols3, gap: 16 }}>
            {EMERGENCY.map((em, ei) => {
              const Icon = em.icon;
              return (
                <div key={em.label} style={{ textAlign: 'center', padding: isSm ? '22px 14px' : '30px 18px', background: em.color + '08', border: `1px solid ${em.color}20`, borderRadius: 16, animation: emgInView ? `bounceIn 0.5s cubic-bezier(0.34,1.56,0.64,1) ${0.1 + ei * 0.12}s both` : 'none', transition: 'transform 0.22s, box-shadow 0.22s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = `0 16px 40px ${em.color}25`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: em.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: `0 0 0 10px ${em.color}08` }}>
                    <Icon size={26} color={em.color} />
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', marginBottom: 5 }}>{em.label}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>{em.desc}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: '0.72rem', color: em.color, fontWeight: 700 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: em.color, animation: 'pulse 1.5s infinite' }} />
                    24/7 Active
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── GHMC Map ── */}
      <section ref={mapRef} style={{ position: 'relative', zIndex: 1, padding: `0 ${px} 90px`, maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 12 }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.3))' }} />
            <div style={{ fontSize: '0.68rem', color: '#C9A84C', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, whiteSpace: 'nowrap' }}>Coverage Area</div>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(201,168,76,0.3), transparent)' }} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>GHMC Zones & Circles</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 10, fontSize: '0.95rem' }}>Serving all 150 wards across Greater Hyderabad Municipal Corporation</p>
        </div>

        <div style={{
          borderRadius: 20, overflow: 'hidden',
          border: '1px solid rgba(201,168,76,0.2)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.08)',
          animation: mapInView ? 'slideInUp 0.6s cubic-bezier(0.34,1.1,0.64,1) 0.1s both' : 'none',
          position: 'relative',
        }}>
          {/* Top gold bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)', zIndex: 2 }} />
          <img
            src="/ghmc-map.png"
            alt="GHMC Zones, Circles & Wards Map"
            style={{ width: '100%', height: 'auto', display: 'block', maxHeight: isSm ? '60vw' : 640, objectFit: 'cover', objectPosition: 'center' }}
          />
          {/* Overlay with zone stats */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(0deg, rgba(4,8,18,0.95) 0%, rgba(4,8,18,0.6) 60%, transparent 100%)', padding: isSm ? '20px 16px' : '28px 32px', zIndex: 2 }}>
            <div style={{ display: 'flex', gap: isSm ? 16 : 32, flexWrap: 'wrap' }}>
              {[
                { label: 'Zones', value: '4', color: '#C9A84C' },
                { label: 'Circles', value: '16', color: '#1AB5A0' },
                { label: 'Wards', value: '150', color: '#9B59B6' },
                { label: 'Area (km²)', value: '650+', color: '#E74C3C' },
              ].map(z => (
                <div key={z.label}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: isSm ? '1.4rem' : '2rem', fontWeight: 800, color: z.color, lineHeight: 1 }}>{z.value}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{z.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: `60px ${px}`, textAlign: 'center', borderTop: '1px solid rgba(201,168,76,0.1)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(201,168,76,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12, position: 'relative' }}>Ready to Report an Issue?</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: '0.95rem', position: 'relative' }}>Join thousands of Hyderabad citizens using GHMC Civic Support Desk</p>
        <button className="btn btn-gold btn-lg" onClick={() => navigate('/register')} style={{ position: 'relative', boxShadow: '0 8px 32px rgba(201,168,76,0.3)' }}>
          Register Now — It's Free <ArrowRight size={16} />
        </button>
      </section>

      <footer style={{ position: 'relative', zIndex: 1, padding: `20px ${px}`, borderTop: '1px solid rgba(201,168,76,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, color: 'var(--text-muted)', fontSize: '0.76rem' }}>
        <span>© 2025 GHMC Civic Support Desk, Hyderabad</span>
        <span>Built for citizens of Hyderabad</span>
      </footer>
    </div>
  );
}
