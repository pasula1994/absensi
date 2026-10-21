import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  School,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Phone,
  Mail,
  BookOpen,
  Award,
  Building,
  MapPin,
  UserCheck,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { Teacher, SchoolProfile, SchoolSettings } from '../types/attendance';
import { KotaSolokLogo } from './KotaSolokLogo';

interface TeacherSchoolCrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'teachers' | 'schools';
  teachers: Teacher[];
  schools: SchoolProfile[];
  settings: SchoolSettings;
  onAddTeacher: (teacher: Teacher) => void;
  onUpdateTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (id: string) => void;
  onSelectActiveTeacher: (teacher: Teacher) => void;
  onAddSchool: (school: SchoolProfile) => void;
  onUpdateSchool: (school: SchoolProfile) => void;
  onDeleteSchool: (id: string) => void;
  onSelectActiveSchool: (school: SchoolProfile) => void;
}

export const TeacherSchoolCrudModal: React.FC<TeacherSchoolCrudModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'teachers',
  teachers,
  schools,
  settings,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  onSelectActiveTeacher,
  onAddSchool,
  onUpdateSchool,
  onDeleteSchool,
  onSelectActiveSchool,
}) => {
  const [activeTab, setActiveTab] = useState<'teachers' | 'schools'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Teacher Form State
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [deleteTeacherId, setDeleteTeacherId] = useState<string | null>(null);

  const [teacherForm, setTeacherForm] = useState<Omit<Teacher, 'id'>>({
    nip: '',
    name: '',
    email: '',
    phone: '',
    subject: '',
    homeroomClass: 'X-MIPA 1',
    isActive: true,
  });

  // School Form State
  const [editingSchool, setEditingSchool] = useState<SchoolProfile | null>(null);
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [deleteSchoolId, setDeleteSchoolId] = useState<string | null>(null);

  const [schoolForm, setSchoolForm] = useState<Omit<SchoolProfile, 'id'>>({
    name: '',
    npsn: '',
    level: 'SMA',
    address: '',
    district: 'Kecamatan Lubuk Sikarah',
    city: 'Kota Solok',
    province: 'Sumatera Barat',
    postalCode: '27314',
    phone: '',
    email: '',
    logoUrl: '',
    principalName: '',
    principalNip: '',
  });

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
        setSchoolForm((prev) => ({ ...prev, logoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  // --- Handlers for Teacher ---
  const handleOpenAddTeacher = () => {
    setEditingTeacher(null);
    setTeacherForm({
      nip: '',
      name: '',
      email: '',
      phone: '',
      subject: 'Guru Mata Pelajaran',
      homeroomClass: settings.defaultClass || 'X-MIPA 1',
      isActive: true,
    });
    setIsTeacherModalOpen(true);
  };

  const handleOpenEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setTeacherForm({
      nip: teacher.nip,
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
      subject: teacher.subject,
      homeroomClass: teacher.homeroomClass,
      isActive: teacher.isActive,
    });
    setIsTeacherModalOpen(true);
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherForm.name.trim()) return;

    if (editingTeacher) {
      onUpdateTeacher({
        ...editingTeacher,
        ...teacherForm,
      });
    } else {
      onAddTeacher({
        id: `tch-${Date.now()}`,
        ...teacherForm,
      });
    }
    setIsTeacherModalOpen(false);
  };

  // --- Handlers for School ---
  const handleOpenAddSchool = () => {
    setEditingSchool(null);
    setSchoolForm({
      name: '',
      npsn: '',
      level: 'SMA',
      address: 'Jl. Ki Hajar Dewantara, Kota Solok',
      district: 'Kecamatan Lubuk Sikarah',
      city: 'Kota Solok',
      province: 'Sumatera Barat',
      postalCode: '27314',
      phone: '(0755) ',
      email: 'sekolah@kotasolok.sch.id',
      logoUrl: '',
      principalName: '',
      principalNip: '',
    });
    setIsSchoolModalOpen(true);
  };

  const handleOpenEditSchool = (school: SchoolProfile) => {
    setEditingSchool(school);
    setSchoolForm({
      name: school.name,
      npsn: school.npsn,
      level: school.level,
      address: school.address,
      district: school.district,
      city: school.city,
      province: school.province,
      postalCode: school.postalCode,
      phone: school.phone,
      email: school.email,
      logoUrl: school.logoUrl || '',
      principalName: school.principalName,
      principalNip: school.principalNip,
    });
    setIsSchoolModalOpen(true);
  };

  const handleSaveSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolForm.name.trim()) return;

    if (editingSchool) {
      onUpdateSchool({
        ...editingSchool,
        ...schoolForm,
      });
    } else {
      onAddSchool({
        id: `sch-${Date.now()}`,
        ...schoolForm,
      });
    }
    setIsSchoolModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KotaSolokLogo size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold tracking-tight">
                  Manajemen Data Guru & Sekolah
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Kota Solok
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Fitur CRUD kelola profil guru/wali kelas dan lembaga pendidikan di Kota Solok
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

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-t border-x flex items-center gap-2 ${
              activeTab === 'teachers'
                ? 'bg-white text-blue-700 border-slate-200 shadow-2xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Data Guru & Wali Kelas ({teachers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('schools')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-t border-x flex items-center gap-2 ${
              activeTab === 'schools'
                ? 'bg-white text-blue-700 border-slate-200 shadow-2xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <School className="w-4 h-4" />
            <span>Profil Sekolah Kota Solok ({schools.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* TAB 1: GURU */}
          {activeTab === 'teachers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Daftar Guru & Wali Kelas
                  </h3>
                  <p className="text-xs text-slate-500">
                    Guru aktif saat ini: <strong>{settings.teacherName}</strong> ({settings.teacherEmail})
                  </p>
                </div>
                <button
                  onClick={handleOpenAddTeacher}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Guru Baru</span>
                </button>
              </div>

              {/* Grid of Teachers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {teachers.map((teacher) => {
                  const isActiveSession =
                    settings.activeTeacherId === teacher.id ||
                    settings.teacherEmail === teacher.email;

                  return (
                    <div
                      key={teacher.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isActiveSession
                          ? 'bg-blue-50/50 border-blue-400 shadow-xs ring-1 ring-blue-300'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                            {teacher.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-slate-900 text-xs">
                                {teacher.name}
                              </h4>
                              {isActiveSession && (
                                <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[9px] font-bold">
                                  Aktif
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-mono">
                              NIP: {teacher.nip || '-'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditTeacher(teacher)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Data Guru"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTeacherId(teacher.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus Guru"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                            Mapel:
                          </span>
                          <span className="font-medium text-slate-800">{teacher.subject}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                            Wali Kelas:
                          </span>
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            {teacher.homeroomClass}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-mono">{teacher.email}</span>
                          <span className="text-slate-400 font-mono">{teacher.phone || '-'}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2">
                        {!isActiveSession ? (
                          <button
                            onClick={() => onSelectActiveTeacher(teacher)}
                            className="w-full py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg text-xs font-semibold transition"
                          >
                            Pilih Sebagai Guru Presensi Aktif
                          </button>
                        ) : (
                          <div className="text-center py-1 text-xs font-bold text-blue-700 bg-blue-100/70 rounded-lg">
                            ✓ Sedang Digunakan untuk Laporan
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: SEKOLAH */}
          {activeTab === 'schools' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Lembaga Pendidikan & Profil Sekolah Kota Solok
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sekolah aktif: <strong>{settings.schoolName}</strong>
                  </p>
                </div>
                <button
                  onClick={handleOpenAddSchool}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Sekolah Baru</span>
                </button>
              </div>

              {/* List of Schools */}
              <div className="space-y-3.5">
                {schools.map((school) => {
                  const isActiveSchool =
                    settings.activeSchoolId === school.id ||
                    settings.schoolName === school.name;

                  return (
                    <div
                      key={school.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isActiveSchool
                          ? 'bg-blue-50/40 border-blue-400 ring-1 ring-blue-300'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          {school.logoUrl ? (
                            <img
                              src={school.logoUrl}
                              alt={school.name}
                              className="w-12 h-12 object-contain p-1 rounded-xl border border-slate-200 bg-white shadow-2xs shrink-0"
                            />
                          ) : (
                            <KotaSolokLogo size="md" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-sm text-slate-900">
                                {school.name}
                              </h4>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                NPSN: {school.npsn}
                              </span>
                              {isActiveSchool && (
                                <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                                  Sekolah Aktif
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {school.address}, {school.city}, {school.province}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-center">
                          <button
                            onClick={() => handleOpenEditSchool(school)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Data Sekolah"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteSchoolId(school.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus Sekolah"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500">Kepala Sekolah: </span>
                          <strong className="text-slate-800">{school.principalName || '-'}</strong>
                          <span className="block text-[11px] text-slate-400 font-mono">
                            NIP. {school.principalNip || '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Kontak Resmi: </span>
                          <span className="text-slate-700 block">{school.email} • {school.phone}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 flex justify-end">
                        {!isActiveSchool ? (
                          <button
                            onClick={() => onSelectActiveSchool(school)}
                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded-lg text-xs font-semibold transition"
                          >
                            Terapkan Sebagai Profil Sekolah Aktif
                          </button>
                        ) : (
                          <div className="text-xs font-bold text-blue-700 flex items-center gap-1">
                            <Check className="w-4 h-4" />
                            <span>Profil Ini Sedang Aktif di Aplikasi</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* MODAL FORM: TAMBAH / EDIT GURU */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-fade-in">
            <div className="px-5 py-4 bg-blue-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingTeacher ? 'Edit Data Guru' : 'Tambah Guru Baru'}
              </h3>
              <button
                onClick={() => setIsTeacherModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Guru & Gelar *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Yet Mi, S.Pd."
                  value={teacherForm.name}
                  onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NIP / NUPTK *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="19820412 200801 2 015"
                    value={teacherForm.nip}
                    onChange={(e) => setTeacherForm({ ...teacherForm, nip: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Wali Kelas *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="X-MIPA 1"
                    value={teacherForm.homeroomClass}
                    onChange={(e) =>
                      setTeacherForm({ ...teacherForm, homeroomClass: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mata Pelajaran yang Diampu *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Matematika / Fisika / dll"
                  value={teacherForm.subject}
                  onChange={(e) => setTeacherForm({ ...teacherForm, subject: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Guru (Penerima Laporan) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="yet.mi01@gmail.com"
                    value={teacherForm.email}
                    onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. Handphone / WA
                  </label>
                  <input
                    type="text"
                    placeholder="081267891234"
                    value={teacherForm.phone}
                    onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTeacherModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  {editingTeacher ? 'Simpan Perubahan' : 'Tambah Guru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FORM: TAMBAH / EDIT SEKOLAH */}
      {isSchoolModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-fade-in">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KotaSolokLogo size="sm" />
                <h3 className="font-bold text-sm">
                  {editingSchool ? 'Edit Profil Sekolah' : 'Tambah Sekolah Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsSchoolModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSchool} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lembaga Sekolah *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: SMA Negeri 1 Kota Solok"
                  value={schoolForm.name}
                  onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              {/* INPUTAN LOGO SEKOLAH */}
              <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Logo / Lambang Sekolah
                  </label>
                  <span className="text-[10px] text-slate-400">
                    PNG, JPG, SVG (Maks. 2MB)
                  </span>
                </div>

                <div className="flex items-center gap-3.5">
                  {/* Logo Preview Box */}
                  <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-2xs">
                    {schoolForm.logoUrl ? (
                      <img
                        src={schoolForm.logoUrl}
                        alt="Preview Logo"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="w-5 h-5 text-slate-300 mx-auto" />
                        <span className="text-[9px] text-slate-400 block font-medium mt-0.5">
                          Tanpa Logo
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    {/* File Upload Button */}
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="cursor-pointer px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition">
                        <Upload className="w-3.5 h-3.5 text-blue-600" />
                        <span>Upload File Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>

                      {schoolForm.logoUrl && (
                        <button
                          type="button"
                          onClick={() => setSchoolForm((prev) => ({ ...prev, logoUrl: '' }))}
                          className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-medium transition"
                        >
                          Hapus Logo
                        </button>
                      )}
                    </div>

                    {/* Or URL Input */}
                    <input
                      type="url"
                      placeholder="Atau tempel link URL logo (https://...)"
                      value={schoolForm.logoUrl || ''}
                      onChange={(e) => setSchoolForm({ ...schoolForm, logoUrl: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-slate-500">
                  Logo sekolah akan ditampilkan pada header sidebar aplikasi, kartu pelajar barcode siswa, dan cetak laporan presensi.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NPSN *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="10303741"
                    value={schoolForm.npsn}
                    onChange={(e) => setSchoolForm({ ...schoolForm, npsn: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jenjang Sekolah *
                  </label>
                  <select
                    value={schoolForm.level}
                    onChange={(e) =>
                      setSchoolForm({ ...schoolForm, level: e.target.value as any })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="SMA">SMA (Sekolah Menengah Atas)</option>
                    <option value="SMK">SMK (Sekolah Menengah Kejuruan)</option>
                    <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                    <option value="SD">SD (Sekolah Dasar)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Lengkap *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Jl. Ki Hajar Dewantara No. 1, Tanah Garam"
                  value={schoolForm.address}
                  onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kota / Wilayah *
                  </label>
                  <input
                    type="text"
                    required
                    value={schoolForm.city}
                    onChange={(e) => setSchoolForm({ ...schoolForm, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kecamatan
                  </label>
                  <input
                    type="text"
                    value={schoolForm.district}
                    onChange={(e) => setSchoolForm({ ...schoolForm, district: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Kepala Sekolah *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Drs. H. Erizal, M.M."
                    value={schoolForm.principalName}
                    onChange={(e) =>
                      setSchoolForm({ ...schoolForm, principalName: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NIP Kepala Sekolah *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="19680315 199412 1 002"
                    value={schoolForm.principalNip}
                    onChange={(e) =>
                      setSchoolForm({ ...schoolForm, principalNip: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Resmi Sekolah
                  </label>
                  <input
                    type="email"
                    placeholder="info@sman1kotasolok.sch.id"
                    value={schoolForm.email}
                    onChange={(e) => setSchoolForm({ ...schoolForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. Telp Sekolah
                  </label>
                  <input
                    type="text"
                    placeholder="(0755) 20045"
                    value={schoolForm.phone}
                    onChange={(e) => setSchoolForm({ ...schoolForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSchoolModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs"
                >
                  {editingSchool ? 'Simpan Profil Sekolah' : 'Tambah Sekolah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION FOR DELETE TEACHER */}
      {deleteTeacherId && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 text-center animate-fade-in">
            <h4 className="font-bold text-sm text-slate-900 mb-1">Hapus Data Guru?</h4>
            <p className="text-xs text-slate-500 mb-4">
              Apakah Anda yakin ingin menghapus data guru ini dari sistem?
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setDeleteTeacherId(null)}
                className="px-3.5 py-1.5 text-xs rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeleteTeacher(deleteTeacherId);
                  setDeleteTeacherId(null);
                }}
                className="px-4 py-1.5 text-xs rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION FOR DELETE SCHOOL */}
      {deleteSchoolId && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 text-center animate-fade-in">
            <h4 className="font-bold text-sm text-slate-900 mb-1">Hapus Profil Sekolah?</h4>
            <p className="text-xs text-slate-500 mb-4">
              Apakah Anda yakin ingin menghapus profil sekolah ini?
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setDeleteSchoolId(null)}
                className="px-3.5 py-1.5 text-xs rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeleteSchool(deleteSchoolId);
                  setDeleteSchoolId(null);
                }}
                className="px-4 py-1.5 text-xs rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700"
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
