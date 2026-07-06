import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, CheckCircle, Lock } from 'lucide-react';

const Profile: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("Profile settings saved successfully! (Simulation)");
    setTimeout(() => setSuccess(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fadeIn">
      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-850 rounded-2xl p-6 md:p-8 space-y-8 shadow-2xl relative overflow-hidden">
        {/* Decorative Gradients */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Profile Card Header */}
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 pb-6 border-b border-slate-800/60">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-extrabold text-white text-3xl shadow-xl">
            {currentUser?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="text-center sm:text-left min-w-0">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">{currentUser?.full_name}</h2>
            <p className="text-sm text-slate-400 font-medium">{currentUser?.email}</p>
            <span className="inline-block bg-slate-950/60 border border-slate-800 text-slate-500 text-[10px] px-3 py-1 rounded-full font-mono mt-2 uppercase">
              Registered Account
            </span>
          </div>
        </div>

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl flex items-start space-x-3 text-sm animate-fadeIn">
            <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Edit profile form */}
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
              <input
                type="text"
                defaultValue={currentUser?.full_name}
                className="w-full bg-slate-950/60 border border-slate-850 focus:border-indigo-500 text-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                placeholder="Full Name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
              <input
                type="email"
                disabled
                defaultValue={currentUser?.email}
                className="w-full bg-slate-950/40 border border-slate-850/40 text-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none cursor-not-allowed flex items-center"
              />
              <p className="text-[10px] text-slate-500 mt-2 flex items-center space-x-1">
                <Lock className="h-3 w-3 shrink-0" />
                <span>Email address changes are locked for verification.</span>
              </p>
            </div>
          </div>

          <div className="border-t border-slate-800/60 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <button
              onClick={handleLogout}
              type="button"
              className="w-full sm:w-auto flex items-center justify-center space-x-2 border border-red-500/30 hover:border-red-500/60 hover:bg-red-500/10 text-red-400 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all active:scale-95"
            >
              <LogOut className="h-4.5 w-4.5" />
              <span>Log Out Account</span>
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm shadow-lg shadow-indigo-600/10 active:scale-95 transition-all"
            >
              Save Profile Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
