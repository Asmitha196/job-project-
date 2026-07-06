import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  Sparkles, 
  BarChart3, 
  User, 
  LogOut, 
  Menu, 
  X,
  Cpu
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Job Listings', href: '/jobs', icon: Briefcase },
    { name: 'Resumes', href: '/resumes', icon: FileText },
    { name: 'AI Recommendations', href: '/recommendations', icon: Sparkles },
    { name: 'Skills Gap Analysis', href: '/skills-gap', icon: BarChart3 },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-slate-900/80 backdrop-blur-md border-b border-slate-800/60 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-2">
          <Cpu className="h-6 w-6 text-indigo-500 animate-pulse" />
          <span className="font-bold text-lg bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            JobMatch AI
          </span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-slate-400 hover:text-slate-100 focus:outline-none p-1 rounded-md bg-slate-800/40 border border-slate-700/50"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-64 flex-col bg-slate-900/60 backdrop-blur-xl border-r border-slate-850 p-6 space-y-6 shrink-0">
        <div className="flex items-center space-x-3 px-2">
          <Cpu className="h-8 w-8 text-indigo-500 animate-pulse" />
          <span className="font-extrabold text-xl bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            JobMatch AI
          </span>
        </div>

        <nav className="flex-grow space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/20 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.05)]' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 border border-transparent'
                }`}
              >
                <Icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800/60 pt-4 flex flex-col space-y-3">
          <div className="flex items-center space-x-3 px-2">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-md">
              {currentUser?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate">{currentUser?.full_name}</p>
              <p className="text-xs text-slate-500 truncate">{currentUser?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent transition-all text-sm font-medium"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-10 flex">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <nav className="relative flex flex-col w-4/5 max-w-sm bg-slate-900 border-r border-slate-800 p-6 space-y-6 h-full shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Cpu className="h-6 w-6 text-indigo-500 animate-pulse" />
                <span className="font-bold text-lg bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  JobMatch AI
                </span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-slate-200 p-1">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-grow space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium text-sm">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            <div className="border-t border-slate-800/60 pt-4 flex flex-col space-y-3">
              <div className="flex items-center space-x-3 px-2">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-md">
                  {currentUser?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate">{currentUser?.full_name}</p>
                  <p className="text-xs text-slate-500 truncate">{currentUser?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 w-full px-4 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent transition-all text-sm font-medium"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 min-w-0 flex flex-col min-h-0">
        {/* Top Navbar */}
        <header className="hidden md:flex h-16 bg-slate-900/20 border-b border-slate-900 px-8 items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-300">
            {navigation.find(item => item.href === location.pathname)?.name || 'Portal'}
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1 rounded-full border border-slate-700/30 font-mono">
              API STATUS: ONLINE
            </span>
          </div>
        </header>

        {/* Dynamic Outlet */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto min-h-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
