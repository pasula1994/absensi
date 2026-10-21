import React, { useState } from 'react';
import {
  Camera,
  Send,
  Calendar,
  CheckCircle,
  Clock,
  HeartPulse,
  FileText,
  AlertCircle,
  UserX,
  UserCheck,
  Search,
  Filter,
  Download,
  Printer,
  ChevronDown,
  Sparkles,
  FileSpreadsheet,
  GraduationCap
} from 'lucide-react';
import {
  Student,
  AttendanceRecord,
  SchoolSettings,
  AttendanceStatus,
  Teacher,
  SchoolProfile
} from '../types/attendance';
import { getCurrentTimeStr, getTodayDateStr } from '../utils/initialData';
import { formatIndonesianDate } from '../services/gmail';
import { ExportDownloadPanel } from './ExportDownloadPanel';
import { KotaSolokLogo } from './KotaSolokLogo';
import { User } from 'firebase/auth';

interface TodayAttendanceViewProps {
  students: Student[];
  records: AttendanceRecord[];
  settings: SchoolSettings;
  teachers: Teacher[];
  schools: SchoolProfile[];
  currentUser: User | null;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  onOpenScanner: () => void;
  onOpenEmailModal: () => void;
  onOpenManualModal: () => void;
  onOpenTeacherSchoolModal: () => void;
  onUpdateRecordStatus: (
    studentId: string,
    status: AttendanceStatus,
    notes?: string
  ) => void;
  onExcelSyncedToDrive?: (fileId: string, link: string) => void;
}

export const TodayAttendanceView: React.FC<TodayAttendanceViewProps> = ({
  students,
  records,
  settings,
  teachers,
  schools,
  currentUser,
  selectedDate,
  setSelectedDate,
  onOpenScanner,
  onOpenEmailModal,
  onOpenManualModal,
  onOpenTeacherSchoolModal,
  onUpdateRecordStatus,
  onExcelSyncedToDrive,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>(settings.defaultClass || 'X-MIPA 1');
  const [statusFilter, setStatusFilter] = useState<'all' | AttendanceStatus | 'unscanned'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNotesStudentId, setEditingNotesStudentId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [showExportPanel, setShowExportPanel] = useState(true);

  const availableClasses = Array.from(
    new Set([...settings.classes, ...students.map((s) => s.className)])
  ).filter(Boolean);

  const activeSchool = schools.find((s) => s.id === settings.activeSchoolId) || schools[0];
  const activeTeacher = teachers.find((t) => t.id === settings.activeTeacherId) || teachers[0];

  // Filter students by selected class
  const classStudents = students.filter(
    (s) => selectedClass === 'all' || s.className === selectedClass
  );

  // Map of attendance records for the selected date
  const recordsForDate = records.filter((r) => r.date === selectedDate);
  const recordMap = new Map<string, AttendanceRecord>();
  recordsForDate.forEach((r) => {
    recordMap.set(r.studentId, r);
  });

  // Calculate statistics
  let hadirCount = 0;
  let terlambatCount = 0;
  let sakitCount = 0;
  let izinCount = 0;
  let alpaCount = 0;

  classStudents.forEach((student) => {
    const rec = recordMap.get(student.id);
    if (!rec) {
      alpaCount++;
    } else {
      if (rec.status === 'hadir') hadirCount++;
      else if (rec.status === 'terlambat') terlambatCount++;
      else if (rec.status === 'sakit') sakitCount++;
      else if (rec.status === 'izin') izinCount++;
      else alpaCount++;
    }
  });

  const totalClassStudents = classStudents.length;
  const presentTotal = hadirCount + terlambatCount;
  const attendanceRate =
    totalClassStudents > 0 ? Math.round((presentTotal / totalClassStudents) * 100) : 0;

  // Filter list by status & search
  const filteredStudents = classStudents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.nis.toLowerCase().includes(searchQuery.toLowerCase());

    const rec = recordMap.get(student.id);
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      if (statusFilter === 'unscanned') {
        matchesStatus = !rec || rec.status === 'alpa';
      } else {
        matchesStatus = rec?.status === statusFilter;
      }
    }

    return matchesSearch && matchesStatus;
  });

  const handleOpenNotes = (studentId: string, currentNotes?: string) => {
    setEditingNotesStudentId(studentId);
    setNoteInput(currentNotes || '');
  };

  const handleSaveNotes = (studentId: string) => {
    const rec = recordMap.get(studentId);
    const currentStatus = rec ? rec.status : 'izin';
    onUpdateRecordStatus(studentId, currentStatus, noteInput);
    setEditingNotesStudentId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Deck */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <KotaSolokLogo size="lg" />
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Kota Solok • Sumbar
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-600">
                {formatIndonesianDate(selectedDate)}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Presensi Siswa: {selectedClass === 'all' ? 'Semua Kelas' : selectedClass}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-500">
              <span>{activeSchool?.name || settings.schoolName}</span>
              <span>•</span>
              <button
                onClick={onOpenTeacherSchoolModal}
                className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 hover:underline"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Wali Kelas: {activeTeacher?.name || settings.teacherName}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenScanner}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-emerald-500/20 hover:shadow-md transition active:scale-98"
          >
            <Camera className="w-4 h-4 text-emerald-100" />
            <span>Mulai Scan Barcode</span>
          </button>

          <button
            onClick={onOpenEmailModal}
            className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition active:scale-98"
            title="Kirim rekap absensi hari ini ke email guru"
          >
            <Send className="w-4 h-4 text-indigo-200" />
            <span>Kirim Laporan Email</span>
          </button>

          <button
            onClick={onOpenManualModal}
            className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition"
          >
            Presensi Manual
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Siswa */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Siswa
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {totalClassStudents}
          </div>
          <span className="text-[10px] text-slate-400">Kelas Terdaftar</span>
        </div>

        {/* Hadir Tepat Waktu */}
        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
              Hadir
            </span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {hadirCount}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">Tepat Waktu</span>
        </div>

        {/* Terlambat */}
        <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
              Terlambat
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1">
            {terlambatCount}
          </div>
          <span className="text-[10px] text-amber-600 font-medium">Lewat {settings.lateThresholdTime}</span>
        </div>

        {/* Sakit */}
        <div className="bg-white p-3.5 rounded-xl border border-sky-200 bg-sky-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-sky-800 uppercase tracking-wider">
              Sakit
            </span>
            <HeartPulse className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-sky-700 mt-1">
            {sakitCount}
          </div>
          <span className="text-[10px] text-sky-600 font-medium">Surat Dokter/Ortu</span>
        </div>

        {/* Izin */}
        <div className="bg-white p-3.5 rounded-xl border border-purple-200 bg-purple-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-purple-800 uppercase tracking-wider">
              Izin
            </span>
            <FileText className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700 mt-1">
            {izinCount}
          </div>
          <span className="text-[10px] text-purple-600 font-medium">Izin Resmi</span>
        </div>

        {/* Belum Hadir / Alpa */}
        <div className="bg-white p-3.5 rounded-xl border border-rose-200 bg-rose-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider">
              Alpa / Belum
            </span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 mt-1">
            {alpaCount}
          </div>
          <span className="text-[10px] text-rose-600 font-medium">Tanpa Keterangan</span>
        </div>
      </div>

      {/* Progress Bar of Attendance */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          <span className="text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Persentase Kehadiran Kelas ({activeSchool?.name})
          </span>
          <span className="text-emerald-700 font-bold text-sm">
            {attendanceRate}% ({presentTotal} dari {totalClassStudents} Siswa)
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
          <div
            style={{ width: `${totalClassStudents > 0 ? (hadirCount / totalClassStudents) * 100 : 0}%` }}
            className="bg-emerald-500 h-full transition-all duration-500"
            title={`Hadir: ${hadirCount}`}
          />
          <div
            style={{ width: `${totalClassStudents > 0 ? (terlambatCount / totalClassStudents) * 100 : 0}%` }}
            className="bg-amber-400 h-full transition-all duration-500"
            title={`Terlambat: ${terlambatCount}`}
          />
          <div
            style={{ width: `${totalClassStudents > 0 ? (sakitCount / totalClassStudents) * 100 : 0}%` }}
            className="bg-sky-400 h-full transition-all duration-500"
            title={`Sakit: ${sakitCount}`}
          />
          <div
            style={{ width: `${totalClassStudents > 0 ? (izinCount / totalClassStudents) * 100 : 0}%` }}
            className="bg-purple-400 h-full transition-all duration-500"
            title={`Izin: ${izinCount}`}
          />
          <div
            style={{ width: `${totalClassStudents > 0 ? (alpaCount / totalClassStudents) * 100 : 0}%` }}
            className="bg-rose-400 h-full transition-all duration-500"
            title={`Alpa: ${alpaCount}`}
          />
        </div>
      </div>

      {/* DEDICATED NEAT EXCEL & PDF EXPORT/DOWNLOAD PANEL */}
      <ExportDownloadPanel
        students={students}
        records={records}
        settings={settings}
        teachers={teachers}
        schools={schools}
        selectedDate={selectedDate}
        selectedClass={selectedClass}
        currentUser={currentUser}
        onExcelSyncedToDrive={onExcelSyncedToDrive}
      />

      {/* Filter and Date Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Picker */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none"
            />
          </div>

          {/* Class Select */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">Semua Kelas</option>
            {availableClasses.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari siswa / NIS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-44"
            />
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({totalClassStudents})
          </button>
          <button
            onClick={() => setStatusFilter('hadir')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              statusFilter === 'hadir'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Hadir ({hadirCount})
          </button>
          <button
            onClick={() => setStatusFilter('terlambat')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              statusFilter === 'terlambat'
                ? 'bg-amber-600 text-white font-semibold'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Terlambat ({terlambatCount})
          </button>
          <button
            onClick={() => setStatusFilter('unscanned')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              statusFilter === 'unscanned'
                ? 'bg-rose-600 text-white font-semibold'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            Alpa ({alpaCount})
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4 text-center w-12">No</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">NIS</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4 text-center">Waktu Presensi</th>
                <th className="py-3 px-4 text-center">Status Kehadiran</th>
                <th className="py-3 px-4">Metode & Catatan</th>
                <th className="py-3 px-4 text-right">Ubah Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada siswa yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const record = recordMap.get(student.id);
                  const status: AttendanceStatus = record ? record.status : 'alpa';
                  const time = record ? record.time : '-';
                  const isScanned = !!record;

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-slate-50/60 transition ${
                        !isScanned ? 'bg-slate-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center text-slate-400 font-mono">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                              status === 'hadir'
                                ? 'bg-emerald-100 text-emerald-800'
                                : status === 'terlambat'
                                ? 'bg-amber-100 text-amber-800'
                                : status === 'sakit'
                                ? 'bg-sky-100 text-sky-800'
                                : status === 'izin'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {student.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block leading-tight">
                              {student.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        {student.nis}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {student.className}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono text-slate-600">
                        {time}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                            status === 'hadir'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : status === 'terlambat'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : status === 'sakit'
                              ? 'bg-sky-100 text-sky-800 border border-sky-300'
                              : status === 'izin'
                              ? 'bg-purple-100 text-purple-800 border border-purple-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {status === 'hadir'
                            ? 'Hadir'
                            : status === 'terlambat'
                            ? 'Terlambat'
                            : status === 'sakit'
                            ? 'Sakit'
                            : status === 'izin'
                            ? 'Izin'
                            : 'Belum Hadir (Alpa)'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {editingNotesStudentId === student.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={noteInput}
                              onChange={(e) => setNoteInput(e.target.value)}
                              placeholder="Keterangan..."
                              className="px-2 py-1 text-xs rounded border border-slate-300 w-36"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveNotes(student.id)}
                              className="px-2 py-1 rounded bg-emerald-600 text-white text-[11px] font-semibold"
                            >
                              OK
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => handleOpenNotes(student.id, record?.notes)}
                            className="cursor-pointer text-slate-500 hover:text-slate-800 group flex items-center gap-1"
                            title="Klik untuk ubah keterangan"
                          >
                            <span className="truncate max-w-[150px]">
                              {record?.notes || (record ? 'Tanpa catatan' : '-')}
                            </span>
                            {record?.scannedVia && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({record.scannedVia})
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {/* Quick Status Buttons */}
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onUpdateRecordStatus(student.id, 'hadir')}
                            title="Set Hadir"
                            className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                              status === 'hadir'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800'
                            }`}
                          >
                            H
                          </button>
                          <button
                            onClick={() => onUpdateRecordStatus(student.id, 'terlambat')}
                            title="Set Terlambat"
                            className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                              status === 'terlambat'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800'
                            }`}
                          >
                            T
                          </button>
                          <button
                            onClick={() => onUpdateRecordStatus(student.id, 'sakit')}
                            title="Set Sakit"
                            className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                              status === 'sakit'
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-sky-100 text-slate-600 hover:text-sky-800'
                            }`}
                          >
                            S
                          </button>
                          <button
                            onClick={() => onUpdateRecordStatus(student.id, 'izin')}
                            title="Set Izin"
                            className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                              status === 'izin'
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-800'
                            }`}
                          >
                            I
                          </button>
                          <button
                            onClick={() => onUpdateRecordStatus(student.id, 'alpa')}
                            title="Set Alpa"
                            className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                              status === 'alpa'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-800'
                            }`}
                          >
                            A
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
