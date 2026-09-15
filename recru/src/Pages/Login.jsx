import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../Context/AuthContext';
// Make sure to run: npm install lucide-react
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/settings/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed.Please check your credentials and try again.');
      }

      // PHP me $_SESSION set karne jaisa
      login(data);
      navigate('/'); // Dashboard pe bhejo

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans antialiased overflow-hidden">

      {/* Left Panel: Corporate Executive Showcase (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-7/12 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 items-center justify-center p-16 relative">

        {/* Dynamic Abstract Green Ambient Rings */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full filter blur-[120px] animate-pulse duration-[6000ms]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-mint-400/10 rounded-full filter blur-[100px] animate-pulse duration-[4000ms]"></div>

        {/* Clean Linear Dot Grid Accent */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px]"></div>

        <div className="max-w-xl relative z-10 space-y-8 backdrop-blur-md bg-white/5 p-10 rounded-3xl border border-white/10 shadow-2xl text-center lg:text-left flex flex-col items-center lg:items-start">

          {/* Company Brand Logo Image Wrapper */}
          <div className="w-48 h-20 bg-white/95 backdrop-blur px-6 py-3 rounded-2xl border border-white/20 shadow-xl flex items-center justify-center overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
            <img
              src="https://ushayarns.com/wp-content/uploads/2024/11/logo-final-usha.svg#1173" // Replace with your actual local path or live CDN link
              alt="USHA YARNS LTD Logo"
              className="w-full h-full object-contain filter drop-shadow-sm"
              onError={(e) => {
                // Fallback placeholder display if image fails to resolve
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = '<span className="text-emerald-900 font-black tracking-tight text-xl">USHA YARNS LTD</span>';
              }}
            />
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Recruitment Management System
            </h1>
            <p className="text-base text-emerald-100/80 font-light leading-relaxed">
              Accelerating workforce scaling through intelligent candidate assessment matrices, automated workflow channels, and enterprise resource tracking.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel: Clean Pure White Form Console */}
      <div className="w-full lg:w-5/12 flex items-center justify-center p-6 sm:p-12 md:p-16 bg-white relative shadow-2xl z-20">
        <div className="w-full max-w-md space-y-8">

          {/* Identity Header */}
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Welcome back
            </h2>
            <p className="text-sm text-slate-500 font-light">
              Please enter your credentials to access your workspace.
            </p>
          </div>

          {/* Dynamic Action Error Banner */}
          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-4 rounded-2xl border border-red-100 flex items-start gap-3 transition-all duration-200">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {/* Account Authentication Submission Hook */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email Identification Block */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 tracking-wider uppercase">
                Email Address
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 group-focus-within:text-emerald-600 transition-colors pointer-events-none">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 outline-none transition-all duration-200 disabled:opacity-50"
                  placeholder="testuser@gmail.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            {/* Password Validation Block */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 tracking-wider uppercase">
                Password
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 group-focus-within:text-emerald-600 transition-colors pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={loading}
                  className="w-full pl-11 pr-12 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 outline-none transition-all duration-200 disabled:opacity-50"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-emerald-600 transition-colors select-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Prime Custom Emerald Submission Button */}
            <button
              disabled={loading}
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white py-3 px-4 rounded-xl font-semibold tracking-wide shadow-lg shadow-emerald-600/10 hover:shadow-xl hover:shadow-emerald-600/20 transition-all duration-200 transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                "Sign In to Management Console"
              )}
            </button>
          </form>

        </div>
      </div>

    </div>
  );
}
