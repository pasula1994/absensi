import React, { useState } from 'react';
import {
  Search,
  Filter,
  RotateCcw,
  Download,
  Calendar,
  ChevronDown,
  Printer,
  FileSpreadsheet,
  FileText,
  UserCheck,
  Clock,
  Sparkles,
  Camera
} from 'lucide-react';
import {
  Student,
  AttendanceRecord,
  SchoolSettings,
  Teacher,
  SchoolProfile
} from '../types/attendance';
import { ExportDownloadPanel } from './ExportDownloadPanel';
import { User } from 'firebase/auth';

interface MonthlyPresenceViewProps {
  students: Student[];
  records: AttendanceRecord[];
  settings: SchoolSettings;
  teachers: Teacher[];
  schools: SchoolProfile[];
  currentUser: User | null;
  onOpenScanner: () => void;
  onExcelSyncedToDrive?: (fileId: string, link: string) => void;
}

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const MonthlyPresenceView: React.FC<MonthlyPresenceViewProps> = ({
  students,
  records,
  settings,
  teachers,
  schools,
  currentUser,
  onOpenScanner,
  onExcelSyncedToDrive,
}) => {
  const [activeTab, setActiveTab] = useState<'monthly' | 'detail'>('monthly');
  const [searchName, setSearchName] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('Oktober');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedClass, setSelectedClass] = useState<string>(settings.defaultClass || 'X-MIPA 1');
  const [showExportModal, setShowExportModal] = useState(false);

  const availableClasses = Array.from(
    new Set([...settings.classes, ...students.map((s) => s.className)])
  ).filter(Boolean);

  // Month index (0-based)
  const monthIdx = MONTH_NAMES.indexOf(selectedMonth);
  const monthStr = String(monthIdx + 1).padStart(2, '0');
  const yearMonthPrefix = `${selectedYear}-${monthStr}`;

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesName =
      s.name.toLowerCase().includes(searchName.toLowerCase()) ||
      s.nis.includes(searchName);
    const matchesClass = selectedClass === 'all' || s.className === selectedClass;
    return matchesName && matchesClass;
  });

  // Calculate monthly stats per student
  const studentMonthlyStats = filteredStudents.map((student) => {
    // Records of this student in the selected month
    const studentRecords = records.filter(
      (r) => r.studentId === student.id && r.date.startsWith(yearMonthPrefix)
    );

    const hadirCount = studentRecords.filter((r) => r.status === 'hadir').length;
    const terlambatCount = studentRecords.filter((r) => r.status === 'terlambat').length;
    const izinCount = studentRecords.filter((r) => r.status === 'izin' || r.status === 'sakit').length;
    const alpaCount = studentRecords.filter((r) => r.status === 'alpa').length;

    // Latest scan time in this month
    const latestRec = studentRecords[0];
    const actualTime = latestRec ? latestRec.time : '-';

    return {
      student,
      hadir: hadirCount,
      terlambat: terlambatCount,
      izin: izinCount,
      alpa: alpaCount,
      totalPresensi: hadirCount + terlambatCount,
      actualTime,
    };
  });

  // Calculate total monthly stats for the class
  const totalPresensiBulanIni = studentMonthlyStats.reduce((acc, s) => acc + s.totalPresensi, 0);

  // Handle Reset Filter
  const handleResetFilter = () => {
    setSearchName('');
    setSelectedMonth('Oktober');
    setSelectedYear('2026');
    setSelectedClass('all');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Breadcrumb & Large Purple Page Title matching SS */}
      <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-400">
          iPresens Admin Panel
        </p>
        <h1 className="text-2xl font-black tracking-tight text-purple-700">
          LAPORAN PRESENSI BULANAN
        </h1>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span>Beranda</span>
          <span>/</span>
          <span className="text-purple-700 font-semibold">Laporan Presensi Bulanan</span>
        </div>
      </div>

      {/* Main White Card Container matching SS */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {/* Card Tabs: Presensi Bulanan & Detail Presensi */}
        <div className="border-b border-slate-100 px-6 pt-4 flex items-center gap-8">
          <button
            onClick={() => setActiveTab('monthly')}
            className={`pb-3 text-xs font-bold transition relative ${
              activeTab === 'monthly'
                ? 'text-purple-700'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Presensi Bulanan
            {activeTab === 'monthly' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('detail')}
            className={`pb-3 text-xs font-bold transition relative ${
              activeTab === 'detail'
                ? 'text-purple-700'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Detail Presensi
            {activeTab === 'detail' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
            )}
          </button>
        </div>

        {/* Filter Bar matching SS */}
        <div className="p-6 border-b border-slate-100 bg-white">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Left Inputs */}
            <div className="flex flex-wrap flex-1 items-center gap-2.5">
              {/* Search by Name */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama Siswa..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              {/* Month Dropdown */}
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="appearance-none pl-3.5 pr-8 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                >
                  {MONTH_NAMES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Year Dropdown */}
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="appearance-none pl-3.5 pr-8 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2027">2027</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Class Filter */}
              <div className="relative">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="appearance-none pl-3.5 pr-8 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                >
                  <option value="all">Semua Kelas</option>
                  {availableClasses.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Filter Button */}
              <button
                type="button"
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Filter className="w-3.5 h-3.5 text-slate-600" />
                <span>Filter</span>
              </button>

              {/* Reset Button */}
              <button
                type="button"
                onClick={handleResetFilter}
                className="p-2 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-600 transition"
                title="Reset Filter"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Right: Purple 'exp' Export Button matching SS */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowExportModal(!showExportModal)}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-purple-500/20 flex items-center gap-1.5 transition"
                title="Buka Pusat Unduhan Excel & PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span>exp</span>
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Export & Download Hub if exp clicked */}
        {showExportModal && (
          <div className="p-6 bg-slate-50 border-b border-slate-100 animate-fade-in">
            <ExportDownloadPanel
              students={students}
              records={records}
              settings={settings}
              teachers={teachers}
              schools={schools}
              selectedDate={`${selectedYear}-${monthStr}-01`}
              selectedClass={selectedClass}
              currentUser={currentUser}
              onExcelSyncedToDrive={onExcelSyncedToDrive}
            />
          </div>
        )}

        {/* Table Content Area */}
        <div className="overflow-x-auto">
          {studentMonthlyStats.length === 0 ? (
            /* Empty State matching SS (Purple open box with question mark + Data Kosong) */
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 mb-3 text-purple-600 relative flex items-center justify-center">
                <svg
                  viewBox="0 0 64 64"
                  className="w-16 h-16 fill-none stroke-current stroke-2"
                >
                  <path d="M10 24 L32 14 L54 24 L32 34 Z" fill="#F3E8FF" />
                  <path d="M10 24 L10 46 L32 56 L32 34 Z" fill="#EDE9FE" />
                  <path d="M54 24 L54 46 L32 56 L32 34 Z" fill="#DDD6FE" />
                  <path d="M32 14 L32 34" />
                </svg>
                {/* Floating Question Mark */}
                <div className="absolute -top-1 font-black text-xl text-purple-700 animate-bounce">
                  ?
                </div>
              </div>
              <h4 className="text-sm font-bold text-slate-800">Data Kosong</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Tidak ada data kehadiran siswa pada periode bulan {selectedMonth} {selectedYear}.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 text-center w-12">#</th>
                  <th className="py-3 px-4 text-center w-14">Foto</th>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-4 text-center">Presensi</th>
                  <th className="py-3 px-4 text-center">Izin/Cuti</th>
                  <th className="py-3 px-4 text-center">Terlambat</th>
                  <th className="py-3 px-4 text-center">Jam Kerja</th>
                  <th className="py-3 px-4 text-center">Jam Aktual</th>
                  <th className="py-3 px-4 text-center">Istirahat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentMonthlyStats.map((item, idx) => {
                  const s = item.student;
                  return (
                    <tr key={s.id} className="hover:bg-purple-50/30 transition">
                      {/* # */}
                      <td className="py-3 px-4 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Foto */}
                      <td className="py-3 px-4 text-center">
                        <div className="w-8 h-8 rounded-full bg-purple-100 border border-purple-200 text-purple-700 font-bold text-xs flex items-center justify-center mx-auto shadow-2xs">
                          {s.name.substring(0, 2).toUpperCase()}
                        </div>
                      </td>

                      {/* Nama */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block leading-tight">
                          {s.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          NIS: {s.nis} • {s.className}
                        </span>
                      </td>

                      {/* Presensi */}
                      <td className="py-3 px-4 text-center font-bold text-emerald-700">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px]">
                          {item.hadir} Hari
                        </span>
                      </td>

                      {/* Izin/Cuti */}
                      <td className="py-3 px-4 text-center font-bold text-purple-700">
                        <span className="px-2 py-0.5 rounded-full bg-purple-50 text-[11px]">
                          {item.izin}
                        </span>
                      </td>

                      {/* Terlambat */}
                      <td className="py-3 px-4 text-center font-bold text-amber-700">
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-[11px]">
                          {item.terlambat}
                        </span>
                      </td>

                      {/* Jam Kerja */}
                      <td className="py-3 px-4 text-center font-mono text-slate-600 text-[11px]">
                        07:00 - 15:00
                      </td>

                      {/* Jam Aktual */}
                      <td className="py-3 px-4 text-center font-mono font-medium text-slate-800 text-[11px]">
                        {item.actualTime !== '-' ? `${item.actualTime} WIB` : '-'}
                      </td>

                      {/* Istirahat */}
                      <td className="py-3 px-4 text-center font-mono text-slate-400 text-[11px]">
                        12:00 - 13:00
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
