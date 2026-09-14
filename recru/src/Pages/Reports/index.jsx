import { NavLink, Outlet } from "react-router-dom";

export default function ReportsLayout() {
  const linkClass = ({ isActive }) =>
    `block px-3 py-2 rounded-xl text-sm font-medium transition ${
      isActive ? "bg-green-50 text-green-700 font-semibold" : "text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <div className="w-full flex gap-6 p-6">
      {/* Left Menu */}
      <div className="w-56 bg-white border border-slate-100 rounded-2xl p-3 h-fit">
        <p className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Reports</p>
        <nav className="space-y-1">
          <NavLink to="/reports" end className={linkClass}>Overview</NavLink>
          <NavLink to="/reports/pipeline" className={linkClass}>Pipeline Report</NavLink>
          <NavLink to="/reports/source" className={linkClass}>Source Report</NavLink>
          <NavLink to="/reports/time-to-hire" className={linkClass}>Time to Hire</NavLink>
        </nav>
      </div>

      {/* Right Content */}
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}