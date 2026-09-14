import { NavLink, Outlet } from "react-router-dom";

export default function SettingsLayout() {
  const linkClass = ({ isActive }) => 
    `block px-3 py-2 rounded-lg text-sm font-medium transition ${
      isActive ? "bg-green-50 text-green-700 font-semibold" : "text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <div className="w-full flex gap-6 p-6">
      {/* INNER Sidebar - Settings ka apna */}
      <div className="w-56 bg-white border border-slate-100 rounded-2xl p-3 h-fit">
        <p className="px-3 py-2 text-xs font-bold text-slate-400 uppercase">Settings</p>
        <nav className="space-y-1">
          <NavLink to="/settings" end className={linkClass}>General</NavLink>
          <NavLink to="/settings/users" className={linkClass}>Users & Roles</NavLink>
        </nav>
      </div>

      {/* RIGHT Content */}
      <div className="flex-1 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <Outlet />
      </div>
    </div>
  );
}