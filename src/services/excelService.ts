import * as XLSX from 'xlsx';
import {
  Student,
  AttendanceRecord,
  SchoolSettings,
  Teacher,
  SchoolProfile
} from '../types/attendance';

export interface ExcelExportPayload {
  schoolProfile?: SchoolProfile;
  settings: SchoolSettings;
  students: Student[];
  records: AttendanceRecord[];
  teachers: Teacher[];
  filterDate?: string;
  startDate?: string;
  endDate?: string;
  filterClass?: string;
}

/**
 * Builds a multi-sheet XLSX Workbook for HadirKu School Attendance
 */
export function buildAttendanceWorkbook(payload: ExcelExportPayload): XLSX.WorkBook {
  const { schoolProfile, settings, students, records, teachers, filterDate, startDate, endDate, filterClass } = payload;
  const wb = XLSX.utils.book_new();

  // 1. Sheet: Rekap Presensi
  let filteredRecords = records;
  if (startDate && endDate) {
    filteredRecords = filteredRecords.filter((r) => r.date >= startDate && r.date <= endDate);
  } else if (filterDate) {
    filteredRecords = filteredRecords.filter((r) => r.date === filterDate);
  }
  if (filterClass && filterClass !== 'all') {
    filteredRecords = filteredRecords.filter((r) => r.className === filterClass);
  }

  const attendanceData = filteredRecords.map((r, idx) => ({
    No: idx + 1,
    Tanggal: r.date,
    NIS: r.studentNis,
    'Nama Siswa': r.studentName,
    Kelas: r.className,
    'Status Presensi': r.status.toUpperCase(),
    'Waktu Presensi': r.time,
    'Metode Absen': r.scannedVia === 'barcode' ? 'Barcode 1D' : r.scannedVia === 'qr' ? 'QR Code 2D' : 'Manual',
    Keterangan: r.notes || '-',
  }));

  const wsAttendance = XLSX.utils.json_to_sheet(attendanceData);
  XLSX.utils.book_append_sheet(wb, wsAttendance, 'Rekap_Presensi');

  // 2. Sheet: Master Data Siswa
  const studentData = students.map((s, idx) => ({
    No: idx + 1,
    NIS: s.nis,
    'Nama Lengkap Siswa': s.name,
    'Jenis Kelamin': s.gender === 'L' ? 'Laki-laki' : 'Perempuan',
    Kelas: s.className,
    'No. HP Orang Tua': s.parentPhone || '-',
    Email: s.email || '-',
  }));
  const wsStudents = XLSX.utils.json_to_sheet(studentData);
  XLSX.utils.book_append_sheet(wb, wsStudents, 'Master_Siswa');

  // 3. Sheet: Data Guru & Tenaga Pendidik
  const teacherData = teachers.map((t, idx) => ({
    No: idx + 1,
    'NIP / NUPTK': t.nip,
    'Nama Guru': t.name,
    'Mata Pelajaran': t.subject,
    'Wali Kelas': t.homeroomClass,
    Email: t.email,
    'No. Handphone': t.phone,
    Status: t.isActive ? 'Aktif' : 'Non-aktif',
  }));
  const wsTeachers = XLSX.utils.json_to_sheet(teacherData);
  XLSX.utils.book_append_sheet(wb, wsTeachers, 'Master_Guru');

  // 4. Sheet: Profil Sekolah
  const profileRows = [
    { Parameter: 'Nama Sekolah', Nilai: schoolProfile?.name || settings.schoolName },
    { Parameter: 'NPSN', Nilai: schoolProfile?.npsn || '10303741' },
    { Parameter: 'Jenjang', Nilai: schoolProfile?.level || 'SMA' },
    { Parameter: 'Alamat Lengkap', Nilai: schoolProfile?.address || settings.schoolAddress },
    { Parameter: 'Kota / Wilayah', Nilai: schoolProfile?.city || settings.city || 'Kota Solok' },
    { Parameter: 'Provinsi', Nilai: schoolProfile?.province || 'Sumatera Barat' },
    { Parameter: 'Kepala Sekolah', Nilai: schoolProfile?.principalName || 'Drs. H. Erizal, M.M.' },
    { Parameter: 'NIP Kepala Sekolah', Nilai: schoolProfile?.principalNip || '19680315 199412 1 002' },
    { Parameter: 'Guru / Wali Kelas Aktif', Nilai: settings.teacherName },
    { Parameter: 'Email Guru Aktif', Nilai: settings.teacherEmail },
    { Parameter: 'Batas Jam Terlambat', Nilai: settings.lateThresholdTime },
    { Parameter: 'Tanggal Ekspor', Nilai: new Date().toLocaleString('id-ID') },
  ];
  const wsProfile = XLSX.utils.json_to_sheet(profileRows);
  XLSX.utils.book_append_sheet(wb, wsProfile, 'Profil_Sekolah');

  return wb;
}

/**
 * Downloads XLSX file to user's device
 */
export function downloadAttendanceExcel(payload: ExcelExportPayload, filename?: string) {
  const wb = buildAttendanceWorkbook(payload);
  const fname =
    filename ||
    `Presensi_${payload.settings.schoolName.replace(/\s+/g, '_')}_${payload.filterDate || new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fname);
}

/**
 * Uploads or updates Excel database (.xlsx) directly into user's Google Drive
 */
export async function uploadExcelToGoogleDrive(
  payload: ExcelExportPayload,
  accessToken: string,
  existingFileId?: string
): Promise<{ fileId: string; webViewLink?: string; updatedAt: string }> {
  const wb = buildAttendanceWorkbook(payload);
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const filename = `hadirku_database_${payload.settings.city?.replace(/\s+/g, '_') || 'Kota_Solok'}.xlsx`;
  const updatedAt = new Date().toISOString();

  let targetFileId = existingFileId;

  // Search if file already exists in Drive
  if (!targetFileId) {
    const query = encodeURIComponent(`name = '${filename}' and trashed = false`);
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)&pageSize=1`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        targetFileId = searchData.files[0].id;
      }
    }
  }

  if (targetFileId) {
    // Update existing file
    const response = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${targetFileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        body: blob,
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gagal memperbarui file Excel di Google Drive: ${err}`);
    }

    const data = await response.json();
    return {
      fileId: targetFileId,
      webViewLink: data.webViewLink,
      updatedAt,
    };
  } else {
    // Create new Excel file via multipart upload
    const metadata = {
      name: filename,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      description: 'Database Presensi Siswa HadirKu Berbasis Excel (Format Microsoft Excel)',
    };

    const boundary = '-------HadirKuExcel' + Date.now();
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    // Convert blob to Uint8Array for multipart building
    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    const header =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n';

    const headerBytes = new TextEncoder().encode(header);
    const closeBytes = new TextEncoder().encode(closeDelimiter);

    const fullPayload = new Uint8Array(headerBytes.length + bytes.length + closeBytes.length);
    fullPayload.set(headerBytes, 0);
    fullPayload.set(bytes, headerBytes.length);
    fullPayload.set(closeBytes, headerBytes.length + bytes.length);

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: fullPayload,
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gagal mengunggah file Excel ke Google Drive: ${err}`);
    }

    const data = await response.json();
    return {
      fileId: data.id,
      webViewLink: data.webViewLink,
      updatedAt,
    };
  }
}
