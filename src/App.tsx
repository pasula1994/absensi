import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MonthlyPresenceView } from './components/MonthlyPresenceView';
import { TodayAttendanceView } from './components/TodayAttendanceView';
import { StudentCardsView } from './components/StudentCardsView';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { EmailReportModal } from './components/EmailReportModal';
import { DriveSettingsModal } from './components/DriveSettingsModal';
import { ManualCheckInModal } from './components/ManualCheckInModal';
import { TeacherSchoolCrudModal } from './components/TeacherSchoolCrudModal';
import {
  Student,
  AttendanceRecord,
  SchoolSettings,
  AttendanceStatus,
  Teacher,
  SchoolProfile
} from './types/attendance';
import {
  DEFAULT_SETTINGS,
  INITIAL_STUDENTS,
  INITIAL_TEACHERS,
  INITIAL_SCHOOLS,
  createInitialAttendanceRecords,
  getTodayDateStr
} from './utils/initialData';
import { initAuth, googleSignIn, logout, getAccessToken, setAccessToken } from './services/auth';
import { findDriveDatabaseFile, saveDriveDatabase, DriveDatabasePayload } from './services/googleDrive';
import { User } from 'firebase/auth';
import {
  CheckCircle2,
  AlertTriangle,
  X,
  Camera,
  HelpCircle,
  Bell,
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';

export default function App() {
  // Navigation View: 'monthly' (matches screenshot!) | 'daily' | 'students' | 'announcements'
  const [currentView, setCurrentView] = useState<'daily' | 'monthly' | 'students' | 'announcements'>('monthly');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isTeacherSchoolModalOpen, setIsTeacherSchoolModalOpen] = useState(false);
  const [teacherSchoolModalTab, setTeacherSchoolModalTab] = useState<'teachers' | 'schools'>('teachers');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateStr());

  // Data states with localStorage persistence
  const [settings, setSettings] = useState<SchoolSettings>(() => {
    try {
      const saved = localStorage.getItem('hadirku_settings');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [schools, setSchools] = useState<SchoolProfile[]>(() => {
    try {
      const saved = localStorage.getItem('hadirku_schools');
      return saved ? JSON.parse(saved) : INITIAL_SCHOOLS;
    } catch {
      return INITIAL_SCHOOLS;
    }
  });

  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    try {
      const saved = localStorage.getItem('hadirku_teachers');
      return saved ? JSON.parse(saved) : INITIAL_TEACHERS;
    } catch {
      return INITIAL_TEACHERS;
    }
  });

  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem('hadirku_students');
      return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
    } catch {
      return INITIAL_STUDENTS;
    }
  });

  const [records, setRecords] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem('hadirku_records');
      return saved ? JSON.parse(saved) : createInitialAttendanceRecords();
    } catch {
      return createInitialAttendanceRecords();
    }
  });

  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Toast feedback state
  const [toast, setToast] = useState<{ type: 'success' | 'info' | 'warning'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('hadirku_settings', JSON.stringify(settings));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem('hadirku_schools', JSON.stringify(schools));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [schools]);

  useEffect(() => {
    try {
      localStorage.setItem('hadirku_teachers', JSON.stringify(teachers));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [teachers]);

  useEffect(() => {
    try {
      localStorage.setItem('hadirku_students', JSON.stringify(students));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [students]);

  useEffect(() => {
    try {
      localStorage.setItem('hadirku_records', JSON.stringify(records));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [records]);

  // Initialize Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
        if (!settings.teacherEmail && user.email) {
          setSettings((prev) => ({ ...prev, teacherEmail: user.email! }));
        }
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setAccessToken(res.accessToken);
        if (res.user.email) {
          setSettings((prev) => ({
            ...prev,
            teacherEmail: prev.teacherEmail || res.user.email!,
            teacherName: prev.teacherName || res.user.displayName || 'Guru',
          }));
        }
        showToast(`Selamat datang, ${res.user.displayName || res.user.email}! Terhubung ke Google Drive.`);

        try {
          const driveFile = await findDriveDatabaseFile(res.accessToken);
          if (driveFile) {
            showToast(`File database ditemukan di Google Drive (${driveFile.name}).`, 'info');
          }
        } catch (driveErr) {
          console.warn('Drive check notice:', driveErr);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal masuk dengan Google';
      showToast(msg, 'warning');
    }
  };

  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
    setAccessToken(null);
    showToast('Berhasil keluar dari akun Google.', 'info');
  };

  // Add Attendance Record (from Barcode Scanner or Manual)
  const handleRecordAdded = (newRecord: AttendanceRecord) => {
    setRecords((prev) => {
      const existingIdx = prev.findIndex(
        (r) => r.studentId === newRecord.studentId && r.date === newRecord.date
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = newRecord;
        return updated;
      }
      return [newRecord, ...prev];
    });

    // Auto sync to Google Drive in background if logged in
    const token = getAccessToken();
    if (token && currentUser) {
      const payload: DriveDatabasePayload = {
        version: '1.0.0',
        updatedAt: new Date().toISOString(),
        schoolSettings: settings,
        students,
        attendanceRecords: [newRecord, ...records],
        teachers,
        schools,
      };
      saveDriveDatabase(payload, token, settings.googleDriveFileId)
        .then((res) => {
          setSettings((prev) => ({
            ...prev,
            googleDriveFileId: res.fileId,
            lastSyncedAt: res.updatedAt,
          }));
        })
        .catch((e) => console.warn('Background drive sync notice:', e));
    }
  };

  // Update Record Status manually (e.g. Set to Sakit / Izin / Hadir)
  const handleUpdateRecordStatus = (
    studentId: string,
    status: AttendanceStatus,
    notes?: string
  ) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const existingIdx = records.findIndex(
      (r) => r.studentId === studentId && r.date === selectedDate
    );

    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    if (existingIdx >= 0) {
      setRecords((prev) => {
        const copy = [...prev];
        copy[existingIdx] = {
          ...copy[existingIdx],
          status,
          notes: notes !== undefined ? notes : copy[existingIdx].notes,
        };
        return copy;
      });
    } else {
      const newRec: AttendanceRecord = {
        id: `rec-${Date.now()}`,
        studentId: student.id,
        studentNis: student.nis,
        studentName: student.name,
        className: student.className,
        date: selectedDate,
        time: timeStr,
        status,
        notes: notes || '',
        scannedVia: 'manual',
      };
      setRecords((prev) => [newRec, ...prev]);
    }

    showToast(`Status ${student.name} diubah menjadi ${status.toUpperCase()}`);
  };

  // Student CRUD
  const handleAddStudent = (student: Student) => {
    setStudents((prev) => [...prev, student]);
    showToast(`Siswa ${student.name} (NIS: ${student.nis}) berhasil ditambahkan.`);
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s))
    );
    showToast(`Data siswa ${updatedStudent.name} berhasil diperbarui.`);
  };

  const handleDeleteStudent = (studentId: string) => {
    const target = students.find((s) => s.id === studentId);
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    setRecords((prev) => prev.filter((r) => r.studentId !== studentId));
    showToast(`Data siswa ${target ? target.name : ''} telah dihapus.`, 'info');
  };

  // Teacher CRUD Handlers
  const handleAddTeacher = (teacher: Teacher) => {
    setTeachers((prev) => [...prev, teacher]);
    showToast(`Guru ${teacher.name} berhasil ditambahkan.`);
  };

  const handleUpdateTeacher = (updatedTeacher: Teacher) => {
    setTeachers((prev) =>
      prev.map((t) => (t.id === updatedTeacher.id ? updatedTeacher : t))
    );
    if (settings.activeTeacherId === updatedTeacher.id) {
      setSettings((prev) => ({
        ...prev,
        teacherName: updatedTeacher.name,
        teacherEmail: updatedTeacher.email,
        teacherSubject: updatedTeacher.subject,
      }));
    }
    showToast(`Data guru ${updatedTeacher.name} berhasil diperbarui.`);
  };

  const handleDeleteTeacher = (id: string) => {
    setTeachers((prev) => prev.filter((t) => t.id !== id));
    showToast('Data guru berhasil dihapus.', 'info');
  };

  const handleSelectActiveTeacher = (teacher: Teacher) => {
    setSettings((prev) => ({
      ...prev,
      activeTeacherId: teacher.id,
      teacherName: teacher.name,
      teacherEmail: teacher.email,
      teacherSubject: teacher.subject,
      defaultClass: teacher.homeroomClass || prev.defaultClass,
    }));
    showToast(`${teacher.name} dijadikan sebagai guru/wali kelas aktif presensi.`);
  };

  // School Profile CRUD Handlers
  const handleAddSchool = (school: SchoolProfile) => {
    setSchools((prev) => [...prev, school]);
    showToast(`Sekolah ${school.name} berhasil didaftarkan.`);
  };

  const handleUpdateSchool = (updatedSchool: SchoolProfile) => {
    setSchools((prev) =>
      prev.map((s) => (s.id === updatedSchool.id ? updatedSchool : s))
    );
    if (settings.activeSchoolId === updatedSchool.id || settings.schoolName === updatedSchool.name) {
      setSettings((prev) => ({
        ...prev,
        schoolName: updatedSchool.name,
        schoolAddress: updatedSchool.address,
        city: updatedSchool.city,
        schoolLogoUrl: updatedSchool.logoUrl !== undefined ? updatedSchool.logoUrl : prev.schoolLogoUrl,
      }));
    }
    showToast(`Profil sekolah ${updatedSchool.name} berhasil diperbarui.`);
  };

  const handleDeleteSchool = (id: string) => {
    setSchools((prev) => prev.filter((s) => s.id !== id));
    showToast('Profil sekolah telah dihapus.', 'info');
  };

  const handleSelectActiveSchool = (school: SchoolProfile) => {
    setSettings((prev) => ({
      ...prev,
      activeSchoolId: school.id,
      schoolName: school.name,
      schoolAddress: school.address,
      city: school.city,
      schoolLogoUrl: school.logoUrl || prev.schoolLogoUrl,
    }));
    showToast(`Sekolah aktif diubah menjadi ${school.name}`);
  };

  // Load data payload restored from Google Drive
  const handleLoadDataFromDrive = (payload: DriveDatabasePayload) => {
    if (payload.schoolSettings) setSettings(payload.schoolSettings);
    if (payload.students) setStudents(payload.students);
    if (payload.attendanceRecords) setRecords(payload.attendanceRecords);
    if (payload.teachers) setTeachers(payload.teachers);
    if (payload.schools) setSchools(payload.schools);
    showToast('Database berhasil disinkronkan dari Google Drive!');
  };

  return (
    <div className="min-h-screen bg-slate-50/70 flex font-sans selection:bg-purple-600 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm animate-fade-in print:hidden">
          <div
            className={`p-3.5 rounded-xl shadow-xl border flex items-center justify-between gap-3 text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-purple-900 border-purple-500/30 text-white'
                : toast.type === 'warning'
                ? 'bg-amber-900 border-amber-500/30 text-amber-100'
                : 'bg-slate-800 border-slate-700 text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Left Sidebar (Clean, 100% functional navigation) */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenTeacherSchoolModal={(tab) => {
          setTeacherSchoolModalTab(tab || 'teachers');
          setIsTeacherSchoolModalOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        schoolName={settings.schoolName}
        schoolLogoUrl={settings.schoolLogoUrl}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <Header
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          currentUser={currentUser}
          onGoogleSignIn={handleGoogleSignIn}
          onLogout={handleLogout}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenEmailModal={() => setIsEmailModalOpen(true)}
          onOpenTeacherSchoolModal={() => setIsTeacherSchoolModalOpen(true)}
          settings={settings}
        />

        {/* Page Main View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7">
          {currentView === 'monthly' ? (
            /* Presensi Bulanan matching the screenshot */
            <MonthlyPresenceView
              students={students}
              records={records}
              settings={settings}
              teachers={teachers}
              schools={schools}
              currentUser={currentUser}
              onOpenScanner={() => setIsScannerOpen(true)}
              onExcelSyncedToDrive={(fileId, link) => {
                setSettings((prev) => ({
                  ...prev,
                  googleDriveExcelFileId: fileId,
                  driveExcelWebViewLink: link,
                  lastExcelSyncedAt: new Date().toISOString(),
                }));
                showToast('File Excel database berhasil disinkronkan ke Google Drive!');
              }}
            />
          ) : currentView === 'daily' ? (
            /* Presensi Harian & Live Barcode Scanner */
            <TodayAttendanceView
              students={students}
              records={records}
              settings={settings}
              teachers={teachers}
              schools={schools}
              currentUser={currentUser}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              onOpenScanner={() => setIsScannerOpen(true)}
              onOpenEmailModal={() => setIsEmailModalOpen(true)}
              onOpenManualModal={() => setIsManualModalOpen(true)}
              onOpenTeacherSchoolModal={() => setIsTeacherSchoolModalOpen(true)}
              onUpdateRecordStatus={handleUpdateRecordStatus}
              onExcelSyncedToDrive={(fileId, link) => {
                setSettings((prev) => ({
                  ...prev,
                  googleDriveExcelFileId: fileId,
                  driveExcelWebViewLink: link,
                  lastExcelSyncedAt: new Date().toISOString(),
                }));
                showToast('File Excel database berhasil disinkronkan ke Google Drive!');
              }}
            />
          ) : currentView === 'students' ? (
            /* Data Siswa & Kartu Barcode Siap Cetak */
            <StudentCardsView
              students={students}
              settings={settings}
              onAddStudent={handleAddStudent}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
            />
          ) : currentView === 'announcements' ? (
            /* Pengumuman Sekolah */
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-4">
              <h2 className="text-xl font-black text-purple-700 flex items-center gap-2">
                <Bell className="w-5 h-5 text-purple-600" />
                Papan Pengumuman Sekolah
              </h2>
              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/50">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-200 text-purple-800">
                    INFO PRESENSI
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">
                    Penerapan Presensi Barcode & Sinkronisasi Google Drive
                  </h4>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    Seluruh siswa {settings.schoolName} wajib membawa Kartu Tanda Pelajar dengan barcode/QR code saat memasuki gerbang sekolah. Presensi otomatis tercatat dan tersimpan di database Google Drive.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    KOTA SOLOK
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">
                    Kebijakan Jam Masuk & Toleransi Keterlambatan
                  </h4>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    Batas jam kehadiran tepat waktu ditetapkan pukul {settings.lateThresholdTime || '07:15'} WIB. Siswa yang memindai kartu setelah jam tersebut otomatis ditandai status Terlambat.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </main>
      </div>

      {/* Floating Action Button '?' matching SS at bottom right */}
      <button
        onClick={() => setIsHelpOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-extrabold text-lg flex items-center justify-center shadow-lg shadow-purple-500/40 z-40 transition cursor-pointer"
        title="Bantuan & Aksi Cepat"
      >
        ?
      </button>

      {/* Floating Quick Help / Action Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-sm w-full p-5 animate-fade-in text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  ?
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Pusat Bantuan & Aksi</h4>
              </div>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              <button
                onClick={() => {
                  setIsHelpOpen(false);
                  setIsScannerOpen(true);
                }}
                className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition"
              >
                <Camera className="w-4 h-4" />
                <span>Buka Barcode Scanner</span>
              </button>

              <button
                onClick={() => {
                  setIsHelpOpen(false);
                  setIsTeacherSchoolModalOpen(true);
                }}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-left"
              >
                Manajemen Guru & Profil Sekolah
              </button>

              <button
                onClick={() => {
                  setIsHelpOpen(false);
                  setIsSettingsOpen(true);
                }}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-left"
              >
                Database Google Drive & Excel
              </button>

              <button
                onClick={() => {
                  setIsHelpOpen(false);
                  setIsEmailModalOpen(true);
                }}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-left"
              >
                Kirim Laporan ke Email Guru
              </button>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              iPresens HadirKu • Pemerintah Kota Solok
            </p>
          </div>
        </div>
      )}

      {/* Modals */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        students={students}
        attendanceRecords={records}
        settings={settings}
        onRecordAdded={handleRecordAdded}
      />

      <TeacherSchoolCrudModal
        isOpen={isTeacherSchoolModalOpen}
        onClose={() => setIsTeacherSchoolModalOpen(false)}
        initialTab={teacherSchoolModalTab}
        teachers={teachers}
        schools={schools}
        settings={settings}
        onAddTeacher={handleAddTeacher}
        onUpdateTeacher={handleUpdateTeacher}
        onDeleteTeacher={handleDeleteTeacher}
        onSelectActiveTeacher={handleSelectActiveTeacher}
        onAddSchool={handleAddSchool}
        onUpdateSchool={handleUpdateSchool}
        onDeleteSchool={handleDeleteSchool}
        onSelectActiveSchool={handleSelectActiveSchool}
      />

      <EmailReportModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        students={students}
        records={records}
        settings={settings}
        selectedDate={selectedDate}
        currentUser={currentUser}
        onLoginSuccess={(user, token) => {
          setCurrentUser(user);
          setAccessToken(token);
          showToast(`Terhubung sebagai ${user.email}`);
        }}
      />

      <DriveSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) => {
          setSettings(newSettings);
          showToast('Pengaturan berhasil diperbarui!');
        }}
        students={students}
        records={records}
        teachers={teachers}
        schools={schools}
        onLoadDataFromDrive={handleLoadDataFromDrive}
        currentUser={currentUser}
        onLoginSuccess={(user, token) => {
          setCurrentUser(user);
          setAccessToken(token);
        }}
      />

      <ManualCheckInModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        students={students}
        attendanceRecords={records}
        selectedDate={selectedDate}
        settings={settings}
        onRecordAdded={handleRecordAdded}
      />
    </div>
  );
}
