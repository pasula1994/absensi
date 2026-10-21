export type AttendanceStatus = 'hadir' | 'sakit' | 'izin' | 'alpa' | 'terlambat';

export interface Student {
  id: string;
  nis: string; // Nomor Induk Siswa (used as Barcode / QR value)
  name: string;
  gender: 'L' | 'P';
  className: string;
  email?: string;
  parentPhone?: string;
  avatarUrl?: string;
}

export interface Teacher {
  id: string;
  nip: string; // Nomor Induk Pegawai / NUPTK
  name: string;
  email: string;
  phone: string;
  subject: string; // Mata pelajaran yang diampu
  homeroomClass: string; // Wali Kelas (e.g. X-MIPA 1)
  isActive: boolean;
}

export interface SchoolProfile {
  id: string;
  name: string;
  npsn: string;
  level: 'SD' | 'SMP' | 'SMA' | 'SMK';
  address: string;
  district: string; // Kecamatan (e.g. Lubuk Sikarah / Tanjung Harapan)
  city: string; // Kota Solok
  province: string; // Sumatera Barat
  postalCode: string;
  phone: string;
  email: string;
  website?: string;
  logoUrl?: string; // Logo / Lambang Sekolah (URL atau Base64 Image)
  principalName: string; // Nama Kepala Sekolah
  principalNip: string; // NIP Kepala Sekolah
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentNis: string;
  studentName: string;
  className: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  status: AttendanceStatus;
  notes?: string;
  scannedVia: 'barcode' | 'manual' | 'qr';
}

export interface SchoolSettings {
  schoolName: string;
  schoolAddress: string;
  schoolLogoText: string;
  schoolLogoUrl?: string;
  city: string; // Kota Solok
  teacherName: string;
  teacherEmail: string;
  teacherSubject: string;
  activeTeacherId?: string;
  activeSchoolId?: string;
  defaultClass: string;
  classes: string[];
  lateThresholdTime: string; // e.g. "07:15"
  autoEmailReport: boolean;
  googleDriveFileId?: string;
  googleDriveExcelFileId?: string;
  driveExcelWebViewLink?: string;
  lastSyncedAt?: string;
  lastExcelSyncedAt?: string;
}

export interface DailyReportSummary {
  date: string;
  totalStudents: number;
  hadirCount: number;
  terlambatCount: number;
  sakitCount: number;
  izinCount: number;
  alpaCount: number;
  attendancePercentage: number;
}
