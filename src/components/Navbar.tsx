import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Camera,
  Users,
  Send,
  HardDrive,
  Clock,
  LogOut,
  CheckCircle,
  Cloud,
  ChevronDown,
  GraduationCap
} from 'lucide-react';
import { SchoolSettings } from '../types/attendance';
import { User } from 'firebase/auth';
import { KotaSolokLogo } from './KotaSolokLogo';

interface NavbarProps {
  currentTab: 'today' | 'students';
  setCurrentTab: (tab: 'today' | 'students') => void;
  onOpenScanner: () => void;
  onOpenEmailModal: () => void;
  onOpenSettings: () => void;
  onOpenTeacherSchoolModal: () => void;
  settings: SchoolSettings;
  currentUser: User | null;
  onGoogleSignIn: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenScanner,
  onOpenEmailModal,
  onOpenSettings,
  onOpenTeacherSchoolModal,
  settings,
  currentUser,
  onGoogleSignIn,
  onLogout,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB'
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & School Name with Kota Solok Emblem */}
          <div className="flex items-center gap-3">
            <KotaSolokLogo size="md" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900">
                  Hadir<span className="text-emerald-600">Ku</span>
                </span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                  KOTA SOLOK
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate max-w-[170px] sm:max-w-xs">
                {settings.schoolName || 'SMA Negeri 1 Kota Solok'}
              </p>
            </div>
          </div>

          {/* Center Tabs Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setCurrentTab('today')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                currentTab === 'today'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Presensi Hari Ini
            </button>
            <button
              onClick={() => setCurrentTab('students')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                currentTab === 'students'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Data Siswa & Kartu
            </button>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Live Clock */}
            <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-500 font-mono bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>{currentTime}</span>
            </div>

            {/* Quick Scanner Button */}
            <button
              onClick={onOpenScanner}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Scan Barcode</span>
            </button>

            {/* CRUD Guru & Sekolah Button */}
            <button
              onClick={onOpenTeacherSchoolModal}
              className="px-2.5 py-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-900 text-xs font-bold flex items-center gap-1.5 transition"
              title="Kelola Data Guru dan Profil Sekolah"
            >
              <GraduationCap className="w-4 h-4 text-blue-700" />
              <span className="hidden lg:inline">Guru & Sekolah</span>
            </button>

            {/* Google Drive Status Indicator */}
            <button
              onClick={onOpenSettings}
              className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition ${
                settings.lastSyncedAt
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
              title="Pengaturan Google Drive, Database Excel & Pengaturan"
            >
              <Cloud className="w-4 h-4 text-emerald-600" />
              <span className="hidden lg:inline text-[11px] font-semibold">
                {settings.lastSyncedAt ? 'Drive Aktif' : 'Drive Sync'}
              </span>
            </button>

            {/* User Auth or Sign in with Google */}
            {!currentUser ? (
              <button
                onClick={onGoogleSignIn}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-2xs transition"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="hidden sm:inline">Google Login</span>
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2 p-1 pl-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-xs"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                    {(currentUser.displayName || currentUser.email || 'U').substring(0, 1).toUpperCase()}
                  </div>
                  <span className="font-semibold text-slate-800 hidden sm:inline max-w-[120px] truncate">
                    {currentUser.displayName || currentUser.email}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 mr-1" />
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-fade-in text-xs">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="font-semibold text-slate-900 truncate">
                        {currentUser.displayName || settings.teacherName}
                      </p>
                      <p className="text-slate-500 text-[11px] font-mono truncate">
                        {currentUser.email}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenTeacherSchoolModal();
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                    >
                      <GraduationCap className="w-4 h-4 text-blue-500" />
                      <span>Manajemen Guru & Sekolah</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenSettings();
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                    >
                      <HardDrive className="w-4 h-4 text-emerald-500" />
                      <span>Database Drive & Excel</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenEmailModal();
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                    >
                      <Send className="w-4 h-4 text-indigo-500" />
                      <span>Kirim Laporan Email</span>
                    </button>
                    <div className="border-t border-slate-100 my-1" />
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Keluar (Logout)</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden border-t border-slate-100 py-2 gap-2">
          <button
            onClick={() => setCurrentTab('today')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold text-center transition ${
              currentTab === 'today'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            Presensi Hari Ini
          </button>
          <button
            onClick={() => setCurrentTab('students')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold text-center transition ${
              currentTab === 'students'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            Data Siswa & Kartu
          </button>
          <button
            onClick={onOpenTeacherSchoolModal}
            className="px-2 py-1.5 rounded-lg text-xs font-semibold text-center bg-blue-50 text-blue-800"
          >
            Guru & Sekolah
          </button>
        </div>
      </div>
    </header>
  );
};
