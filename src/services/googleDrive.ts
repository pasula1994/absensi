import { Student, AttendanceRecord, SchoolSettings, Teacher, SchoolProfile } from '../types/attendance';

export interface DriveDatabasePayload {
  version: string;
  updatedAt: string;
  schoolSettings: SchoolSettings;
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  teachers?: Teacher[];
  schools?: SchoolProfile[];
}

const DB_FILENAME = 'hadirku_attendance_database.json';

/**
 * Searches for the HadirKu database file in Google Drive
 */
export async function findDriveDatabaseFile(accessToken: string): Promise<{ id: string; name: string; modifiedTime?: string; webViewLink?: string } | null> {
  const query = encodeURIComponent(`name = '${DB_FILENAME}' and trashed = false`);
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,webViewLink)&pageSize=1`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gagal mencari file di Google Drive: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  if (data.files && data.files.length > 0) {
    return data.files[0];
  }
  return null;
}

/**
 * Reads database content from Google Drive
 */
export async function readDriveDatabase(fileId: string, accessToken: string): Promise<DriveDatabasePayload> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gagal membaca file dari Google Drive: ${response.status} ${errorText}`);
  }

  return await response.json();
}

/**
 * Saves or updates the HadirKu database file on Google Drive
 */
export async function saveDriveDatabase(
  payload: DriveDatabasePayload,
  accessToken: string,
  existingFileId?: string
): Promise<{ fileId: string; webViewLink?: string; updatedAt: string }> {
  const jsonContent = JSON.stringify(payload, null, 2);
  const updatedAt = new Date().toISOString();

  // If existing file ID is provided or exists on Drive, update it
  let targetFileId = existingFileId;
  if (!targetFileId) {
    const existing = await findDriveDatabaseFile(accessToken);
    if (existing) {
      targetFileId = existing.id;
    }
  }

  if (targetFileId) {
    // Update existing file content
    const response = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${targetFileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: jsonContent,
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gagal memperbarui file database di Google Drive: ${err}`);
    }

    const data = await response.json();
    return {
      fileId: targetFileId,
      webViewLink: data.webViewLink,
      updatedAt,
    };
  } else {
    // Create new file via multipart upload
    const metadata = {
      name: DB_FILENAME,
      mimeType: 'application/json',
      description: 'Database Presensi Siswa HadirKu (Daftar Siswa, Pengaturan, dan Catatan Absensi)',
    };

    const boundary = '-------HadirKuBoundary' + Date.now();
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      jsonContent +
      closeDelimiter;

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gagal membuat file database baru di Google Drive: ${err}`);
    }

    const data = await response.json();
    return {
      fileId: data.id,
      webViewLink: data.webViewLink,
      updatedAt,
    };
  }
}

/**
 * Creates a backup CSV file directly in Google Drive folder for the teacher's archive
 */
export async function exportCsvToDrive(
  csvContent: string,
  filename: string,
  accessToken: string
): Promise<{ fileId: string; name: string }> {
  const metadata = {
    name: filename,
    mimeType: 'text/csv',
    description: 'Rekap Presensi Siswa HadirKu - Format Spreadsheet / CSV',
  };

  const boundary = '-------HadirKuCsvBoundary' + Date.now();
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: text/csv; charset=UTF-8\r\n\r\n' +
    csvContent +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gagal menyimpan file CSV ke Google Drive: ${err}`);
  }

  const data = await response.json();
  return { fileId: data.id, name: data.name };
}
