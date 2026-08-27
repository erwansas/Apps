import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Lock, 
  KeyRound, 
  Trash2, 
  RotateCcw, 
  Download, 
  Check, 
  X, 
  AlertTriangle,
  FileSpreadsheet,
  Database,
  Layers
} from 'lucide-react';
import { InventoryData } from '../types';
import { exportDataAsJSON, saveInventoryData } from '../utils/storage';
import { getInitialData } from '../data/initialData';

export type PurgeMode = 'transactions-only' | 'total-clean' | 'reset-demo';

interface AdminPurgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: InventoryData;
  onDataPurged: (newData: InventoryData, message: string) => void;
  initialMode?: PurgeMode;
}

export const AdminPurgeModal: React.FC<AdminPurgeModalProps> = ({
  isOpen,
  onClose,
  data,
  onDataPurged,
  initialMode = 'total-clean'
}) => {
  const [selectedMode, setSelectedMode] = useState<PurgeMode>(initialMode);
  const [pinInput, setPinInput] = useState('');
  const [confirmationTextInput, setConfirmationTextInput] = useState('');
  const [autoBackupChecked, setAutoBackupChecked] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const currentAdminPin = data.companySettings.adminPin || '1234';
  const expectedConfirmText = selectedMode === 'reset-demo' ? 'RESET' : 'HAPUS';

  const handleExecutePurge = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // 1. PIN Check
    if (pinInput.trim() !== currentAdminPin) {
      setErrorMessage('PIN Administrator salah! Pastikan Anda memasukkan PIN yang benar.');
      return;
    }

    // 2. Text Confirmation Check
    if (confirmationTextInput.trim().toUpperCase() !== expectedConfirmText) {
      setErrorMessage(`Ketik kata "${expectedConfirmText}" pada kotak konfirmasi untuk melanjutkan.`);
      return;
    }

    setIsProcessing(true);

    try {
      // 3. Auto backup if checked
      if (autoBackupChecked) {
        exportDataAsJSON();
      }

      let updatedData: InventoryData;
      let successMsg = '';

      if (selectedMode === 'transactions-only') {
        // Mode 1: Delete all transactions & set stock to 0
        const zeroStockItems = data.items.map(item => ({
          ...item,
          stok: 0,
          updatedAt: new Date().toISOString()
        }));

        updatedData = {
          ...data,
          items: zeroStockItems,
          transactions: []
        };
        successMsg = 'Seluruh riwayat transaksi berhasil dihapus & saldo stok barang di-reset ke 0.';
      } else if (selectedMode === 'total-clean') {
        // Mode 2: Fresh Start - delete all items and transactions, keep company profile & master configurations
        updatedData = {
          ...data,
          items: [],
          transactions: []
        };
        successMsg = 'Database barang sampel dan transaksi berhasil dikosongkan total (Fresh Start).';
      } else {
        // Mode 3: Reset to factory demo
        const factory = getInitialData();
        updatedData = {
          ...factory,
          companySettings: {
            ...factory.companySettings,
            // Retain custom branding if present
            logoText: data.companySettings.logoText || factory.companySettings.logoText,
            logoSubtitle: data.companySettings.logoSubtitle || factory.companySettings.logoSubtitle,
            logoTag: data.companySettings.logoTag !== undefined ? data.companySettings.logoTag : factory.companySettings.logoTag,
            logoUrl: data.companySettings.logoUrl || factory.companySettings.logoUrl,
            adminPin: data.companySettings.adminPin || factory.companySettings.adminPin
          }
        };
        successMsg = 'Data berhasil dikembalikan ke demo awal pabrik.';
      }

      saveInventoryData(updatedData);
      onDataPurged(updatedData, successMsg);
      setIsProcessing(false);
      onClose();
    } catch (err) {
      console.error('Error executing admin purge:', err);
      setErrorMessage('Terjadi kesalahan saat memproses pembersihan data.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/15 border border-white/20">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">Otorisasi Administrator</h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-black/30 border border-white/20">
                  Restricted Action
                </span>
              </div>
              <p className="text-xs text-rose-100 mt-0.5">
                Pembersihan Data Sampel &amp; Manajemen Reset Database
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleExecutePurge} className="p-6 overflow-y-auto space-y-5 text-slate-800">
          
          {/* Information Notice */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Tindakan ini permanen dan mengubah data sistem.</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Hanya Administrator berwenang yang dapat melakukan tindakan ini dengan memasukkan PIN Keamanan.
              </p>
            </div>
          </div>

          {/* Mode Selection Options */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              Pilih Opsi Pembersihan Data:
            </label>

            <div className="space-y-2.5">
              
              {/* Option 1: Clean Total (Fresh Start) */}
              <label 
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedMode === 'total-clean'
                    ? 'border-red-500 bg-red-50/40 ring-1 ring-red-500'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="purgeMode"
                  value="total-clean"
                  checked={selectedMode === 'total-clean'}
                  onChange={() => setSelectedMode('total-clean')}
                  className="mt-1 text-red-600 focus:ring-red-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-red-600" />
                      Kosongkan Database Total (Fresh Start)
                    </span>
                    <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                      Rekomendasi
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Menghapus seluruh {data.items.length} barang sampel dan {data.transactions.length} riwayat transaksi. Profil perusahaan, logo, kategori &amp; satuan tetap terjaga sehingga Anda siap input data riil dari nol.
                  </p>
                </div>
              </label>

              {/* Option 2: Reset Transaksi Saja */}
              <label 
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedMode === 'transactions-only'
                    ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="purgeMode"
                  value="transactions-only"
                  checked={selectedMode === 'transactions-only'}
                  onChange={() => setSelectedMode('transactions-only')}
                  className="mt-1 text-amber-600 focus:ring-amber-500"
                />
                <div className="flex-1">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                    Hapus Riwayat Transaksi Saja &amp; Reset Stok ke 0
                  </span>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Menghapus seluruh {data.transactions.length} mutasi masuk/keluar dan mengubah saldo stok seluruh barang ({data.items.length} SKU) menjadi 0. Nama barang dan katalog SKU tetap tersimpan.
                  </p>
                </div>
              </label>

              {/* Option 3: Reset Demo Pabrik */}
              <label 
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedMode === 'reset-demo'
                    ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="purgeMode"
                  value="reset-demo"
                  checked={selectedMode === 'reset-demo'}
                  onChange={() => setSelectedMode('reset-demo')}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-blue-600" />
                    Reset ke Data Demo Awal
                  </span>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Mengembalikan data ke konfigurasi demo bawaan pabrik (berguna untuk demonstrasi atau pelatihan staf).
                  </p>
                </div>
              </label>

            </div>
          </div>

          {/* Safety Backup Checkbox */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoBackupChecked}
                onChange={(e) => setAutoBackupChecked(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-slate-800">
                  Unduh cadangan data otomatis (.json) sebelum pembersihan dijalankan (Direkomendasikan)
                </span>
              </div>
            </label>
          </div>

          {/* Security Verification: PIN & Confirmation Text */}
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3.5 border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200 border-b border-slate-800 pb-2">
              <Lock className="w-4 h-4 text-rose-400" />
              Verifikasi Otoritas Administrator
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Input PIN */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                  PIN Administrator <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Masukkan PIN Administrator"
                  maxLength={12}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500 focus:outline-none font-mono font-bold tracking-widest text-center"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Aksi reset/pembersihan data hanya dapat dijalankan oleh pemegang PIN Administrator.
                </span>
              </div>

              {/* Text Confirmation */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Ketik kata: <span className="font-mono font-bold text-red-400 underline">{expectedConfirmText}</span>
                </label>
                <input
                  type="text"
                  required
                  value={confirmationTextInput}
                  onChange={(e) => setConfirmationTextInput(e.target.value)}
                  placeholder={`Ketik ${expectedConfirmText}`}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500 focus:outline-none font-mono uppercase font-bold text-center"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Konfirmasi pengaman ganda pencegah salah klik.
                </span>
              </div>
            </div>
          </div>

          {/* Error message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isProcessing ? 'Memproses...' : 'Eksekusi Pembersihan Data'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
