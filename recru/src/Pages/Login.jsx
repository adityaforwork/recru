import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../Context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
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
        throw new Error(data.message || 'Login failed');
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
    <div className="min-h-screen flex">
      {/* Left - Branding */}
      <div className="hidden md:flex w-1/2 bg-indigo-600 items-center justify-center p-10 text-white">
        <div>
          <h1 className="text-4xl font-bold mb-4">USHA YARNS LTD</h1>
          <p className="text-indigo-100">Recruitment Management System</p>
        </div>
      </div>

      {/* Right - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-50 p-6">
        <form onSubmit={handleSubmit} className="bg-white w-full max-w-sm p-8 rounded-2xl shadow-lg space-y-5">
          <h2 className="text-2xl font-bold">Welcome back</h2>
          <p className="text-sm text-gray-500">Apna email aur password dalo</p>
          
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-2.5 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Email</label>
            <input 
              type="email" required
              className="mt-1 w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="testuser@gmail.com"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Password</label>
            <input 
              type="password" required
              className="mt-1 w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
            />
          </div>

          <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium disabled:opacity-50">
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="text-xs text-center text-gray-400">Test: testuser@gmail.com / 123456</p>
        </form>
      </div>
    </div>
  );
}