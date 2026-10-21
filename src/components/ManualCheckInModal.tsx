import React, { useState } from 'react';
import { UserCheck, X, Search, Check, AlertCircle } from 'lucide-react';
import { Student, AttendanceRecord, AttendanceStatus, SchoolSettings } from '../types/attendance';
import { getCurrentTimeStr, getTodayDateStr } from '../utils/initialData';
import { sound } from '../services/sound';

interface ManualCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  selectedDate: string;
  settings: SchoolSettings;
  onRecordAdded: (record: AttendanceRecord) => void;
}

export const ManualCheckInModal: React.FC<ManualCheckInModalProps> = ({
  isOpen,
  onClose,
  students,
  attendanceRecords,
  selectedDate,
  settings,
  onRecordAdded,
}) => {
  const [search, setSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [status, setStatus] = useState<AttendanceStatus>('hadir');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.nis.includes(search) ||
      s.className.toLowerCase().includes(search.toLowerCase())
  );

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const currentTime = getCurrentTimeStr();
    const newRecord: AttendanceRecord = {
      id: `rec-man-${Date.now()}`,
      studentId: selectedStudent.id,
      studentNis: selectedStudent.nis,
      studentName: selectedStudent.name,
      className: selectedStudent.className,
      date: selectedDate,
      time: currentTime,
      status: status,
      notes: notes.trim() || (status === 'hadir' ? 'Presensi manual' : ''),
      scannedVia: 'manual',
    };

    onRecordAdded(newRecord);
    sound.playSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full overflow-hidden animate-fade-in">
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm">Input Presensi Manual</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pilih Siswa:
            </label>
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama atau NIS siswa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
              {filtered.map((s) => {
                const isSelected = s.id === selectedStudentId;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedStudentId(s.id)}
                    className={`p-2.5 text-xs flex items-center justify-between cursor-pointer transition ${
                      isSelected ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <span className="block font-medium">{s.name}</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        NIS: {s.nis} • {s.className}
                      </span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Status Presensi:
            </label>
            <div className="grid grid-cols-5 gap-1.5 text-xs">
              {(['hadir', 'terlambat', 'sakit', 'izin', 'alpa'] as AttendanceStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`py-2 px-1 rounded-xl font-bold uppercase text-[11px] border transition ${
                    status === st
                      ? st === 'hadir'
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                        : st === 'terlambat'
                        ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                        : st === 'sakit'
                        ? 'bg-sky-600 border-sky-600 text-white shadow-xs'
                        : st === 'izin'
                        ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                        : 'bg-rose-600 border-rose-600 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Keterangan / Catatan Tambahan:
            </label>
            <input
              type="text"
              placeholder="Contoh: Kartu tertinggal / Surat izin dokter"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!selectedStudent}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs"
            >
              Simpan Presensi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
