import { useEffect, useState } from "react";
import { Plus, Trash2, Shield, Loader2, Mail, User, Phone, ImagePlus, X } from "lucide-react";
const API_BASE = "http://localhost:5000/api/settings";
const ROLES = ["Admin", "Recruiter", "Hiring Manager", "Viewer"];

export default function UsersSettings() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ 
    name: "", email: "", mobile: "", password: "", role: "Recruiter", 
    profileFile: null, preview: "" 
  });
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users`);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch { setUsers([]) }
    finally { setLoading(false) }
  };

  useEffect(() => { fetchUsers() }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return alert("Image 2MB se chhoti honi chahiye");
    setForm(prev => ({ 
      ...prev, 
      profileFile: file, 
      preview: URL.createObjectURL(file) 
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.mobile || !form.password) return alert("All fields required");
    if (!/^\d{10}$/.test(form.mobile)) return alert("Mobile number 10 digit ka hona chahiye");

    setSaving(true);
    try {
      // FormData use karenge kyuki image bhi hai
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("email", form.email);
      fd.append("mobile", form.mobile);
      fd.append("password", form.password);
      fd.append("role", form.role);
      if (form.profileFile) fd.append("avatar", form.profileFile);

      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        body: fd, // Content-Type auto set hoga
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user");
      
      setUsers(prev => [...prev, data]);
      setShowModal(false);
      setForm({ name: "", email: "", mobile: "", password: "", role: "Recruiter", profileFile: null, preview: "" });
    } catch (err) { alert(err.message) }
    finally { setSaving(false) }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this user?")) return;
    await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  if (loading) return <div className="w-full h-64 flex items-center justify-center gap-2"><Loader2 className="animate-spin" /> Loading users...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Users & Roles</h2>
          <p className="text-xs text-slate-500 mt-1">Total {users.length} users</p>
        </div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b text-xs font-bold text-slate-500 uppercase">
            <tr>
              <th className="p-4">User</th>
              <th className="p-4">Role</th>
              <th className="p-4 text-right pr-6">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/50">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {u.avatar ? <img src={u.avatar ? `http://localhost:5000${u.avatar}` : ""} className="w-9 h-9 rounded-full object-cover border" /> : <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center"><User className="w-4 h-4 text-slate-500" /></div>}
                    <div>
                      <div className="font-semibold text-slate-800">{u.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-2"><span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {u.email}</span> <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {u.mobile}</span></div>
                    </div>
                  </div>
                </td>
                <td className="p-4"><span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold inline-flex items-center gap-1"><Shield className="w-3 h-3" /> {u.role}</span></td>
                <td className="p-4 text-right pr-6">
                  <button onClick={() => handleDelete(u.id)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreate} className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4 shadow-xl max-h- overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Add New User</h3>
              <button type="button" onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            {/* Profile Picture Upload */}
            <div className="flex items-center gap-4 py-2">
              <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                {form.preview ? <img src={form.preview} className="w-full h-full object-cover" /> : <ImagePlus className="w-6 h-6 text-slate-400" />}
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-600">Profile Picture</label>
                <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-xs mt-1 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-slate-900 file:text-white hover:file:bg-black" />
                <p className="text- text-slate-400 mt-1">PNG, JPG max 2MB</p>
              </div>
            </div>

            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full Name *" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
            <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email Address *" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value.replace(/\D/g,'').slice(0,10) })} placeholder="Mobile Number * (10 digits)" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
            </div>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password *" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none">
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
              <button disabled={saving} className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Create User
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}