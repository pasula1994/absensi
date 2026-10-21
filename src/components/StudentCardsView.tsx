import React, { useState } from 'react';
import {
  Plus,
  Printer,
  Search,
  Filter,
  CreditCard,
  Edit2,
  Trash2,
  QrCode,
  Download,
  Users,
  Check,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { Student, SchoolSettings } from '../types/attendance';
import { BarcodeRenderer } from './BarcodeRenderer';
import { KotaSolokLogo } from './KotaSolokLogo';

interface StudentCardsViewProps {
  students: Student[];
  settings: SchoolSettings;
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
}

export const StudentCardsView: React.FC<StudentCardsViewProps> = ({
  students,
  settings,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'cards' | 'table'>('cards');
  const [printMode, setPrintMode] = useState<boolean>(false);
  const [barcodeType, setBarcodeType] = useState<'barcode' | 'qr' | 'both'>('both');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    nis: string;
    name: string;
    gender: 'L' | 'P';
    className: string;
    email: string;
    parentPhone: string;
  }>({
    nis: '',
    name: '',
    gender: 'L',
    className: settings.defaultClass || 'X-MIPA 1',
    email: '',
    parentPhone: '',
  });

  const availableClasses = Array.from(
    new Set([...settings.classes, ...students.map((s) => s.className)])
  ).filter(Boolean);

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.nis.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'all' || student.className === selectedClass;
    return matchesSearch && matchesClass;
  });

  const handleOpenAdd = () => {
    // Generate next automatic NIS
    const maxNis = students.reduce((acc, s) => {
      const num = parseInt(s.nis, 10);
      return !isNaN(num) && num > acc ? num : acc;
    }, 20261000);

    setFormData({
      nis: String(maxNis + 1),
      name: '',
      gender: 'L',
      className: selectedClass !== 'all' ? selectedClass : settings.defaultClass || 'X-MIPA 1',
      email: '',
      parentPhone: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      nis: student.nis,
      name: student.name,
      gender: student.gender,
      className: student.className,
      email: student.email || '',
      parentPhone: student.parentPhone || '',
    });
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.nis.trim()) return;

    if (editingStudent) {
      onUpdateStudent({
        ...editingStudent,
        ...formData,
      });
      setEditingStudent(null);
    } else {
      const newStudent: Student = {
        id: `std-${Date.now()}`,
        ...formData,
      };
      onAddStudent(newStudent);
      setIsAddModalOpen(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            Kartu Pelajar & Data Siswa
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola data siswa, cetak kartu barcode / QR code fisik untuk absensi harian
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handlePrint()}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Cetak Kartu ({filteredStudents.length})</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>
        </div>
      </div>

      {/* Filter and View Options */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs print:hidden">
        <div className="flex flex-1 items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama atau NIS siswa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50/50"
            />
          </div>

          {/* Class Filter */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-700 font-medium"
          >
            <option value="all">Semua Kelas ({students.length})</option>
            {availableClasses.map((cls) => (
              <option key={cls} value={cls}>
                {cls} ({students.filter((s) => s.className === cls).length})
              </option>
            ))}
          </select>
        </div>

        {/* View Toggle & Barcode Mode */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs">
            <button
              onClick={() => setActiveTab('cards')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                activeTab === 'cards'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tampilan Kartu
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                activeTab === 'table'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tabel Data
            </button>
          </div>

          {activeTab === 'cards' && (
            <select
              value={barcodeType}
              onChange={(e) => setBarcodeType(e.target.value as 'barcode' | 'qr' | 'both')}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700"
            >
              <option value="both">Barcode + QR</option>
              <option value="barcode">Hanya Barcode (1D)</option>
              <option value="qr">Hanya QR Code (2D)</option>
            </select>
          )}
        </div>
      </div>

      {/* Empty state */}
      {filteredStudents.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Tidak ada data siswa ditemukan</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Coba sesuaikan kata kunci pencarian atau tambah siswa baru ke kelas ini.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Tambah Siswa Baru
          </button>
        </div>
      )}

      {/* Cards View (Printable Student ID Badges) */}
      {activeTab === 'cards' && filteredStudents.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 print:grid-cols-2 print:gap-4">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow relative group print:shadow-none print:border-slate-300 print:break-inside-avoid"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-4 text-white relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {settings.schoolLogoUrl ? (
                      <img
                        src={settings.schoolLogoUrl}
                        alt="Logo Sekolah"
                        className="w-8 h-8 rounded-lg object-contain bg-white p-0.5 shrink-0 shadow-2xs"
                      />
                    ) : (
                      <KotaSolokLogo size="sm" />
                    )}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                        {settings.schoolName || 'Kartu Pelajar'}
                      </h4>
                      <p className="text-[10px] text-amber-300 font-mono font-semibold">
                        KARTU PRESENSI BARCODE SISWA
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {student.className}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div className="flex items-start gap-3 mb-3">
                  {/* Avatar / Photo */}
                  <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center font-bold text-slate-700 text-lg shrink-0 shadow-inner">
                    <span>{student.name.substring(0, 2).toUpperCase()}</span>
                    <span className="text-[9px] font-medium text-slate-500">
                      {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 text-sm leading-tight">
                      {student.name}
                    </h3>
                    <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                      <p>
                        NIS: <span className="font-mono font-semibold text-slate-800">{student.nis}</span>
                      </p>
                      {student.parentPhone && (
                        <p className="text-[11px] text-slate-400">Telp: {student.parentPhone}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Barcode & QR Code Section */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                  <BarcodeRenderer
                    value={student.nis}
                    type={barcodeType}
                    width={1.6}
                    height={44}
                    displayValue={true}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Pindai barcode ini di scanner saat hadir di sekolah
                  </p>
                </div>
              </div>

              {/* Card Footer Actions (Hidden on Print) */}
              <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs print:hidden">
                <span className="text-slate-400 font-mono text-[11px]">ID: {student.id}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(student)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition"
                    title="Edit Data Siswa"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(student.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Hapus Siswa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {activeTab === 'table' && filteredStudents.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 text-center w-12">No</th>
                  <th className="py-3 px-4">Nama Lengkap</th>
                  <th className="py-3 px-4">NIS</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4 text-center">Gender</th>
                  <th className="py-3 px-4">Kontak Orang Tua</th>
                  <th className="py-3 px-4 text-center">Barcode</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{student.name}</td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">{student.nis}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                        {student.className}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          student.gender === 'L'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-pink-50 text-pink-700'
                        }`}
                      >
                        {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{student.parentPhone || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="w-28 mx-auto">
                        <BarcodeRenderer
                          value={student.nis}
                          type="barcode"
                          width={1.2}
                          height={28}
                          displayValue={false}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(student)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(student.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Student */}
      {(isAddModalOpen || editingStudent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden animate-fade-in">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingStudent(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Siswa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Rizky"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NIS (Nomor Induk / Barcode) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="20261001"
                    value={formData.nis}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jenis Kelamin *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'L' | 'P' })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kelas *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: X-MIPA 1"
                  value={formData.className}
                  onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. HP Orang Tua / WA
                  </label>
                  <input
                    type="text"
                    placeholder="08123456789"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Siswa (Opsional)
                  </label>
                  <input
                    type="email"
                    placeholder="siswa@sekolah.id"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingStudent(null);
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs"
                >
                  {editingStudent ? 'Simpan Perubahan' : 'Tambah Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-sm w-full p-5 animate-fade-in text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-1">Hapus Data Siswa?</h4>
            <p className="text-xs text-slate-500 mb-4">
              Apakah Anda yakin ingin menghapus data siswa ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeleteStudent(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
