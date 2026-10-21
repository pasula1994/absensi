import React, { useState } from 'react';
import {
  Menu,
  Search,
  Moon,
  Sun,
  Bell,
  Cloud,
  ExternalLink,
  ChevronDown,
  LogOut,
  HardDrive,
  Send,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import { User } from 'firebase/auth';
import { SchoolSettings } from '../types/attendance';

interface HeaderProps {
  onToggleSidebar: () => void;
  currentUser: User | null;
  onGoogleSignIn: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  onOpenEmailModal: () => void;
  onOpenTeacherSchoolModal: () => void;
  settings: SchoolSettings;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  currentUser,
  onGoogleSignIn,
  onLogout,
  onOpenSettings,
  onOpenEmailModal,
  onOpenTeacherSchoolModal,
  settings,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-100 px-4 flex items-center justify-between gap-3 sticky top-0 z-20">
      {/* Left: Sidebar Toggle & Search Input */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        {/* Toggle Hamburger Button */}
        <button
          onClick={onToggleSidebar}
          className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition"
          title="Tutup / Buka Menu Sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari halaman..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-14 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded">
            Ctrl K
          </kbd>
        </div>
      </div>

      {/* Right Actions matching Screenshot */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Tutorial Button (YouTube) */}
        <button
          onClick={() => window.open('https://youtube.com', '_blank')}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
        >
          <div className="w-4 h-3 bg-red-600 rounded flex items-center justify-center text-white">
            <span className="text-[7px]">▶</span>
          </div>
          <span>Tutorial</span>
          <span className="text-[10px] text-slate-400">↗</span>
        </button>

        {/* CS WhatsApp Button */}
        <button
          onClick={() => window.open('https://wa.me', '_blank')}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
        >
          <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-[8px]">
            W
          </div>
          <span>CS</span>
          <span className="text-[10px] text-slate-400">↗</span>
        </button>

        {/* Telegram Group Button */}
        <button
          onClick={() => window.open('https://telegram.org', '_blank')}
          className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
        >
          <div className="w-3.5 h-3.5 rounded-full bg-sky-500 flex items-center justify-center text-white text-[8px]">
            ✈
          </div>
          <span>Grup Telegram</span>
          <span className="text-[10px] text-slate-400">↗</span>
        </button>

        {/* Google Drive Status Indicator */}
        <button
          onClick={onOpenSettings}
          className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition ${
            settings.lastSyncedAt
              ? 'bg-purple-50 border-purple-200 text-purple-800'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
          title="Google Drive Cloud Database"
        >
          <Cloud className="w-4 h-4 text-purple-600" />
          <span className="hidden sm:inline text-[11px] font-semibold">
            {settings.lastSyncedAt ? 'Drive Aktif' : 'Drive Sync'}
          </span>
        </button>

        {/* Dark Mode Moon Toggle */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
          title="Toggle Tampilan"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Language Badge */}
        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-purple-600 text-white text-[11px] font-bold shadow-2xs">
          <span>🇮🇩</span>
          <span>ID</span>
        </div>

        {/* Notification Bell */}
        <button className="relative p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-600 ring-2 ring-white" />
        </button>

        {/* User Profile Avatar / Dropdown */}
        <div className="relative">
          {!currentUser ? (
            <button
              onClick={onGoogleSignIn}
              className="w-9 h-9 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center shadow-sm shadow-purple-500/30 transition cursor-pointer"
              title="Masuk dengan Akun Google"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2a10 10 0 1 0 10 10" strokeLinecap="round" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-9 h-9 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center shadow-sm shadow-purple-500/30 transition cursor-pointer"
            >
              {(currentUser.displayName || currentUser.email || 'A').substring(0, 1).toUpperCase()}
            </button>
          )}

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 text-xs animate-fade-in">
              <div className="px-3.5 py-2.5 border-b border-slate-100">
                <p className="font-bold text-slate-900 truncate">
                  {currentUser?.displayName || settings.teacherName}
                </p>
                <p className="text-slate-400 text-[11px] font-mono truncate">
                  {currentUser?.email || settings.teacherEmail}
                </p>
              </div>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onOpenTeacherSchoolModal();
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-purple-50 text-slate-700 hover:text-purple-700 flex items-center gap-2"
              >
                <GraduationCap className="w-4 h-4 text-purple-600" />
                <span>Manajemen Guru & Sekolah</span>
              </button>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onOpenSettings();
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-purple-50 text-slate-700 hover:text-purple-700 flex items-center gap-2"
              >
                <HardDrive className="w-4 h-4 text-blue-600" />
                <span>Database Google Drive & Excel</span>
              </button>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onOpenEmailModal();
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-purple-50 text-slate-700 hover:text-purple-700 flex items-center gap-2"
              >
                <Send className="w-4 h-4 text-emerald-600" />
                <span>Kirim Laporan Email</span>
              </button>

              <div className="border-t border-slate-100 my-1" />

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onLogout();
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar (Logout)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
