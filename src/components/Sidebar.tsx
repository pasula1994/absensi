import React from 'react';
import {
  Bell,
  School,
  Users,
  GraduationCap,
  Calendar,
  ChevronDown,
  ChevronUp,
  HardDrive,
  QrCode,
  Building
} from 'lucide-react';
import { KotaSolokLogo } from './KotaSolokLogo';

interface SidebarProps {
  currentView: 'daily' | 'monthly' | 'students' | 'announcements';
  setCurrentView: (view: 'daily' | 'monthly' | 'students' | 'announcements') => void;
  onOpenScanner: () => void;
  onOpenTeacherSchoolModal: (tab?: 'teachers' | 'schools') => void;
  onOpenSettings: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  schoolName: string;
  schoolLogoUrl?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  onOpenScanner,
  onOpenTeacherSchoolModal,
  onOpenSettings,
  isCollapsed,
  setIsCollapsed,
  schoolName,
  schoolLogoUrl,
}) => {
  const [presensiExpanded, setPresensiExpanded] = React.useState(true);

  return (
    <aside
      className={`bg-white border-r border-slate-100 flex flex-col transition-all duration-300 z-30 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Logo Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2.5 overflow-hidden">
          {/* Logo Sekolah or iPresens Logo */}
          {schoolLogoUrl ? (
            <img
              src={schoolLogoUrl}
              alt="Logo Sekolah"
              className="w-10 h-10 rounded-xl object-contain p-1 border border-purple-100 bg-purple-50 shrink-0 shadow-2xs"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-500/20">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-current stroke-2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2a10 10 0 1 0 10 10" strokeLinecap="round" />
                <path d="M12 6a6 6 0 1 0 6 6" strokeLinecap="round" />
              </svg>
            </div>
          )}

          {!isCollapsed && (
            <div className="leading-none">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-purple-700">
                  iPresens
                </span>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                  SOLOK
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate max-w-[130px] mt-1">
                {schoolName || 'Kota Solok'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Clean Menu List (Only functional items, deleted dummy menus) */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1.5 text-xs font-semibold text-slate-600 scrollbar-thin">
        {/* Presensi Section (EXPANDED by default) */}
        <div>
          <button
            onClick={() => setPresensiExpanded(!presensiExpanded)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-purple-50/70 text-purple-800 font-bold transition"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
              {!isCollapsed && <span>Presensi Siswa</span>}
            </div>
            {!isCollapsed && (
              <ChevronUp
                className={`w-3.5 h-3.5 text-purple-600 transition-transform ${
                  !presensiExpanded ? 'rotate-180' : ''
                }`}
              />
            )}
          </button>

          {!isCollapsed && presensiExpanded && (
            <div className="mt-1 space-y-1 pl-7 pr-1">
              <button
                onClick={() => setCurrentView('monthly')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition ${
                  currentView === 'monthly'
                    ? 'bg-purple-100 text-purple-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-purple-700 hover:bg-slate-50'
                }`}
              >
                Presensi Bulanan
              </button>

              <button
                onClick={() => setCurrentView('daily')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition ${
                  currentView === 'daily'
                    ? 'bg-purple-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-purple-700 hover:bg-slate-50'
                }`}
              >
                Presensi Harian & Scanner
              </button>
            </div>
          )}
        </div>

        {/* Siswa */}
        <button
          onClick={() => setCurrentView('students')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
            currentView === 'students'
              ? 'bg-purple-50 text-purple-700 font-bold'
              : 'hover:bg-slate-50 text-slate-700'
          }`}
          title="Data Siswa & Kartu Barcode"
        >
          <Users className="w-4 h-4 text-purple-500 shrink-0" />
          {!isCollapsed && <span>Data Siswa & Kartu</span>}
        </button>

        {/* Guru */}
        <button
          onClick={() => onOpenTeacherSchoolModal('teachers')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 transition"
          title="Manajemen Guru & Wali Kelas"
        >
          <GraduationCap className="w-4 h-4 text-purple-500 shrink-0" />
          {!isCollapsed && <span>Data Guru & Wali Kelas</span>}
        </button>

        {/* Profil Sekolah (With Logo Upload Input) */}
        <button
          onClick={() => onOpenTeacherSchoolModal('schools')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 transition"
          title="Profil Sekolah & Upload Logo"
        >
          <School className="w-4 h-4 text-purple-500 shrink-0" />
          {!isCollapsed && (
            <div className="flex items-center justify-between flex-1">
              <span>Profil Sekolah</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                + Logo
              </span>
            </div>
          )}
        </button>

        {/* Database Google Drive & Excel */}
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 transition"
          title="Sinkronisasi Google Drive & Excel"
        >
          <HardDrive className="w-4 h-4 text-blue-500 shrink-0" />
          {!isCollapsed && <span>Database Drive & Excel</span>}
        </button>

        {/* Pengumuman */}
        <button
          onClick={() => setCurrentView('announcements')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
            currentView === 'announcements'
              ? 'bg-purple-50 text-purple-700 font-bold'
              : 'hover:bg-slate-50 text-slate-700'
          }`}
          title="Papan Pengumuman"
        >
          <Bell className="w-4 h-4 text-purple-500 shrink-0" />
          {!isCollapsed && <span>Pengumuman</span>}
        </button>
      </div>

      {/* Kota Solok Branding Footer in Sidebar */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <KotaSolokLogo size="sm" />
            <div className="leading-tight">
              <span className="text-[11px] font-bold text-slate-800 block">
                Pemerintah Kota Solok
              </span>
              <span className="text-[10px] text-slate-400">
                Dinas Pendidikan
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
