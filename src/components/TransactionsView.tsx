import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  ArrowDownLeft, 
  ArrowUpRight, 
  SlidersHorizontal, 
  Download, 
  FileText, 
  Printer, 
  Calendar, 
  Eye,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { InventoryData, Transaction, UserRole } from '../types';
import { formatRupiah, formatDateTimeIndo } from '../utils/storage';
import { generateMutationReportPDF } from '../utils/pdfGenerator';
import { AdminPurgeModal } from './AdminPurgeModal';

interface TransactionsViewProps {
  data: InventoryData;
  onViewTransactionReceipt: (trx: Transaction) => void;
  onRestoreData?: (newData: InventoryData) => void;
  currentRole: UserRole;
  onOpenRoleModal: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  data,
  onViewTransactionReceipt,
  onRestoreData,
  currentRole,
  onOpenRoleModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'semua' | 'masuk' | 'keluar' | 'penyesuaian'>('semua');
  const [timeFilter, setTimeFilter] = useState<'semua' | 'hari-ini' | '7-hari' | 'bulan-ini'>('semua');
  const [reasonFilter, setReasonFilter] = useState('Semua');
  const [adminPurgeModalOpen, setAdminPurgeModalOpen] = useState(false);
  const [adminFeedbackToast, setAdminFeedbackToast] = useState<string | null>(null);

  // Filter transactions
  const filteredTransactions = data.transactions.filter(t => {
    // Search match
    const query = searchQuery.toLowerCase();
    const matchSearch = 
      t.kodeTransaksi.toLowerCase().includes(query) ||
      t.itemNama.toLowerCase().includes(query) ||
      t.itemSku.toLowerCase().includes(query) ||
      (t.referensiDokumen && t.referensiDokumen.toLowerCase().includes(query)) ||
      (t.pihakTerkait && t.pihakTerkait.toLowerCase().includes(query)) ||
      t.petugas.toLowerCase().includes(query);

    // Type match
    const matchType = typeFilter === 'semua' || t.tipe === typeFilter;

    // Reason match
    const matchReason = reasonFilter === 'Semua' || t.alasanAlur === reasonFilter;

    // Time filter
    let matchTime = true;
    if (timeFilter !== 'semua') {
      const trxDate = new Date(t.createdAt || t.tanggal);
      const now = new Date();
      if (timeFilter === 'hari-ini') {
        matchTime = trxDate.toDateString() === now.toDateString();
      } else if (timeFilter === '7-hari') {
        const diffDays = (now.getTime() - trxDate.getTime()) / (1000 * 3600 * 24);
        matchTime = diffDays <= 7;
      } else if (timeFilter === 'bulan-ini') {
        matchTime = trxDate.getMonth() === now.getMonth() && trxDate.getFullYear() === now.getFullYear();
      }
    }

    return matchSearch && matchType && matchReason && matchTime;
  }).sort((a, b) => new Date(b.createdAt || b.tanggal).getTime() - new Date(a.createdAt || a.tanggal).getTime());

  // Calculations for filtered list
  const totalMasukUnits = filteredTransactions.filter(t => t.tipe === 'masuk').reduce((a, c) => a + c.jumlah, 0);
  const totalKeluarUnits = filteredTransactions.filter(t => t.tipe === 'keluar').reduce((a, c) => a + c.jumlah, 0);
  const totalNilaiPerputaran = filteredTransactions.reduce((a, c) => a + (c.totalNilai || 0), 0);

  const handleExportPDF = () => {
    const filterDesc = `Periode: ${timeFilter.toUpperCase()} | Jenis: ${typeFilter.toUpperCase()} | Total: ${filteredTransactions.length} Transaksi`;
    const doc = generateMutationReportPDF(filteredTransactions, data.companySettings, filterDesc);
    doc.save(`laporan_mutasi_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleExportCSV = () => {
    const headers = ['Kode Transaksi', 'Tanggal', 'Jenis', 'SKU', 'Nama Barang', 'Jumlah', 'Stok Sebelum', 'Stok Sesudah', 'Alasan/Alur', 'Pihak Terkait', 'No Dokumen', 'Petugas', 'Total Nilai (IDR)'];
    const rows = filteredTransactions.map(t => [
      `"${t.kodeTransaksi}"`,
      `"${t.tanggal}"`,
      `"${t.tipe.toUpperCase()}"`,
      `"${t.itemSku}"`,
      `"${t.itemNama.replace(/"/g, '""')}"`,
      t.jumlah,
      t.stokSebelum,
      t.stokSesudah,
      `"${t.alasanAlur}"`,
      `"${(t.pihakTerkait || '').replace(/"/g, '""')}"`,
      `"${(t.referensiDokumen || '').replace(/"/g, '""')}"`,
      `"${t.petugas}"`,
      t.totalNilai || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `buku_mutasi_transaksi_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Combine unique reasons from history for dropdown
  const uniqueReasons = Array.from(new Set(data.transactions.map(t => t.alasanAlur)));

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-slate-900 text-white">
              <History className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Buku Mutasi &amp; Riwayat Transaksi Lengkap
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {currentRole === 'public'
              ? 'Tampilan publik (read-only): Telusuri riwayat mutasi masuk, keluar, dan cetak bukti transaksi.'
              : 'Audit trail pergerakan stok, verifikasi penerimaan barang masuk, surat jalan keluar, dan penyesuaian opname.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {currentRole === 'admin' && data.transactions.length > 0 && (
            <button
              type="button"
              onClick={() => setAdminPurgeModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
              title="Bersihkan Histori Mutasi & Nol-kan Stok (Khusus Admin)"
            >
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Bersihkan Mutasi (Admin)</span>
            </button>
          )}

          {currentRole !== 'public' && (
            <>
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer"
                title="Ekspor Data Mutasi ke CSV"
              >
                <Download className="w-4 h-4" />
                Ekspor CSV
              </button>

              <button
                type="button"
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-xs transition-colors cursor-pointer"
                title="Cetak Dokumen Laporan Mutasi PDF"
              >
                <FileText className="w-4 h-4" />
                Cetak Mutasi PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block">Total Transaksi Sesuai Filter</span>
            <span className="font-mono text-lg font-black text-slate-800">{filteredTransactions.length} Transaksi</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
            <History className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block">Volume Mutasi Masuk (+)</span>
            <span className="font-mono text-lg font-black text-emerald-600">+{totalMasukUnits.toLocaleString('id-ID')} unit</span>
          </div>
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block">Volume Mutasi Keluar (-)</span>
            <span className="font-mono text-lg font-black text-rose-600">-{totalKeluarUnits.toLocaleString('id-ID')} unit</span>
          </div>
          <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Search & Multi Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari No Trx, SKU, Dokumen, Petugas..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            >
              <option value="semua">Semua Jenis Mutasi</option>
              <option value="masuk">🟢 Barang Masuk (Inbound)</option>
              <option value="keluar">🔴 Barang Keluar (Outbound)</option>
              <option value="penyesuaian">🔵 Penyesuaian (Opname)</option>
            </select>
          </div>

          {/* Time Filter */}
          <div>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="semua">Semua Periode Waktu</option>
              <option value="hari-ini">Hari Ini</option>
              <option value="7-hari">7 Hari Terakhir</option>
              <option value="bulan-ini">Bulan Ini</option>
            </select>
          </div>

          {/* Reason Filter */}
          <div>
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 truncate"
            >
              <option value="Semua">Semua Alur / Alasan</option>
              {uniqueReasons.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Filter Reset bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Menampilkan <strong className="text-slate-800">{filteredTransactions.length}</strong> transaksi</span>
          {(searchQuery || typeFilter !== 'semua' || timeFilter !== 'semua' || reasonFilter !== 'Semua') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('semua');
                setTimeFilter('semua');
                setReasonFilter('Semua');
              }}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="py-3.5 px-4">No. Transaksi</th>
                <th className="py-3.5 px-4">Waktu</th>
                <th className="py-3.5 px-4 text-center">Jenis</th>
                <th className="py-3.5 px-4">Barang &amp; SKU</th>
                <th className="py-3.5 px-4 text-right">Kuantitas</th>
                <th className="py-3.5 px-4 text-center">Stok (Lalu → Kini)</th>
                <th className="py-3.5 px-4">Alur / Pihak Terkait</th>
                <th className="py-3.5 px-4">No. Dokumen</th>
                <th className="py-3.5 px-4">Petugas</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-medium text-slate-500">Tidak ada riwayat transaksi yang cocok dengan filter.</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(trx => {
                  const isMasuk = trx.tipe === 'masuk';
                  const isKeluar = trx.tipe === 'keluar';

                  return (
                    <tr key={trx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {trx.kodeTransaksi}
                      </td>

                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {formatDateTimeIndo(trx.tanggal)}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isMasuk ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          isKeluar ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                          'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {isMasuk && <ArrowDownLeft className="w-3 h-3" />}
                          {isKeluar && <ArrowUpRight className="w-3 h-3" />}
                          {isMasuk ? 'MASUK' : isKeluar ? 'KELUAR' : 'OPNAME'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{trx.itemNama}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{trx.itemSku}</div>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className={`font-mono text-sm font-black ${
                          isMasuk ? 'text-emerald-600' : isKeluar ? 'text-rose-600' : 'text-blue-600'
                        }`}>
                          {isMasuk ? `+${trx.jumlah}` : isKeluar ? `-${trx.jumlah}` : `${trx.jumlah}`}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap font-mono text-slate-600">
                        <span className="text-slate-400">{trx.stokSebelum}</span>
                        <span className="mx-1.5 text-slate-300">→</span>
                        <span className="font-bold text-slate-800">{trx.stokSesudah}</span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">{trx.alasanAlur}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[160px]">{trx.pihakTerkait || '-'}</div>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {trx.referensiDokumen || '-'}
                      </td>

                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {trx.petugas}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onViewTransactionReceipt(trx)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Lihat / Cetak Bukti Dokumen"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Purge Modal */}
      <AdminPurgeModal
        isOpen={adminPurgeModalOpen}
        onClose={() => setAdminPurgeModalOpen(false)}
        data={data}
        onDataPurged={(newData, msg) => {
          if (onRestoreData) {
            onRestoreData(newData);
          }
          setAdminFeedbackToast(msg);
          setTimeout(() => setAdminFeedbackToast(null), 5000);
        }}
        initialMode="transactions-only"
      />

      {/* Toast Notification */}
      {adminFeedbackToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{adminFeedbackToast}</span>
        </div>
      )}

    </div>
  );
};
