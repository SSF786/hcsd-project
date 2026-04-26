import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { authAPI } from '../services/api';
import { Building2, ArrowLeft, Eye, EyeOff, Lock, User, MapPin, Search, Mail, KeyRound, CheckCircle2, X } from 'lucide-react';

const ROLE_ROUTES = { admin: '/admin', moderator: '/moderator', technician: '/technician', police: '/emergency', ambulance: '/emergency', fire: '/emergency', user: '/user' };

const HYD_AREAS = [
  { name: "Banjara Hills", pincode: "500034" }, { name: "Jubilee Hills", pincode: "500033" }, { name: "Gachibowli", pincode: "500032" }, { name: "Hitech City", pincode: "500081" }, { name: "Madhapur", pincode: "500081" }, { name: "Kukatpally", pincode: "500072" }, { name: "Ameerpet", pincode: "500016" }, { name: "Begumpet", pincode: "500003" }, { name: "Secunderabad", pincode: "500003" }, { name: "Dilsukhnagar", pincode: "500060" }, { name: "Abids", pincode: "500001" }, { name: "Charminar", pincode: "500002" }, { name: "Ecil", pincode: "500062" }, { name: "Miyapur", pincode: "500049" }, { name: "Nizampet", pincode: "500090" }, { name: "LB Nagar", pincode: "500074" }, { name: "Uppal", pincode: "500039" }, { name: "Nagole", pincode: "500068" }, { name: "Tarnaka", pincode: "500017" }, { name: "Habsiguda", pincode: "500007" }, { name: "Maredpally", pincode: "500026" }, { name: "Somajiguda", pincode: "500082" }, { name: "Mehdipatnam", pincode: "500028" }, { name: "Tolichowki", pincode: "500008" }, { name: "Manikonda", pincode: "500089" }, { name: "Attapur", pincode: "500048" }, { name: "Rajendranagar", pincode: "500052" }, { name: "Shamshabad", pincode: "501218" }, { name: "Hayathnagar", pincode: "501505" }, { name: "Vanasthalipuram", pincode: "500070" }, { name: "Saroornagar", pincode: "500035" }, { name: "Malakpet", pincode: "500036" }, { name: "Narayanguda", pincode: "500029" }, { name: "Musheerabad", pincode: "500020" }, { name: "Bowenpally", pincode: "500011" }, { name: "Karkhana", pincode: "500015" }, { name: "Ramanthapur", pincode: "500013" }, { name: "SR Nagar", pincode: "500038" }, { name: "Boduppal", pincode: "500092" }, { name: "Chintal", pincode: "500054" }, { name: "Moosapet", pincode: "500018" }, { name: "Nampally", pincode: "500001" }, { name: "Kothapet", pincode: "500035" }, { name: "Pragathi Nagar", pincode: "500090" }, { name: "Yellareddyguda", pincode: "500073" }, { name: "Patancheru", pincode: "502319" },
];

const AuthCard = ({ children, title, subtitle }) => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#040812', padding: '40px 20px', position: 'relative' }}>
    <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
    <div style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1, animation: 'slideInUp 0.5s cubic-bezier(0.34,1.1,0.64,1) both' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #C9A84C, #8B6914)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 32px rgba(201,168,76,0.3)' }}>
          <Building2 size={28} color="#fff" />
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontWeight: 700, color: '#F0EDE4', marginBottom: 6 }}>{title}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{subtitle}</p>
        <div style={{ width: 48, height: 2, background: 'linear-gradient(90deg, #C9A84C, #8B6914)', borderRadius: 1, margin: '16px auto 0' }} />
      </div>
      <div className="auth-card-inner" style={{ background: 'rgba(12,22,48,0.95)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 20, padding: '36px 32px', backdropFilter: 'blur(20px)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent)' }} />
        {children}
      </div>
    </div>
  </div>
);

/* ── Forgot Password Modal ── */
function ForgotPasswordModal({ onClose }) {
  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=newpw, 4=done
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [serverOtp, setServerOtp] = useState(''); // returned by server for demo
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.includes('@')) return setError('Please enter a valid email address');
    setLoading(true);
    try {
      const res = await authAPI.forgotPassword(email);
      // Server returns otp in response for demo (remove in production & use email)
      setServerOtp(res.data.otp || '');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Check the email address.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.verifyOtp(email, otp);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPw.length < 6) return setError('Password must be at least 6 characters');
    if (newPw !== confirmPw) return setError('Passwords do not match');
    setLoading(true);
    try {
      await authAPI.resetPassword(email, otp, newPw);
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setError(''); setOtp('');
    try {
      const res = await authAPI.forgotPassword(email);
      setServerOtp(res.data.otp || '');
    } catch (err) {
      setError('Failed to resend OTP.');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,8,18,0.88)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(6px)' }}>
      <div style={{ width: '100%', maxWidth: 420, background: 'rgba(12,22,48,0.98)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 20, padding: '36px 32px', boxShadow: '0 24px 72px rgba(0,0,0,0.6)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent)' }} />
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}><X size={18} /></button>

        {step < 4 && (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#C9A84C,#8B6914)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <KeyRound size={22} color="#fff" />
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 700, color: '#F0EDE4', marginBottom: 4 }}>Reset Password</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                {step === 1 && 'Enter your registered email to receive a reset OTP'}
                {step === 2 && `OTP sent to ${email}. Enter the 6-digit code.`}
                {step === 3 && 'Set your new password'}
              </p>
              {/* Step dots */}
              <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
                {[1,2,3].map(s => (
                  <div key={s} style={{ height: 3, flex: 1, borderRadius: 2, background: step >= s ? '#C9A84C' : 'rgba(255,255,255,0.08)', transition: 'background 0.3s' }} />
                ))}
              </div>
            </div>

            {step === 1 && (
              <form onSubmit={sendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required style={{ paddingLeft: 38 }} />
                  </div>
                </div>
                {error && <div className="alert alert-error" style={{ fontSize: '0.8rem' }}>{error}</div>}
                <button type="submit" className="btn btn-gold" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                  {loading ? <span className="spinner" style={{ borderTopColor: '#040812' }} /> : 'Send OTP'}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={verifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {serverOtp && (
                  <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', fontSize: '0.78rem', color: '#C9A84C' }}>
                    <strong>Demo OTP:</strong> {serverOtp} <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>(in production this is emailed)</span>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">6-Digit OTP</label>
                  <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="Enter OTP" required maxLength={6}
                    style={{ textAlign: 'center', letterSpacing: '0.35em', fontSize: '1.2rem', fontWeight: 700 }} />
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>
                    Didn't receive? <button type="button" onClick={resendOtp} style={{ color: '#C9A84C', cursor: 'pointer', fontWeight: 600 }}>Resend OTP</button>
                  </p>
                </div>
                {error && <div className="alert alert-error" style={{ fontSize: '0.8rem' }}>{error}</div>}
                <button type="submit" className="btn btn-gold" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                  {loading ? <span className="spinner" style={{ borderTopColor: '#040812' }} /> : 'Verify OTP'}
                </button>
                <button type="button" onClick={() => { setStep(1); setOtp(''); setError(''); }} style={{ color: 'var(--text-muted)', fontSize: '0.82rem', cursor: 'pointer', textAlign: 'center' }}>← Change email</button>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={resetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type={showPw ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min 6 characters" required style={{ paddingLeft: 38, paddingRight: 42 }} />
                    <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat password" required style={{ paddingLeft: 38 }} />
                  </div>
                </div>
                {error && <div className="alert alert-error" style={{ fontSize: '0.8rem' }}>{error}</div>}
                <button type="submit" className="btn btn-gold" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                  {loading ? <span className="spinner" style={{ borderTopColor: '#040812' }} /> : 'Reset Password'}
                </button>
              </form>
            )}
          </>
        )}

        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(46,204,113,0.1)', border: '2px solid rgba(46,204,113,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle2 size={36} color="#2ECC71" />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: '#F0EDE4', marginBottom: 8 }}>Password Reset!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 24 }}>Your password has been updated. You can now sign in with your new password.</p>
            <button onClick={onClose} className="btn btn-gold" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>Back to Sign In</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function LoginPage() {
  const { login, setCurrentUser } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ userId: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState('');
  const [showForgot, setShowForgot] = useState(false);

  const DEMOS = [
    { label: 'Admin',      userId: 'Admin',         password: 'Admin007',   color: '#C9A84C' },
    { label: 'Citizen',    userId: 'citizen_kavya', password: 'User@123',   color: '#2ECC71' },
    { label: 'Technician', userId: 'tech_suresh',   password: 'Tech@123',   color: '#1AB5A0' },
    { label: 'Police',     userId: 'police_arjun',  password: 'Police@123', color: '#3498DB' },
    { label: 'Moderator',  userId: 'mod_rajesh',    password: 'Mod@123',    color: '#9B59B6' },
    { label: 'Ambulance',  userId: 'amb_meena',     password: 'Amb@123',    color: '#E74C3C' },
  ];

  // Offline mock users — used as fallback when server isn't seeded yet
  const MOCK_USERS = {
    'Admin':         { _id: 'mock_admin',   userId: 'Admin',         name: 'System Administrator', email: 'Admin007@gmail.com',  role: 'admin',      area: 'Somajiguda',    pincode: '500082', phone: '9000000000', isActive: true, isOnDuty: true,  isAvailable: true,  jobsAccepted: 0,  jobsCompleted: 0,  hoursWorked: 0 },
    'citizen_kavya': { _id: 'mock_kavya',   userId: 'citizen_kavya', name: 'Kavya Reddy',          email: 'kavya@gmail.com',    role: 'user',       area: 'Jubilee Hills', pincode: '500033', phone: '9600000001', isActive: true, isOnDuty: false, isAvailable: false, jobsAccepted: 0,  jobsCompleted: 0,  hoursWorked: 0 },
    'tech_suresh':   { _id: 'mock_suresh',  userId: 'tech_suresh',   name: 'Suresh Babu',          email: 'suresh@ghmc.gov.in', role: 'technician', area: 'Banjara Hills', pincode: '500034', phone: '9200000001', isActive: true, isOnDuty: true,  isAvailable: true,  jobsAccepted: 24, jobsCompleted: 22, hoursWorked: 186 },
    'police_arjun':  { _id: 'mock_arjun',   userId: 'police_arjun',  name: 'Arjun Singh',          email: 'arjun@police.gov.in',role: 'police',     area: 'Secunderabad',  pincode: '500003', phone: '9300000001', isActive: true, isOnDuty: true,  isAvailable: true,  jobsAccepted: 10, jobsCompleted: 9,  hoursWorked: 80 },
    'mod_rajesh':    { _id: 'mock_rajesh',  userId: 'mod_rajesh',    name: 'Rajesh Kumar',         email: 'rajesh@ghmc.gov.in', role: 'moderator',  area: 'Ameerpet',      pincode: '500016', phone: '9100000001', isActive: true, isOnDuty: true,  isAvailable: true,  jobsAccepted: 0,  jobsCompleted: 0,  hoursWorked: 0 },
    'amb_meena':     { _id: 'mock_meena',   userId: 'amb_meena',     name: 'Meena Sharma',         email: 'meena@ghmc.gov.in',  role: 'ambulance',  area: 'Begumpet',      pincode: '500003', phone: '9400000001', isActive: true, isOnDuty: true,  isAvailable: true,  jobsAccepted: 8,  jobsCompleted: 7,  hoursWorked: 60 },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const res = await login(form.userId, form.password);
    setLoading(false);
    if (res.success) navigate(ROLE_ROUTES[res.user.role] || '/user');
    else setError(res.error);
  };

  const handleDemoLogin = async (d) => {
    setError(''); setDemoLoading(d.label);
    setForm({ userId: d.userId, password: d.password });
    const res = await login(d.userId, d.password);
    if (res.success) {
      setDemoLoading('');
      navigate(ROLE_ROUTES[res.user.role] || '/user');
    } else {
      // Server not seeded — fall back to mock user so demo still works
      const mockUser = MOCK_USERS[d.userId];
      if (mockUser) {
        localStorage.setItem('ghmc_token', 'demo_token_' + d.userId);
        localStorage.setItem('ghmc_user', JSON.stringify(mockUser));
        setCurrentUser(mockUser);
        setDemoLoading('');
        navigate(ROLE_ROUTES[mockUser.role] || '/user');
      } else {
        setDemoLoading('');
        setError('Demo login failed. Please ensure the server is running and seeded (npm run seed).');
      }
    }
  };

  return (
    <>
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
      <AuthCard title="Welcome Back" subtitle="Sign in to GHMC Civic Support Desk">
        <div style={{ marginBottom: 22 }}>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Quick Demo Access</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7 }}>
            {DEMOS.map(d => (
              <button key={d.label} onClick={() => handleDemoLogin(d)} disabled={!!demoLoading}
                style={{ padding: '7px 4px', borderRadius: 8, cursor: demoLoading ? 'not-allowed' : 'pointer', background: demoLoading === d.label ? d.color + '25' : d.color + '10', border: `1px solid ${d.color}${demoLoading === d.label ? '50' : '25'}`, color: d.color, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.02em', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 34 }}
                onMouseEnter={e => { if (!demoLoading) e.currentTarget.style.background = d.color + '20'; }}
                onMouseLeave={e => { if (!demoLoading) e.currentTarget.style.background = d.color + '10'; }}>
                {demoLoading === d.label ? <span className="spinner" style={{ borderTopColor: d.color, width: 12, height: 12 }} /> : d.label}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '0.63rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 7 }}>Click any role to instantly sign in as that user</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>or enter credentials</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Username or Email</label>
            <div style={{ position: 'relative' }}>
              <User size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input value={form.userId} onChange={e => setForm(f => ({...f, userId: e.target.value}))} placeholder="Enter username or email" required style={{ paddingLeft: 38 }} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Password
              <button type="button" onClick={() => setShowForgot(true)} style={{ color: '#C9A84C', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', textTransform: 'none', letterSpacing: 0 }}>
                Forgot Password?
              </button>
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} placeholder="Enter password" required style={{ paddingLeft: 38, paddingRight: 42 }} />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer' }}>
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          {error && <div className="alert alert-error" style={{ fontSize: '0.82rem' }}>{error}</div>}
          <button type="submit" className="btn btn-gold" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '13px', marginTop: 4, fontSize: '0.925rem' }}>
            {loading ? <span className="spinner" style={{ borderTopColor: '#040812' }} /> : 'Sign In'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          New citizen?{' '}
          <button onClick={() => navigate('/register')} style={{ color: '#C9A84C', fontWeight: 600, cursor: 'pointer' }}>Create Account</button>
        </p>
      </AuthCard>
    </>
  );
}

export function RegisterPage() {
  const { register } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', userId: '', email: '', password: '', confirmPassword: '', phone: '', address: '', area: '', pincode: '' });
  const [areaSearch, setAreaSearch] = useState('');
  const [showDrop, setShowDrop] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const filtered = HYD_AREAS.filter(a => a.name.toLowerCase().includes(areaSearch.toLowerCase())).slice(0, 7);
  const set = k => e => setForm(f => ({...f, [k]: e.target.value}));

  const selectArea = (a) => { setForm(f => ({...f, area: a.name, pincode: a.pincode})); setAreaSearch(a.name); setShowDrop(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    if (!form.area || !HYD_AREAS.find(a => a.name === form.area)) return setError('Please select a valid Hyderabad area from the list');
    setLoading(true);
    const res = await register({ name: form.name, userId: form.userId, email: form.email, password: form.password, phone: form.phone, address: form.address, area: form.area, pincode: form.pincode });
    setLoading(false);
    if (res.success) { setSuccess(true); setTimeout(() => navigate('/login'), 2500); }
    else setError(res.error);
  };

  if (success) return (
    <div style={{ minHeight: '100vh', background: '#040812', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', animation: 'scaleIn 0.35s ease' }}>
        <div style={{ fontSize: '5rem', marginBottom: 16 }}>✅</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: '#F0EDE4', marginBottom: 8 }}>Account Created!</h2>
        <p style={{ color: 'var(--text-muted)' }}>Redirecting to login...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#040812', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ width: '100%', maxWidth: 580, position: 'relative', zIndex: 1, animation: 'slideInUp 0.5s cubic-bezier(0.34,1.1,0.64,1) both' }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 24, cursor: 'pointer', transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#F0EDE4'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
          <ArrowLeft size={15} /> Back to Home
        </button>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #C9A84C, #8B6914)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 8px 28px rgba(201,168,76,0.3)' }}>
            <Building2 size={26} color="#fff" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: '#F0EDE4', marginBottom: 4 }}>Create Your Account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Join GHMC Civic Support Desk — free for all Hyderabad citizens</p>
        </div>
        <div className="auth-card-inner" style={{ background: 'rgba(12,22,48,0.95)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 22, padding: '36px 32px', backdropFilter: 'blur(20px)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent)' }} />
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input value={form.name} onChange={set('name')} placeholder="Your full name" required />
              </div>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input value={form.userId} onChange={set('userId')} placeholder="Unique username" required pattern="[a-zA-Z0-9_]+" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="your@email.com" required />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="Min 6 characters" required style={{ paddingRight: 40 }} />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Repeat password" required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input type="tel" value={form.phone} onChange={set('phone')} placeholder="10-digit mobile number" required pattern="[0-9]{10}" />
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input value={form.address} onChange={set('address')} placeholder="House/Flat No., Street, Landmark" required />
            </div>
            <div className="form-grid">
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">Area (Hyderabad)</label>
                <div style={{ position: 'relative' }}>
                  <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input value={areaSearch} onChange={e => { setAreaSearch(e.target.value); setShowDrop(true); setForm(f => ({...f, area: '', pincode: ''})); }} onFocus={() => setShowDrop(true)} placeholder="Search area..." required style={{ paddingLeft: 34 }} />
                </div>
                {showDrop && filtered.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 300, background: '#0c1630', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 10, boxShadow: '0 12px 40px rgba(0,0,0,0.5)', marginTop: 4, maxHeight: 200, overflowY: 'auto' }}>
                    {filtered.map(a => (
                      <div key={a.name} onClick={() => selectArea(a)} style={{ padding: '9px 14px', cursor: 'pointer', fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <span><MapPin size={11} style={{ marginRight: 6, color: 'var(--text-muted)' }} />{a.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.pincode}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Pincode</label>
                <input value={form.pincode} readOnly placeholder="Auto-filled" style={{ background: 'rgba(255,255,255,0.02)', cursor: 'not-allowed', color: '#C9A84C' }} />
              </div>
            </div>
            {error && <div className="alert alert-error" style={{ fontSize: '0.82rem' }}>{error}</div>}
            <button type="submit" className="btn btn-gold" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '13px', marginTop: 4, fontSize: '0.925rem' }}>
              {loading ? <span className="spinner" style={{ borderTopColor: '#040812' }} /> : 'Create My Account'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} style={{ color: '#C9A84C', fontWeight: 600, cursor: 'pointer' }}>Sign In</button>
          </p>
        </div>
      </div>
    </div>
  );
}
