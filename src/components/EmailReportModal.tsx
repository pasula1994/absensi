import React, { useState } from 'react';
import {
  Send,
  X,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Eye,
  Calendar,
  Users,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { Student, AttendanceRecord, SchoolSettings } from '../types/attendance';
import { sendDailyAttendanceEmail, generateEmailHtml, formatIndonesianDate } from '../services/gmail';
import { getAccessToken, googleSignIn } from '../services/auth';
import { User } from 'firebase/auth';
import { KotaSolokLogo } from './KotaSolokLogo';

interface EmailReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  records: AttendanceRecord[];
  settings: SchoolSettings;
  selectedDate: string;
  currentUser: User | null;
  onLoginSuccess: (user: User, token: string) => void;
}

export const EmailReportModal: React.FC<EmailReportModalProps> = ({
  isOpen,
  onClose,
  students,
  records,
  settings,
  selectedDate,
  currentUser,
  onLoginSuccess,
}) => {
  const [recipientEmail, setRecipientEmail] = useState(
    settings.teacherEmail || currentUser?.email || 'yet.mi01@gmail.com'
  );
  const [selectedClass, setSelectedClass] = useState(settings.defaultClass || 'X-MIPA 1');
  const [previewTab, setPreviewTab] = useState<'preview' | 'html'>('preview');

  // Confirmation step
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const availableClasses = Array.from(
    new Set([...settings.classes, ...students.map((s) => s.className)])
  ).filter(Boolean);

  const reportOptions = {
    toEmail: recipientEmail,
    teacherName: settings.teacherName || currentUser?.displayName || 'Guru / Wali Kelas',
    schoolSettings: settings,
    className: selectedClass,
    dateStr: selectedDate,
    students,
    records,
  };

  const { html, subject } = generateEmailHtml(reportOptions);

  const classStudents = students.filter((s) => s.className === selectedClass);
  const dateRecords = records.filter(
    (r) => r.date === selectedDate && classStudents.some((s) => s.id === r.studentId)
  );

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        onLoginSuccess(res.user, res.accessToken);
        if (!recipientEmail && res.user.email) {
          setRecipientEmail(res.user.email);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal login dengan Google';
      setErrorMessage(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSendEmail = async () => {
    const token = getAccessToken();
    if (!token) {
      setErrorMessage('Token Google Workspace belum aktif. Silakan hubungkan akun Google terlebih dahulu.');
      return;
    }

    if (!recipientEmail || !recipientEmail.includes('@')) {
      setErrorMessage('Mohon masukkan alamat email penerima yang valid.');
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    try {
      const result = await sendDailyAttendanceEmail(reportOptions, token);
      setSendSuccess(
        `Laporan kehadiran berhasil dikirim ke ${recipientEmail}! (ID Pesan: ${result.messageId.substring(0, 12)}...)`
      );
      setShowConfirm(false);
    } catch (err: unknown) {
      console.error('Email send error:', err);
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat mengirim email.';
      setErrorMessage(
        msg.includes('401') || msg.includes('403')
          ? 'Izin Gmail belum diberikan atau sesi berakhir. Silakan login ulang dengan akun Google.'
          : msg
      );
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KotaSolokLogo size="sm" />
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Kirim Laporan Kehadiran ke Email Guru
              </h2>
              <p className="text-xs text-slate-300">
                Laporan resmi otomatis dengan rekap persentase, siswa hadir, sakit, izin & alpa
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

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Notification Messages */}
          {sendSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-sm text-emerald-900 mb-0.5">
                  Pengiriman Berhasil!
                </strong>
                <span>{sendSuccess}</span>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-sm text-rose-900 mb-0.5">
                  Peringatan
                </strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Google Auth Status Banner */}
          {!currentUser ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold block text-slate-900">
                    Koneksi Google Workspace Diperlukan
                  </span>
                  <span className="text-slate-600">
                    Masuk dengan akun Google untuk mengirim email langsung lewat Gmail API dan sinkron ke Google Drive.
                  </span>
                </div>
              </div>
              <button
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs shrink-0 transition"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                )}
                <span>Masuk dengan Google</span>
              </button>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
              <span className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Terhubung sebagai <strong>{currentUser.email}</strong>
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Gmail API Aktif
              </span>
            </div>
          )}

          {/* Form Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kirim Laporan ke Email Guru / Wali Kelas:
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="guru@sekolah.sch.id"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pilih Kelas:
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 bg-white"
              >
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls} ({students.filter((s) => s.className === cls).length} Siswa)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Email Preview Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="text-xs">
              <span className="font-semibold text-slate-500">Subjek: </span>
              <span className="font-bold text-slate-900">{subject}</span>
            </div>
            <div className="flex gap-1 text-xs">
              <button
                onClick={() => setPreviewTab('preview')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  previewTab === 'preview'
                    ? 'bg-indigo-100 text-indigo-800 font-semibold'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                Pratinjau Tampilan
              </button>
            </div>
          </div>

          {/* Interactive Email Preview Sandbox */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 p-2 max-h-72 overflow-y-auto">
            <div
              className="bg-white rounded-lg shadow-inner overflow-hidden"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </div>

        {/* Modal Footer & Confirmation Dialog (MANDATORY per Workspace Skill) */}
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            <span>Tanggal Laporan: </span>
            <strong className="text-slate-800">{formatIndonesianDate(selectedDate)}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
            >
              Tutup
            </button>

            {!showConfirm ? (
              <button
                onClick={() => setShowConfirm(true)}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Laporan Ini</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 animate-fade-in">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={isSending}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                >
                  {isSending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Konfirmasi & Kirim Sekarang</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
