import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Download,
  CloudUpload,
  Printer,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  Filter
} from 'lucide-react';
import {
  Student,
  AttendanceRecord,
  SchoolSettings,
  Teacher,
  SchoolProfile
} from '../types/attendance';
import { downloadAttendanceExcel, uploadExcelToGoogleDrive } from '../services/excelService';
import { downloadAttendancePdf } from '../services/pdfService';
import { getAccessToken } from '../services/auth';
import { User } from 'firebase/auth';
import { formatIndonesianDate } from '../services/gmail';
import { KotaSolokLogo } from './KotaSolokLogo';

interface ExportDownloadPanelProps {
  students: Student[];
  records: AttendanceRecord[];
  settings: SchoolSettings;
  teachers: Teacher[];
  schools: SchoolProfile[];
  selectedDate: string;
  selectedClass: string;
  currentUser: User | null;
  onExcelSyncedToDrive?: (fileId: string, webViewLink: string) => void;
}

export const ExportDownloadPanel: React.FC<ExportDownloadPanelProps> = ({
  students,
  records,
  settings,
  teachers,
  schools,
  selectedDate,
  selectedClass,
  currentUser,
  onExcelSyncedToDrive,
}) => {
  // Rentang Tanggal Cetak (Date Range)
  const [startDate, setStartDate] = useState<string>(selectedDate);
  const [endDate, setEndDate] = useState<string>(selectedDate);

  const [isDriveUploading, setIsDriveUploading] = useState(false);
  const [driveResult, setDriveResult] = useState<{
    fileId: string;
    webViewLink?: string;
    message: string;
  } | null>(null);
  const [driveError, setDriveError] = useState<string | null>(null);

  const activeSchool = schools.find((s) => s.id === settings.activeSchoolId) || schools[0];
  const activeTeacher = teachers.find((t) => t.id === settings.activeTeacherId) || teachers[0];

  // Quick Preset Handlers
  const handleSetToday = () => {
    setStartDate(selectedDate);
    setEndDate(selectedDate);
  };

  const handleSetLast7Days = () => {
    const end = new Date(selectedDate);
    const start = new Date(selectedDate);
    start.setDate(end.getDate() - 6);
    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(end.toISOString().slice(0, 10));
  };

  const handleSetMonth = () => {
    const d = new Date(selectedDate);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    setStartDate(`${year}-${month}-01`);
    setEndDate(selectedDate);
  };

  // Records within the selected date range
  const recordsInRange = records.filter((r) => {
    const isWithin = r.date >= startDate && r.date <= endDate;
    const isClass = selectedClass === 'all' || r.className === selectedClass;
    return isWithin && isClass;
  });

  // 1. Download Excel Rentang Tanggal
  const handleDownloadExcelRange = () => {
    downloadAttendanceExcel({
      schoolProfile: activeSchool,
      settings,
      students,
      records,
      teachers,
      startDate,
      endDate,
      filterClass: selectedClass,
    });
  };

  // 2. Download Excel Lengkap (Semua Data Database)
  const handleDownloadExcelAll = () => {
    downloadAttendanceExcel(
      {
        schoolProfile: activeSchool,
        settings,
        students,
        records,
        teachers,
      },
      `Database_Presensi_Lengkap_${activeSchool?.name.replace(/\s+/g, '_') || 'Kota_Solok'}.xlsx`
    );
  };

  // 3. Upload Excel to Google Drive
  const handleUploadExcelToDrive = async () => {
    const token = getAccessToken();
    if (!token) {
      setDriveError('Silakan masuk dengan akun Google terlebih dahulu untuk menyimpan Excel ke Google Drive.');
      return;
    }

    setIsDriveUploading(true);
    setDriveError(null);
    setDriveResult(null);

    try {
      const res = await uploadExcelToGoogleDrive(
        {
          schoolProfile: activeSchool,
          settings,
          students,
          records,
          teachers,
          startDate,
          endDate,
          filterClass: selectedClass,
        },
        token,
        settings.googleDriveExcelFileId
      );

      setDriveResult({
        fileId: res.fileId,
        webViewLink: res.webViewLink,
        message: 'File database Excel (.xlsx) berhasil disimpan ke Google Drive!',
      });

      if (onExcelSyncedToDrive) {
        onExcelSyncedToDrive(res.fileId, res.webViewLink || '');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan Excel ke Google Drive';
      setDriveError(msg);
    } finally {
      setIsDriveUploading(false);
    }
  };

  // 4. Download PDF Resmi (Tanpa Kop Surat, Rentang Tanggal)
  const handleDownloadPdf = () => {
    downloadAttendancePdf({
      schoolProfile: activeSchool,
      settings,
      students,
      records,
      activeTeacher,
      startDate,
      endDate,
      className: selectedClass,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden print:hidden">
      {/* Card Header with Kota Solok badge */}
      <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <KotaSolokLogo size="sm" />
          <div>
            <h3 className="text-sm font-extrabold flex items-center gap-2">
              Pusat Cetak & Unduh Laporan
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                PDF & Excel
              </span>
            </h3>
            <p className="text-xs text-slate-300">
              Format cetak bersih (tanpa kop surat) dengan filter rentang tanggal fleksibel
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-300 flex items-center gap-2">
          <span className="bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-lg font-bold">
            {selectedClass === 'all' ? 'Semua Kelas' : selectedClass}
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-[11px] text-slate-300">
            {recordsInRange.length} Data Terpilih
          </span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* RENTANG TANGGAL PICKER SECTION */}
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-700" />
              <span className="text-xs font-bold text-slate-800">
                Tentukan Rentang Tanggal yang Akan Dicetak / Diekspor:
              </span>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={handleSetToday}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  startDate === selectedDate && endDate === selectedDate
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={handleSetLast7Days}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
              >
                7 Hari Terakhir
              </button>
              <button
                type="button"
                onClick={handleSetMonth}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
              >
                Bulan Ini
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Dari Tanggal (Mulai):
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-blue-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Sampai Tanggal (Selesai):
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-blue-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-blue-900 bg-white/70 px-3 py-1.5 rounded-lg border border-blue-100">
            <span>
              Periode Aktif: <strong>{formatIndonesianDate(startDate)}</strong> s.d.{' '}
              <strong>{formatIndonesianDate(endDate)}</strong>
            </span>
            <span className="font-semibold text-emerald-700">
              {startDate === endDate ? '1 Hari Presensi' : 'Rekap Rentang Tanggal'}
            </span>
          </div>
        </div>

        {/* Feedback Message */}
        {driveResult && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">{driveResult.message}</strong>
                <span className="text-[11px] text-emerald-700 font-mono">
                  File ID: {driveResult.fileId}
                </span>
              </div>
            </div>
            {driveResult.webViewLink && (
              <a
                href={driveResult.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-300 flex items-center gap-1 shrink-0 text-[11px]"
              >
                <span>Buka di Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {driveError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{driveError}</span>
          </div>
        )}

        {/* SECTION 1: FORMAT DOKUMEN CETAK & PDF RESMI (TANPA KOP SURAT) */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-rose-100 text-rose-800 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                1. Dokumen Cetak PDF (Bersih Tanpa Kop Surat)
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Layout Bersih & Minimalis</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Download Clean PDF */}
            <button
              onClick={handleDownloadPdf}
              className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 hover:bg-rose-100/60 text-left transition group shadow-2xs"
            >
              <div className="flex items-center justify-between text-rose-800 font-bold text-xs mb-1">
                <span className="flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  Unduh Laporan PDF (Rentang Tanggal)
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-200 text-rose-900">
                  .PDF (A4)
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Dokumen PDF bersih tanpa kop surat, memuat tabel kehadiran periode {startDate} s/d {endDate} dan kolom tanda tangan Kepala Sekolah & Wali Kelas.
              </p>
            </button>

            {/* Print Directly */}
            <button
              onClick={() => window.print()}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition group shadow-2xs"
            >
              <div className="flex items-center justify-between text-slate-800 font-bold text-xs mb-1">
                <span className="flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5" />
                  Cetak Lembar Presensi (Printer)
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                  PRINT
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Buka dialog cetak browser untuk langsung mencetak dokumen presensi ke printer atau simpan sebagai PDF.
              </p>
            </button>
          </div>
        </div>

        {/* NEAT DIVIDER LINE */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-slate-400">
            <span className="bg-white px-3">Format Spreadsheet & Cloud Excel</span>
          </div>
        </div>

        {/* SECTION 2: FORMAT MICROSOFT EXCEL (.xlsx) */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. Format Spreadsheet Microsoft Excel (.xlsx)
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Multi-Sheet Database</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Download Excel Range */}
            <button
              onClick={handleDownloadExcelRange}
              className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-100/60 text-left transition group shadow-2xs"
            >
              <div className="flex items-center justify-between text-emerald-800 font-bold text-xs mb-1">
                <span className="flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  Excel Periode Terpilih
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900">
                  .XLSX
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Ekspor presensi rentang {startDate} s/d {endDate} untuk kelas {selectedClass}.
              </p>
            </button>

            {/* Download Full Database Excel */}
            <button
              onClick={handleDownloadExcelAll}
              className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/40 hover:bg-teal-100/60 text-left transition group shadow-2xs"
            >
              <div className="flex items-center justify-between text-teal-800 font-bold text-xs mb-1">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Database Lengkap Excel
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-200 text-teal-900">
                  4 SHEET
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Seluruh data: Rekap Presensi, Master Siswa, Master Guru & Profil Sekolah.
              </p>
            </button>

            {/* Save Excel to Google Drive */}
            <button
              onClick={handleUploadExcelToDrive}
              disabled={isDriveUploading}
              className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 hover:bg-blue-100/60 text-left transition group shadow-2xs"
            >
              <div className="flex items-center justify-between text-blue-800 font-bold text-xs mb-1">
                <span className="flex items-center gap-1.5">
                  {isDriveUploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CloudUpload className="w-3.5 h-3.5" />
                  )}
                  Simpan Excel ke Drive
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-200 text-blue-900">
                  GOOGLE DRIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Sinkronkan database spreadsheet langsung ke akun Google Drive Anda.
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
