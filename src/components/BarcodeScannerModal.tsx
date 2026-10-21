import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import {
  Camera,
  X,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  Maximize2,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { Student, AttendanceRecord, SchoolSettings } from '../types/attendance';
import { sound } from '../services/sound';
import { getCurrentTimeStr, getTodayDateStr } from '../utils/initialData';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  settings: SchoolSettings;
  onRecordAdded: (record: AttendanceRecord) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  students,
  attendanceRecords,
  settings,
  onRecordAdded,
}) => {
  const [manualNis, setManualNis] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScannedStudent, setLastScannedStudent] = useState<{
    student: Student;
    record: AttendanceRecord;
    isDuplicate: boolean;
  } | null>(null);
  const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);
  const [recentScans, setRecentScans] = useState<{ student: Student; time: string; status: string }[]>([]);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const manualInputRef = useRef<HTMLInputElement | null>(null);
  const lastProcessedCodeRef = useRef<{ code: string; time: number } | null>(null);

  // Trigger confetti for celebratory scan
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10b981', '#38bdf8', '#fbbf24', '#a855f7'],
      });
    } catch {
      // ignore
    }
  };

  // Process barcode or NIS
  const handleProcessCode = (scannedCode: string) => {
    const cleanCode = scannedCode.trim();
    if (!cleanCode) return;

    // Debounce fast multi-scan from camera of same code within 2.5 seconds
    const now = Date.now();
    if (
      lastProcessedCodeRef.current &&
      lastProcessedCodeRef.current.code === cleanCode &&
      now - lastProcessedCodeRef.current.time < 2500
    ) {
      return;
    }
    lastProcessedCodeRef.current = { code: cleanCode, time: now };

    // Search student by NIS or ID
    const student = students.find(
      (s) => s.nis.toLowerCase() === cleanCode.toLowerCase() || s.id.toLowerCase() === cleanCode.toLowerCase()
    );

    const today = getTodayDateStr();
    const currentTime = getCurrentTimeStr();

    if (!student) {
      if (soundEnabled) sound.playError();
      setScanMessage({
        type: 'error',
        text: `Barcode / NIS "${cleanCode}" tidak ditemukan di database.`,
      });
      setLastScannedStudent(null);
      return;
    }

    // Check if student already checked in today
    const existingRecord = attendanceRecords.find(
      (r) => r.studentId === student.id && r.date === today
    );

    if (existingRecord) {
      if (soundEnabled) sound.playWarning();
      setScanMessage({
        type: 'warning',
        text: `${student.name} sudah tercatat ${existingRecord.status.toUpperCase()} pukul ${existingRecord.time} WIB.`,
      });
      setLastScannedStudent({
        student,
        record: existingRecord,
        isDuplicate: true,
      });
      return;
    }

    // Determine status (hadir or terlambat)
    const [currH, currM] = currentTime.split(':').map(Number);
    const [lateH, lateM] = (settings.lateThresholdTime || '07:15').split(':').map(Number);
    const isLate = currH > lateH || (currH === lateH && currM > lateM);

    const newRecord: AttendanceRecord = {
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      studentId: student.id,
      studentNis: student.nis,
      studentName: student.name,
      className: student.className,
      date: today,
      time: currentTime,
      status: isLate ? 'terlambat' : 'hadir',
      notes: isLate ? `Terlambat (setelah ${settings.lateThresholdTime})` : 'Tepat Waktu',
      scannedVia: 'barcode',
    };

    onRecordAdded(newRecord);
    if (soundEnabled) sound.playSuccess();
    triggerConfetti();

    setLastScannedStudent({
      student,
      record: newRecord,
      isDuplicate: false,
    });

    setScanMessage({
      type: 'success',
      text: `Presensi Berhasil! ${student.name} (${newRecord.status.toUpperCase()})`,
    });

    setRecentScans((prev) => [
      { student, time: currentTime, status: newRecord.status },
      ...prev.slice(0, 9),
    ]);
  };

  // Start Camera
  const startCamera = async () => {
    try {
      setCameraError(null);
      const scannerElement = document.getElementById('barcode-reader-container');
      if (!scannerElement) return;

      const formatsToSupport = [
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
      ];

      const html5QrCode = new Html5Qrcode('barcode-reader-container', {
        formatsToSupport,
        verbose: false,
      });
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: 260, height: 180 },
          aspectRatio: 1.333,
        },
        (decodedText) => {
          handleProcessCode(decodedText);
        },
        () => {
          // scanning frame - no qr code detected yet, ignore
        }
      );
      setCameraActive(true);
    } catch (err) {
      console.error('Camera start error:', err);
      setCameraError('Kamera tidak dapat diakses atau izin ditolak. Anda tetap dapat menggunakan input manual / alat scanner barcode USB.');
      setCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = async () => {
    if (html5QrCodeRef.current && cameraActive) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Camera stop error:', err);
      }
      setCameraActive(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Focus the manual input for USB barcode gun
      setTimeout(() => {
        manualInputRef.current?.focus();
      }, 200);

      // Start camera automatically
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualNis.trim()) return;
    handleProcessCode(manualNis);
    setManualNis('');
    manualInputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Scan Barcode / QR Presensi
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Arahkan kartu barcode siswa ke kamera atau gunakan scanner barcode USB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition ${
                soundEnabled
                  ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title={soundEnabled ? 'Suara Aktif' : 'Suara Senyap'}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-y-auto">
          {/* Left Column: Camera Viewfinder & Manual Input */}
          <div className="md:col-span-7 p-5 flex flex-col gap-4 border-r border-slate-100 bg-slate-50/50">
            {/* Camera Viewfinder */}
            <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 aspect-4/3 flex items-center justify-center shadow-inner">
              <div id="barcode-reader-container" className="w-full h-full" />

              {!cameraActive && !cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-slate-300 p-4 text-center">
                  <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-3" />
                  <p className="text-sm font-medium">Menghubungkan ke kamera...</p>
                </div>
              )}

              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 text-slate-300 p-6 text-center">
                  <AlertTriangle className="w-10 h-10 text-amber-400 mb-2" />
                  <p className="text-sm font-semibold text-white mb-1">Akses Kamera Terkendala</p>
                  <p className="text-xs text-slate-400 mb-4">{cameraError}</p>
                  <button
                    onClick={startCamera}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
                  >
                    Coba Lagi
                  </button>
                </div>
              )}

              {/* Aiming Reticle Overlay */}
              {cameraActive && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-40 border-2 border-emerald-400/80 rounded-xl relative shadow-lg">
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400" />
                    <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-emerald-400/70 shadow-sm animate-pulse" />
                  </div>
                </div>
              )}
            </div>

            {/* Manual NIS / Barcode Scanner Gun Input */}
            <form onSubmit={handleManualSubmit} className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Pindai Barcode Gun atau Ketik NIS Siswa:
              </label>
              <div className="flex gap-2">
                <input
                  ref={manualInputRef}
                  type="text"
                  value={manualNis}
                  onChange={(e) => setManualNis(e.target.value)}
                  placeholder="Contoh: 20261001 (tekan Enter)"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-sm font-mono transition bg-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center gap-1.5 transition shadow-sm"
                >
                  <span>Proses</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                Dapat menggunakan alat Barcode Scanner USB / Bluetooth secara otomatis tanpa klik.
              </p>
            </form>
          </div>

          {/* Right Column: Scan Result & Live Attendance Stream */}
          <div className="md:col-span-5 p-5 flex flex-col justify-between bg-white overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Hasil Pemindaian Terakhir
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Batas Jam: {settings.lateThresholdTime || '07:15'}
                </span>
              </div>

              {/* Status Banner */}
              {scanMessage && (
                <div
                  className={`p-3 rounded-xl mb-4 text-xs font-medium flex items-start gap-2 animate-fade-in ${
                    scanMessage.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : scanMessage.type === 'warning'
                      ? 'bg-amber-50 border border-amber-200 text-amber-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}
                >
                  {scanMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : scanMessage.type === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{scanMessage.text}</span>
                </div>
              )}

              {/* Scanned Student Card */}
              {lastScannedStudent ? (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 shadow-sm relative overflow-hidden mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center font-bold text-emerald-800 text-base shrink-0">
                      {lastScannedStudent.student.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-slate-900 text-sm truncate">
                        {lastScannedStudent.student.name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        NIS: <span className="font-mono font-medium">{lastScannedStudent.student.nis}</span> • {lastScannedStudent.student.className}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {lastScannedStudent.record.time} WIB
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] ${
                        lastScannedStudent.record.status === 'hadir'
                          ? 'bg-emerald-500 text-white'
                          : lastScannedStudent.record.status === 'terlambat'
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {lastScannedStudent.record.status}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 mb-5">
                  <UserCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs">Menunggu pemindaian barcode siswa berikutnya...</p>
                </div>
              )}

              {/* Recent Scans in this session */}
              <div>
                <h5 className="text-xs font-bold text-slate-600 mb-2">
                  Riwayat Sesi Ini ({recentScans.length})
                </h5>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {recentScans.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Belum ada siswa yang dipindai pada sesi ini.</p>
                  ) : (
                    recentScans.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                      >
                        <span className="font-medium text-slate-800 truncate mr-2">
                          {item.student.name}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-slate-400 font-mono text-[11px]">{item.time}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              item.status === 'hadir'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">
                Total Hadir Hari Ini: {attendanceRecords.filter((r) => r.date === getTodayDateStr()).length} Siswa
              </span>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                Selesai / Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
