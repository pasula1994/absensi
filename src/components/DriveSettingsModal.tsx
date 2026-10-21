import React, { useState } from 'react';
import {
  Settings,
  HardDrive,
  CloudUpload,
  CloudDownload,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Loader2,
  X,
  ExternalLink,
  Save,
  Download,
  Upload,
  Clock,
  School,
  Mail,
  UserCheck,
  FileSpreadsheet,
  Image as ImageIcon
} from 'lucide-react';
import {
  SchoolSettings,
  Student,
  AttendanceRecord,
  Teacher,
  SchoolProfile
} from '../types/attendance';
import {
  saveDriveDatabase,
  readDriveDatabase,
  findDriveDatabaseFile,
  DriveDatabasePayload
} from '../services/googleDrive';
import { uploadExcelToGoogleDrive, downloadAttendanceExcel } from '../services/excelService';
import { getAccessToken, googleSignIn } from '../services/auth';
import { User } from 'firebase/auth';
import { KotaSolokLogo } from './KotaSolokLogo';

interface DriveSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SchoolSettings;
  onUpdateSettings: (newSettings: SchoolSettings) => void;
  students: Student[];
  records: AttendanceRecord[];
  teachers: Teacher[];
  schools: SchoolProfile[];
  onLoadDataFromDrive: (payload: DriveDatabasePayload) => void;
  currentUser: User | null;
  onLoginSuccess: (user: User, token: string) => void;
}

export const DriveSettingsModal: React.FC<DriveSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  students,
  records,
  teachers,
  schools,
  onLoadDataFromDrive,
  currentUser,
  onLoginSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'drive' | 'excel' | 'school'>('drive');
  const [localSettings, setLocalSettings] = useState<SchoolSettings>(settings);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isExcelSyncing, setIsExcelSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [driveFileLink, setDriveFileLink] = useState<string | null>(null);
  const [driveExcelLink, setDriveExcelLink] = useState<string | null>(settings.driveExcelWebViewLink || null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [newClassInput, setNewClassInput] = useState('');

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file logo maksimal 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLocalSettings((prev) => ({ ...prev, schoolLogoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const activeSchool = schools.find((s) => s.id === localSettings.activeSchoolId) || schools[0];

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setSyncStatus(null);
    try {
      const res = await googleSignIn();
      if (res) {
        onLoginSuccess(res.user, res.accessToken);
        setSyncStatus({
          type: 'success',
          message: 'Berhasil terhubung dengan Google Drive & Gmail.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal login ke Google';
      setSyncStatus({ type: 'error', message: msg });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Sync / Push JSON to Google Drive
  const handleSaveToDrive = async () => {
    const token = getAccessToken();
    if (!token) {
      setSyncStatus({
        type: 'error',
        message: 'Silakan masuk dengan akun Google terlebih dahulu untuk menyimpan ke Google Drive.',
      });
      return;
    }

    setIsSyncing(true);
    setSyncStatus(null);

    try {
      const payload: DriveDatabasePayload = {
        version: '1.0.0',
        updatedAt: new Date().toISOString(),
        schoolSettings: localSettings,
        students,
        attendanceRecords: records,
      };

      const result = await saveDriveDatabase(payload, token, localSettings.googleDriveFileId);

      const updatedSettings = {
        ...localSettings,
        googleDriveFileId: result.fileId,
        lastSyncedAt: result.updatedAt,
      };

      setLocalSettings(updatedSettings);
      onUpdateSettings(updatedSettings);

      if (result.webViewLink) {
        setDriveFileLink(result.webViewLink);
      }

      setSyncStatus({
        type: 'success',
        message: `Database JSON berhasil disimpan dan disinkronkan ke Google Drive! (ID: ${result.fileId})`,
      });
    } catch (err: unknown) {
      console.error('Drive save error:', err);
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan ke Google Drive';
      setSyncStatus({ type: 'error', message: msg });
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync / Push Excel to Google Drive
  const handleSaveExcelToDrive = async () => {
    const token = getAccessToken();
    if (!token) {
      setSyncStatus({
        type: 'error',
        message: 'Silakan masuk dengan akun Google terlebih dahulu.',
      });
      return;
    }

    setIsExcelSyncing(true);
    setSyncStatus(null);

    try {
      const res = await uploadExcelToGoogleDrive(
        {
          schoolProfile: activeSchool,
          settings: localSettings,
          students,
          records,
          teachers,
        },
        token,
        localSettings.googleDriveExcelFileId
      );

      const updatedSettings = {
        ...localSettings,
        googleDriveExcelFileId: res.fileId,
        driveExcelWebViewLink: res.webViewLink || localSettings.driveExcelWebViewLink,
        lastExcelSyncedAt: res.updatedAt,
      };

      setLocalSettings(updatedSettings);
      onUpdateSettings(updatedSettings);

      if (res.webViewLink) {
        setDriveExcelLink(res.webViewLink);
      }

      setSyncStatus({
        type: 'success',
        message: `Database Excel (.xlsx) berhasil disimpan ke Google Drive! Anda dapat membukanya langsung di spreadsheet online.`,
      });
    } catch (err: unknown) {
      console.error('Drive excel error:', err);
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan file Excel ke Google Drive';
      setSyncStatus({ type: 'error', message: msg });
    } finally {
      setIsExcelSyncing(false);
    }
  };

  // Pull / Load from Google Drive
  const handleLoadFromDrive = async () => {
    const token = getAccessToken();
    if (!token) {
      setSyncStatus({
        type: 'error',
        message: 'Silakan masuk dengan akun Google terlebih dahulu.',
      });
      return;
    }

    setIsPulling(true);
    setSyncStatus(null);

    try {
      const fileInfo = await findDriveDatabaseFile(token);
      if (!fileInfo) {
        setSyncStatus({
          type: 'error',
          message: 'File database belum ditemukan di Google Drive Anda. Silakan simpan database terlebih dahulu.',
        });
        return;
      }

      const driveData = await readDriveDatabase(fileInfo.id, token);
      onLoadDataFromDrive(driveData);

      setLocalSettings(driveData.schoolSettings);
      onUpdateSettings(driveData.schoolSettings);

      setSyncStatus({
        type: 'success',
        message: `Berhasil memuat ${driveData.students.length} siswa dan ${driveData.attendanceRecords.length} catatan absensi dari Google Drive!`,
      });
    } catch (err: unknown) {
      console.error('Drive pull error:', err);
      const msg = err instanceof Error ? err.message : 'Gagal membaca database dari Google Drive';
      setSyncStatus({ type: 'error', message: msg });
    } finally {
      setIsPulling(false);
    }
  };

  // Save School Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(localSettings);
    setSyncStatus({
      type: 'success',
      message: 'Pengaturan sekolah dan guru berhasil disimpan!',
    });
  };

  // Download JSON backup
  const handleDownloadBackup = () => {
    const payload = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      schoolSettings: localSettings,
      students,
      attendanceRecords: records,
      teachers,
      schools,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hadirku_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAddClass = () => {
    if (!newClassInput.trim()) return;
    if (!localSettings.classes.includes(newClassInput.trim())) {
      setLocalSettings({
        ...localSettings,
        classes: [...localSettings.classes, newClassInput.trim()],
      });
    }
    setNewClassInput('');
  };

  const handleRemoveClass = (clsToRemove: string) => {
    setLocalSettings({
      ...localSettings,
      classes: localSettings.classes.filter((c) => c !== clsToRemove),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header with Kota Solok emblem */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KotaSolokLogo size="sm" />
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Database Google Drive & Pengaturan
              </h2>
              <p className="text-xs text-slate-300">
                Penyimpanan cloud Google Drive berbasis Excel (.xlsx) dan JSON
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('excel')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition border-t border-x flex items-center gap-1.5 ${
              activeTab === 'excel'
                ? 'bg-white text-emerald-700 border-slate-200 shadow-2xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Database Excel di Drive</span>
          </button>
          <button
            onClick={() => setActiveTab('drive')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition border-t border-x flex items-center gap-1.5 ${
              activeTab === 'drive'
                ? 'bg-white text-emerald-700 border-slate-200 shadow-2xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5 text-blue-600" />
            <span>Sync JSON Drive</span>
          </button>
          <button
            onClick={() => setActiveTab('school')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition border-t border-x flex items-center gap-1.5 ${
              activeTab === 'school'
                ? 'bg-white text-emerald-700 border-slate-200 shadow-2xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <School className="w-3.5 h-3.5 text-indigo-600" />
            <span>Preferensi Sistem</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {syncStatus && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 animate-fade-in ${
                syncStatus.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {syncStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{syncStatus.message}</span>
            </div>
          )}

          {/* TAB EXCEL DRIVE */}
          {activeTab === 'excel' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Database Berbasis Excel (.xlsx) di Google Drive
                      </h4>
                      <p className="text-[11px] text-slate-600">
                        Format Microsoft Excel kompatibel dengan Google Sheets online
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
                    4 SHEET
                  </span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-emerald-100 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Nama File:</span>
                    <span className="font-mono font-semibold text-emerald-800">
                      hadirku_database_Kota_Solok.xlsx
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Terakhir Disinkronkan:</span>
                    <span className="font-mono">
                      {localSettings.lastExcelSyncedAt
                        ? new Date(localSettings.lastExcelSyncedAt).toLocaleString('id-ID')
                        : 'Belum pernah'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Rincian Lembar Kerja:</span>
                    <span className="text-slate-800 font-semibold">
                      Rekap_Presensi, Master_Siswa, Master_Guru, Profil_Sekolah
                    </span>
                  </div>
                </div>

                {driveExcelLink && (
                  <div>
                    <a
                      href={driveExcelLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1.5 hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka File Excel Database di Google Drive / Google Sheets</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Action Buttons for Excel */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleSaveExcelToDrive}
                  disabled={isExcelSyncing}
                  className="p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition"
                >
                  {isExcelSyncing ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <CloudUpload className="w-4 h-4" />
                  )}
                  <span>Simpan Excel ke Google Drive</span>
                </button>

                <button
                  onClick={() =>
                    downloadAttendanceExcel({
                      schoolProfile: activeSchool,
                      settings: localSettings,
                      students,
                      records,
                      teachers,
                    })
                  }
                  className="p-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>Unduh File Excel (.xlsx) Lokal</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB JSON DRIVE */}
          {activeTab === 'drive' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {currentUser ? currentUser.displayName || 'Akun Google' : 'Google Workspace'}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono">
                      {currentUser ? currentUser.email : 'Belum terhubung'}
                    </p>
                  </div>
                </div>

                {!currentUser ? (
                  <button
                    onClick={handleGoogleLogin}
                    disabled={isLoggingIn}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
                  >
                    {isLoggingIn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Hubungkan Google Drive</span>
                  </button>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    Terhubung & Aktif
                  </span>
                )}
              </div>

              {/* JSON Drive Storage Details */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">File Database JSON:</span>
                  <span className="font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    hadirku_attendance_database.json
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Terakhir Disinkronkan:</span>
                  <span className="font-mono">
                    {localSettings.lastSyncedAt
                      ? new Date(localSettings.lastSyncedAt).toLocaleString('id-ID')
                      : 'Belum pernah'}
                  </span>
                </div>
                {driveFileLink && (
                  <div className="pt-2">
                    <a
                      href={driveFileLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1"
                    >
                      <span>Buka File JSON di Google Drive</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleSaveToDrive}
                  disabled={isSyncing}
                  className="p-3 rounded-xl border border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-900 text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  {isSyncing ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                  ) : (
                    <CloudUpload className="w-4 h-4 text-emerald-700" />
                  )}
                  <span>Simpan JSON ke Drive</span>
                </button>

                <button
                  onClick={handleLoadFromDrive}
                  disabled={isPulling}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  {isPulling ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                  ) : (
                    <CloudDownload className="w-4 h-4 text-slate-600" />
                  )}
                  <span>Muat Data dari Drive</span>
                </button>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <button
                  onClick={handleDownloadBackup}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh File Cadangan JSON (.json)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB SCHOOL PREFERENCES */}
          {activeTab === 'school' && (
            <form onSubmit={handleSaveSettings} className="space-y-3.5">
              {/* Input Logo Sekolah */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Logo / Lambang Sekolah
                  </label>
                  <span className="text-[10px] text-slate-400">PNG, JPG (Maks. 2MB)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-2xs">
                    {localSettings.schoolLogoUrl ? (
                      <img
                        src={localSettings.schoolLogoUrl}
                        alt="Logo"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="cursor-pointer px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition">
                        <Upload className="w-3.5 h-3.5 text-blue-600" />
                        <span>Upload Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                      {localSettings.schoolLogoUrl && (
                        <button
                          type="button"
                          onClick={() => setLocalSettings((prev) => ({ ...prev, schoolLogoUrl: '' }))}
                          className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-medium"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                    <input
                      type="url"
                      placeholder="Atau URL logo (https://...)"
                      value={localSettings.schoolLogoUrl || ''}
                      onChange={(e) =>
                        setLocalSettings({ ...localSettings, schoolLogoUrl: e.target.value })
                      }
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Batas Jam Terlambat *
                  </label>
                  <input
                    type="time"
                    required
                    value={localSettings.lateThresholdTime}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, lateThresholdTime: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kelas Default
                  </label>
                  <input
                    type="text"
                    value={localSettings.defaultClass}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, defaultClass: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Class List Editor */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Daftar Kelas Aktif
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {localSettings.classes.map((cls) => (
                    <span
                      key={cls}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-medium"
                    >
                      <span>{cls}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveClass(cls)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newClassInput}
                    onChange={(e) => setNewClassInput(e.target.value)}
                    placeholder="Tambah nama kelas (cth: X-MIPA 3)"
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300"
                  />
                  <button
                    type="button"
                    onClick={handleAddClass}
                    className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-xl"
                  >
                    Tambah
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Preferensi</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
