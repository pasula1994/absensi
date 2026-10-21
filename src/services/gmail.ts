import { Student, AttendanceRecord, SchoolSettings, AttendanceStatus } from '../types/attendance';

interface SendReportOptions {
  toEmail: string;
  teacherName: string;
  schoolSettings: SchoolSettings;
  className: string;
  dateStr: string; // YYYY-MM-DD
  students: Student[];
  records: AttendanceRecord[];
}

/**
 * Encodes string to URL-safe Base64 as required by the Gmail API
 */
function toUrlSafeBase64(str: string): string {
  // Use UTF-8 safe encoding
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Formats date into Indonesian locale
 */
export function formatIndonesianDate(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
  } catch {
    // fallback
  }
  return dateStr;
}

/**
 * Generates an elegant, responsive HTML email for the daily attendance report
 */
export function generateEmailHtml(options: SendReportOptions): { html: string; subject: string } {
  const { toEmail, teacherName, schoolSettings, className, dateStr, students, records } = options;
  const formattedDate = formatIndonesianDate(dateStr);

  const classStudents = students.filter((s) => s.className === className);
  const total = classStudents.length;

  const recordMap = new Map<string, AttendanceRecord>();
  records.filter((r) => r.date === dateStr).forEach((r) => {
    recordMap.set(r.studentId, r);
  });

  let hadir = 0;
  let terlambat = 0;
  let sakit = 0;
  let izin = 0;
  let alpa = 0;

  classStudents.forEach((student) => {
    const rec = recordMap.get(student.id);
    const status: AttendanceStatus = rec ? rec.status : 'alpa';
    if (status === 'hadir') hadir++;
    else if (status === 'terlambat') terlambat++;
    else if (status === 'sakit') sakit++;
    else if (status === 'izin') izin++;
    else alpa++;
  });

  const presentTotal = hadir + terlambat;
  const percentage = total > 0 ? Math.round((presentTotal / total) * 100) : 0;

  const subject = `[Laporan Absensi] Kelas ${className} - ${formattedDate} (${percentage}% Hadir)`;

  const tableRowsHtml = classStudents
    .map((student, idx) => {
      const rec = recordMap.get(student.id);
      const status: AttendanceStatus = rec ? rec.status : 'alpa';
      const timeStr = rec ? rec.time : '-';
      const scanVia = rec ? (rec.scannedVia === 'barcode' ? 'Barcode Scan' : rec.scannedVia === 'qr' ? 'QR Code' : 'Manual') : '-';
      const notes = rec?.notes || '-';

      let badgeBg = '#f1f5f9';
      let badgeColor = '#475569';
      let statusLabel = 'Alpa (Tanpa Keterangan)';

      if (status === 'hadir') {
        badgeBg = '#dcfce7';
        badgeColor = '#15803d';
        statusLabel = 'Hadir Tepat Waktu';
      } else if (status === 'terlambat') {
        badgeBg = '#fef3c7';
        badgeColor = '#b45309';
        statusLabel = 'Terlambat';
      } else if (status === 'sakit') {
        badgeBg = '#e0f2fe';
        badgeColor = '#0369a1';
        statusLabel = 'Sakit';
      } else if (status === 'izin') {
        badgeBg = '#f3e8ff';
        badgeColor = '#7e22ce';
        statusLabel = 'Izin';
      } else {
        badgeBg = '#fee2e2';
        badgeColor = '#b91c1c';
        statusLabel = 'Alpa';
      }

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 14px;">
          <td style="padding: 10px 12px; color: #64748b; text-align: center;">${idx + 1}</td>
          <td style="padding: 10px 12px; font-weight: 600; color: #1e293b;">${student.name}</td>
          <td style="padding: 10px 12px; color: #475569; font-family: monospace;">${student.nis}</td>
          <td style="padding: 10px 12px; text-align: center;">
            <span style="display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; background-color: ${badgeBg}; color: ${badgeColor};">
              ${statusLabel}
            </span>
          </td>
          <td style="padding: 10px 12px; color: #475569; text-align: center;">${timeStr}</td>
          <td style="padding: 10px 12px; color: #64748b; text-align: center; font-size: 12px;">${scanVia}</td>
          <td style="padding: 10px 12px; color: #64748b; font-size: 13px;">${notes}</td>
        </tr>
      `;
    })
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
  <div style="max-width: 680px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
    
    <!-- Top Header -->
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px 28px; color: #ffffff;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div>
          <span style="background-color: #10b981; color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 3px 8px; border-radius: 4px; display: inline-block; margin-bottom: 6px;">
            Laporan Presensi Harian
          </span>
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
            ${schoolSettings.schoolName || 'SMA / Sekolah Indonesia'}
          </h1>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">
            ${schoolSettings.schoolAddress || 'Sistem Absensi Barcode HadirKu'}
          </p>
        </div>
      </div>
    </div>

    <!-- Meta Info Bar -->
    <div style="background-color: #f1f5f9; padding: 14px 28px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #475569;">
      <strong>Kelas:</strong> ${className} &nbsp;|&nbsp; 
      <strong>Tanggal:</strong> ${formattedDate} &nbsp;|&nbsp; 
      <strong>Wali Kelas / Guru:</strong> ${teacherName} (${toEmail})
    </div>

    <!-- Content Area -->
    <div style="padding: 24px 28px;">
      
      <!-- Statistics Cards Grid -->
      <table style="width: 100%; border-collapse: separate; border-spacing: 8px; margin-bottom: 24px;">
        <tr>
          <td style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; width: 25%;">
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600;">Total Siswa</div>
            <div style="font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 4px;">${total}</div>
          </td>
          <td style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; text-align: center; width: 25%;">
            <div style="font-size: 11px; text-transform: uppercase; color: #166534; font-weight: 600;">Hadir</div>
            <div style="font-size: 24px; font-weight: 800; color: #15803d; margin-top: 4px;">${hadir}</div>
          </td>
          <td style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 12px; text-align: center; width: 25%;">
            <div style="font-size: 11px; text-transform: uppercase; color: #854d0e; font-weight: 600;">Terlambat</div>
            <div style="font-size: 24px; font-weight: 800; color: #ca8a04; margin-top: 4px;">${terlambat}</div>
          </td>
          <td style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; text-align: center; width: 25%;">
            <div style="font-size: 11px; text-transform: uppercase; color: #991b1b; font-weight: 600;">Tidak Hadir</div>
            <div style="font-size: 24px; font-weight: 800; color: #dc2626; margin-top: 4px;">${sakit + izin + alpa}</div>
          </td>
        </tr>
      </table>

      <!-- Progress bar -->
      <div style="background-color: #e2e8f0; border-radius: 9999px; height: 10px; width: 100%; overflow: hidden; margin-bottom: 24px;">
        <div style="background-color: #10b981; height: 10px; width: ${percentage}%;"></div>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 12px; color: #64748b; margin-top: -18px; margin-bottom: 24px;">
        <span>Tingkat Kehadiran: <strong>${percentage}%</strong></span>
        <span>(Sakit: ${sakit}, Izin: ${izin}, Alpa: ${alpa})</span>
      </div>

      <!-- Student Attendance Table -->
      <h3 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #1e293b;">
        Rincian Kehadiran Siswa
      </h3>
      <div style="overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead>
            <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #475569; text-transform: uppercase; letter-spacing: 0.04em;">
              <th style="padding: 10px 12px; text-align: center; width: 36px;">No</th>
              <th style="padding: 10px 12px;">Nama Siswa</th>
              <th style="padding: 10px 12px;">NIS</th>
              <th style="padding: 10px 12px; text-align: center;">Status</th>
              <th style="padding: 10px 12px; text-align: center;">Waktu</th>
              <th style="padding: 10px 12px; text-align: center;">Metode</th>
              <th style="padding: 10px 12px;">Catatan</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
      </div>

      <!-- Footer Notes -->
      <div style="margin-top: 24px; padding: 14px; background-color: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1; font-size: 12px; color: #64748b; line-height: 1.5;">
        <strong>Informasi Tambahan:</strong><br/>
        Laporan ini digenerate secara otomatis oleh sistem <strong>HadirKu - Sistem Absensi Barcode Siswa</strong>. Rekap data telah disinkronkan ke Google Drive guru.
      </div>
    </div>

    <!-- Bottom Signature -->
    <div style="background-color: #f1f5f9; padding: 16px 28px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
      © ${new Date().getFullYear()} HadirKu • Sistem Absensi Barcode Siswa & Google Drive Integration
    </div>
  </div>
</body>
</html>
  `;

  return { html, subject };
}

/**
 * Sends the daily attendance report to the teacher's email via Gmail REST API
 */
export async function sendDailyAttendanceEmail(
  options: SendReportOptions,
  accessToken: string
): Promise<{ success: boolean; messageId: string }> {
  const { toEmail, schoolSettings } = options;
  const { html, subject } = generateEmailHtml(options);

  // Compose RFC 2822 email message
  const senderHeader = schoolSettings.schoolName
    ? `"${schoolSettings.schoolName} Presensi" <me>`
    : `<me>`;

  const emailLines = [
    `To: ${toEmail}`,
    `Subject: =?UTF-8?B?${toUrlSafeBase64(subject)}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    html,
  ];

  const rawMessage = emailLines.join('\r\n');
  const encodedMessage = toUrlSafeBase64(rawMessage);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodedMessage,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gagal mengirim email via Gmail API: ${response.status} - ${errorBody}`);
  }

  const result = await response.json();
  return { success: true, messageId: result.id };
}
