import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Student,
  AttendanceRecord,
  SchoolSettings,
  SchoolProfile,
  Teacher
} from '../types/attendance';
import { formatIndonesianDate } from './gmail';

export interface PdfExportOptions {
  schoolProfile?: SchoolProfile;
  settings: SchoolSettings;
  students: Student[];
  records: AttendanceRecord[];
  activeTeacher?: Teacher;
  dateStr?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  className: string;
}

export function generateAttendancePdf(options: PdfExportOptions): jsPDF {
  const { schoolProfile, settings, students, records, activeTeacher, startDate, endDate, className } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const schoolName = schoolProfile?.name || settings.schoolName;
  const city = schoolProfile?.city || settings.city || 'Kota Solok';

  const isSingleDay = startDate === endDate;
  const periodText = isSingleDay
    ? formatIndonesianDate(startDate)
    : `${formatIndonesianDate(startDate)} s.d. ${formatIndonesianDate(endDate)}`;

  // 1. CLEAN DOCUMENT HEADER (TANPA KOP SURAT)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('LAPORAN PRESENSI SISWA', pageWidth / 2, 16, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  doc.text(schoolName.toUpperCase(), pageWidth / 2, 22, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(isSingleDay ? `Tanggal: ${periodText}` : `Rentang Periode: ${periodText}`, pageWidth / 2, 27, {
    align: 'center',
  });

  // Single clean accent line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(14, 30, pageWidth - 14, 30);

  // 2. FILTER DATA ACROSS DATE RANGE
  const classStudents = students.filter(
    (s) => className === 'all' || s.className === className
  );
  const totalStudents = classStudents.length;

  // Filter records within [startDate, endDate]
  const rangeRecords = records.filter((r) => {
    const isWithinDate = r.date >= startDate && r.date <= endDate;
    const isMatchClass = className === 'all' || r.className === className;
    return isWithinDate && isMatchClass;
  });

  // Map of student records for single day
  const recordMap = new Map<string, AttendanceRecord>();
  if (isSingleDay) {
    rangeRecords.forEach((r) => {
      recordMap.set(r.studentId, r);
    });
  }

  // Calculate statistics
  let hadir = 0;
  let terlambat = 0;
  let sakit = 0;
  let izin = 0;
  let alpa = 0;

  if (isSingleDay) {
    classStudents.forEach((student) => {
      const rec = recordMap.get(student.id);
      if (!rec) alpa++;
      else if (rec.status === 'hadir') hadir++;
      else if (rec.status === 'terlambat') terlambat++;
      else if (rec.status === 'sakit') sakit++;
      else if (rec.status === 'izin') izin++;
      else alpa++;
    });
  } else {
    // Multi-day statistics
    rangeRecords.forEach((r) => {
      if (r.status === 'hadir') hadir++;
      else if (r.status === 'terlambat') terlambat++;
      else if (r.status === 'sakit') sakit++;
      else if (r.status === 'izin') izin++;
      else alpa++;
    });
  }

  const presentTotal = hadir + terlambat;

  // 3. STATISTICAL SUMMARY BOX
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, 33, pageWidth - 28, 16, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  doc.text(`Kelas: ${className === 'all' ? 'Semua Kelas' : className}`, 18, 39);
  doc.text(`Wali Kelas: ${activeTeacher?.name || settings.teacherName}`, 18, 44);

  if (isSingleDay) {
    const percentage = totalStudents > 0 ? Math.round((presentTotal / totalStudents) * 100) : 0;
    doc.text(`Total Siswa: ${totalStudents} Orang`, pageWidth / 2 + 5, 39);
    doc.text(
      `Kehadiran: Hadir (${hadir}), Terlambat (${terlambat}), Sakit (${sakit}), Izin (${izin}), Alpa (${alpa})`,
      pageWidth / 2 + 5,
      44
    );
  } else {
    doc.text(`Total Siswa: ${totalStudents} Orang (${rangeRecords.length} Transaksi Presensi)`, pageWidth / 2 + 5, 39);
    doc.text(
      `Total Rekap: Hadir (${hadir}), Terlambat (${terlambat}), Sakit (${sakit}), Izin (${izin})`,
      pageWidth / 2 + 5,
      44
    );
  }

  // 4. ATTENDANCE TABLE
  let headColumns: string[] = [];
  let tableData: any[][] = [];
  let columnStyles: Record<number, any> = {};

  if (isSingleDay) {
    headColumns = ['No', 'NIS', 'Nama Siswa', 'JK', 'Kelas', 'Waktu', 'Status', 'Metode', 'Keterangan'];
    tableData = classStudents.map((s, idx) => {
      const rec = recordMap.get(s.id);
      const status = rec ? rec.status.toUpperCase() : 'ALPA';
      const time = rec ? rec.time : '-';
      const method = rec
        ? rec.scannedVia === 'barcode'
          ? 'Barcode'
          : rec.scannedVia === 'qr'
          ? 'QR Code'
          : 'Manual'
        : '-';
      const notes = rec?.notes || '-';

      return [idx + 1, s.nis, s.name, s.gender, s.className, time, status, method, notes];
    });

    columnStyles = {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 18 },
      2: { cellWidth: 48 },
      3: { halign: 'center', cellWidth: 9 },
      4: { halign: 'center', cellWidth: 16 },
      5: { halign: 'center', cellWidth: 16 },
      6: { halign: 'center', cellWidth: 20 },
      7: { halign: 'center', cellWidth: 18 },
      8: { cellWidth: 29 },
    };
  } else {
    // Multi-day Date Range Table
    headColumns = ['No', 'Tanggal', 'NIS', 'Nama Siswa', 'Kelas', 'Status', 'Waktu', 'Metode', 'Keterangan'];
    
    // Sort records by date ascending, then student name
    const sortedRangeRecords = [...rangeRecords].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.studentName.localeCompare(b.studentName);
    });

    tableData = sortedRangeRecords.map((r, idx) => {
      const method =
        r.scannedVia === 'barcode'
          ? 'Barcode'
          : r.scannedVia === 'qr'
          ? 'QR Code'
          : 'Manual';

      return [
        idx + 1,
        r.date,
        r.studentNis,
        r.studentName,
        r.className,
        r.status.toUpperCase(),
        r.time,
        method,
        r.notes || '-',
      ];
    });

    columnStyles = {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'center', cellWidth: 18 },
      3: { cellWidth: 46 },
      4: { halign: 'center', cellWidth: 16 },
      5: { halign: 'center', cellWidth: 18 },
      6: { halign: 'center', cellWidth: 16 },
      7: { halign: 'center', cellWidth: 16 },
      8: { cellWidth: 24 },
    };
  }

  autoTable(doc, {
    startY: 52,
    head: [headColumns],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      textColor: [51, 65, 85],
    },
    columnStyles,
    didParseCell: (data) => {
      const statusColIndex = isSingleDay ? 6 : 5;
      if (data.section === 'body' && data.column.index === statusColIndex) {
        const val = String(data.cell.raw);
        if (val === 'HADIR') {
          data.cell.styles.textColor = [22, 101, 52];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'TERLAMBAT') {
          data.cell.styles.textColor = [180, 83, 9];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'SAKIT' || val === 'IZIN') {
          data.cell.styles.textColor = [30, 64, 175];
        } else if (val === 'ALPA') {
          data.cell.styles.textColor = [185, 28, 28];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  // 5. SIGNATURE SECTION (TANDA TANGAN RESMI)
  const finalY = (doc as any).lastAutoTable.finalY + 14;

  let sigY = finalY;
  if (sigY > 240) {
    doc.addPage();
    sigY = 24;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  // Kiri: Mengetahui Kepala Sekolah
  doc.text('Mengetahui,', 24, sigY);
  doc.text('Kepala Sekolah', 24, sigY + 4);
  doc.setFont('helvetica', 'bold');
  const principalName = schoolProfile?.principalName || 'Drs. H. Erizal, M.M.';
  const principalNip = schoolProfile?.principalNip || '19680315 199412 1 002';
  doc.text(principalName, 24, sigY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`NIP. ${principalNip}`, 24, sigY + 28);

  // Kanan: Guru / Wali Kelas
  const teacherName = activeTeacher?.name || settings.teacherName;
  const teacherNip = activeTeacher?.nip || '19820412 200801 2 015';
  doc.setFontSize(8.5);
  doc.text(`${city}, ${formatIndonesianDate(endDate)}`, pageWidth - 70, sigY);
  doc.text('Guru / Wali Kelas,', pageWidth - 70, sigY + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(teacherName, pageWidth - 70, sigY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`NIP. ${teacherNip}`, pageWidth - 70, sigY + 28);

  return doc;
}

export function downloadAttendancePdf(options: PdfExportOptions, filename?: string) {
  const doc = generateAttendancePdf(options);
  const fname =
    filename ||
    `Laporan_Presensi_${options.className}_${options.startDate}_sd_${options.endDate}.pdf`;
  doc.save(fname);
}
