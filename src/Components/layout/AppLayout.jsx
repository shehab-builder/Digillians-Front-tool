import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Layers,
  Building2,
  Users,
  UserCheck,
  ClipboardCheck,
  LogOut,
  Menu,
  X,
  Award,
  Timer,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = user?.role === "ADMIN";

  const adminNav = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Tracks & Criteria", path: "/admin/tracks", icon: Layers },
    { name: "Labs", path: "/admin/labs", icon: Building2 },
    { name: "Judges Directory", path: "/admin/judges", icon: UserCheck },
    { name: "Teams & Students", path: "/admin/teams", icon: Users },
    { name: "Master Scores", path: "/admin/evaluations", icon: ClipboardCheck },
    { name: "Schedules", path: "/admin/schedulled-evaluations", icon: Timer },
  ];

  const judgeNav = [
    {
      name: "My Dashboard",
      path: "/judge/dashboard",
      icon: LayoutDashboard,
    },
  ];

  const navItems = isAdmin ? adminNav : judgeNav;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 text-white p-2 rounded-xl">
                <Award size={22} />
              </div>
              <span className="font-bold text-xl tracking-tight text-black">
                Specialized Diploma
                <span className="text-blue-600"> 9-Months</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-900">
                {user?.name}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {user?.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-black transition-colors"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-20 w-64 bg-white border-r border-slate-200 p-4 transition-transform duration-200 ease-in-out lg:static lg:block lg:border-r-0 lg:p-0
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-black"
                  }`
                }
              >
                <item.icon size={18} />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main Workspace Area */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
