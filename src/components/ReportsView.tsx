import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  Filter, 
  Building2, 
  CheckCircle2, 
  Boxes, 
  ArrowLeftRight, 
  AlertTriangle,
  Eye
} from 'lucide-react';
import { InventoryData, Item, UserRole } from '../types';
import { 
  generateStockReportPDF, 
  generateMutationReportPDF, 
  generateLowStockReportPDF 
} from '../utils/pdfGenerator';
import { exportInventoryToCSV, getItemStockStatus } from '../utils/storage';
import { GoogleSheetsSyncCard } from './GoogleSheetsSyncCard';

interface ReportsViewProps {
  data: InventoryData;
  currentRole?: UserRole;
  onOpenRoleModal?: () => void;
}

type ReportType = 'stok' | 'mutasi' | 'restock';

export const ReportsView: React.FC<ReportsViewProps> = ({ 
  data, 
  currentRole = 'admin', 
  onOpenRoleModal = () => {} 
}) => {
  const [reportType, setReportType] = useState<ReportType>('stok');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [timeFilter, setTimeFilter] = useState<'semua' | 'hari-ini' | '7-hari' | 'bulan-ini'>('bulan-ini');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  // Filter Items for Stock Report
  const filteredItems = data.items.filter(item => {
    return selectedCategory === 'Semua' || item.kategori === selectedCategory;
  });

  // Filter Transactions for Mutation Report
  const filteredTransactions = data.transactions.filter(t => {
    if (timeFilter === 'semua') return true;
    const trxDate = new Date(t.createdAt || t.tanggal);
    const now = new Date();
    if (timeFilter === 'hari-ini') {
      return trxDate.toDateString() === now.toDateString();
    } else if (timeFilter === '7-hari') {
      const diff = (now.getTime() - trxDate.getTime()) / (1000 * 3600 * 24);
      return diff <= 7;
    } else if (timeFilter === 'bulan-ini') {
      return trxDate.getMonth() === now.getMonth() && trxDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  // Filter items for low stock report
  const alertItems = data.items.filter(i => {
    const s = getItemStockStatus(i);
    return s === 'menipis' || s === 'habis';
  });

  const handleGenerateAndDownload = () => {
    let doc;
    let fileName = '';

    if (reportType === 'stok') {
      doc = generateStockReportPDF(filteredItems, data.companySettings);
      fileName = `laporan_posisi_stok_${new Date().toISOString().slice(0, 10)}.pdf`;
    } else if (reportType === 'mutasi') {
      const filterDesc = `Periode: ${timeFilter.toUpperCase()} | Total: ${filteredTransactions.length} Transaksi`;
      doc = generateMutationReportPDF(filteredTransactions, data.companySettings, filterDesc);
      fileName = `laporan_mutasi_gudang_${new Date().toISOString().slice(0, 10)}.pdf`;
    } else {
      doc = generateLowStockReportPDF(alertItems, data.companySettings);
      fileName = `laporan_rekomendasi_restock_${new Date().toISOString().slice(0, 10)}.pdf`;
    }

    doc.save(fileName);
  };

  const handlePreviewPDF = () => {
    let doc;
    if (reportType === 'stok') {
      doc = generateStockReportPDF(filteredItems, data.companySettings);
    } else if (reportType === 'mutasi') {
      const filterDesc = `Periode: ${timeFilter.toUpperCase()} | Total: ${filteredTransactions.length} Transaksi`;
      doc = generateMutationReportPDF(filteredTransactions, data.companySettings, filterDesc);
    } else {
      doc = generateLowStockReportPDF(alertItems, data.companySettings);
    }

    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    setPdfPreviewUrl(url);
  };

  if (currentRole === 'public') {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8 md:p-12 text-center max-w-2xl mx-auto space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
            <FileText className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">
              Akses Laporan PDF Dibatasi
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Pusat Cetak Dokumen &amp; Laporan PDF berstandar kantor hanya dapat diakses oleh akun <strong>Staf Gudang</strong>, <strong>Supervisor</strong>, atau <strong>Administrator</strong>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-left space-y-1.5">
            <div className="font-semibold text-slate-700 flex items-center gap-1.5">
              <span>Fitur yang dilindungi:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
              <li>Laporan Posisi Stok &amp; Valuasi Total Aset (KOP Resmi)</li>
              <li>Laporan Rekapitulasi Mutasi Masuk/Keluar (Surat Jalan)</li>
              <li>Laporan Rekomendasi Restock Pengadaan (Purchase Order)</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={onOpenRoleModal}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <span>Masuk sebagai Staf / Admin</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-slate-900 text-white">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Pusat Cetak Laporan PDF &amp; Ekspor Spreadsheet
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Ekspor laporan resmi berstandar korporat lengkap dengan KOP Surat, rincian valuasi, dan sinkronisasi Google Spreadsheet.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => exportInventoryToCSV(filteredItems)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors"
          >
            <Download className="w-4 h-4" />
            Ekspor Excel (CSV)
          </button>
        </div>
      </div>

      {/* Google Sheets Live Sync Card */}
      <GoogleSheetsSyncCard data={data} />

      {/* 3 Report Types Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Type 1: Posisi Stok */}
        <div
          onClick={() => {
            setReportType('stok');
            setPdfPreviewUrl(null);
          }}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            reportType === 'stok'
              ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-md'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`p-2.5 rounded-xl ${reportType === 'stok' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
              <Boxes className="w-5 h-5" />
            </div>
            {reportType === 'stok' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                Dipilih
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-slate-900 mt-3">Laporan Posisi Stok &amp; Valuasi</h3>
          <p className="text-xs text-slate-500 mt-1">
            Daftar lengkap seluruh SKU, jumlah fisik di rak, harga pokok, total nilai aset inventaris, dan status ambang batas.
          </p>
        </div>

        {/* Type 2: Mutasi Masuk/Keluar */}
        <div
          onClick={() => {
            setReportType('mutasi');
            setPdfPreviewUrl(null);
          }}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            reportType === 'mutasi'
              ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-md'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`p-2.5 rounded-xl ${reportType === 'mutasi' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            {reportType === 'mutasi' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                Dipilih
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-slate-900 mt-3">Laporan Mutasi Masuk &amp; Keluar</h3>
          <p className="text-xs text-slate-500 mt-1">
            Buku catatan pergerakan barang dalam periode tertentu, nomor surat jalan, supplier, pihak penerima, dan petugas logistik.
          </p>
        </div>

        {/* Type 3: Restock Rekomendasi */}
        <div
          onClick={() => {
            setReportType('restock');
            setPdfPreviewUrl(null);
          }}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            reportType === 'restock'
              ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-md'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`p-2.5 rounded-xl ${reportType === 'restock' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            {reportType === 'restock' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                Dipilih
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-slate-900 mt-3">Laporan Rekomendasi Re-stock</h3>
          <p className="text-xs text-slate-500 mt-1">
            Daftar pengajuan pengadaan barang kritis &amp; menipis untuk persetujuan manajer / bagian purchasing.
          </p>
        </div>

      </div>

      {/* Filter and Action Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Parameter Cetak Laporan
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          
          {/* Category Filter (Active for Stock report) */}
          {reportType === 'stok' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Filter Kategori</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Semua">Semua Kategori ({data.items.length} Item)</option>
                {data.categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {/* Time Filter (Active for Mutation report) */}
          {reportType === 'mutasi' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Periode Waktu Mutasi</label>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold"
              >
                <option value="bulan-ini">Bulan Ini (Default)</option>
                <option value="hari-ini">Hari Ini Saja</option>
                <option value="7-hari">7 Hari Terakhir</option>
                <option value="semua">Semua Riwayat Mutasi</option>
              </select>
            </div>
          )}

          {/* Warehouse PIC Info Summary */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Penandatangan Laporan</label>
            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
              Admin: <strong>{data.companySettings.adminGudang}</strong> | Spv: <strong>{data.companySettings.supervisor}</strong>
            </div>
          </div>

          {/* Company Profile Indicator */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">KOP Perusahaan</label>
            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 truncate">
              {data.companySettings.namaPerusahaan}
            </div>
          </div>

        </div>

        {/* Buttons: Preview & Download PDF */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={handlePreviewPDF}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Pratinjau PDF di Layar
          </button>

          <button
            type="button"
            onClick={handleGenerateAndDownload}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Unduh Dokumen PDF Otomatis
          </button>
        </div>

      </div>

      {/* PDF Live Preview Box */}
      {pdfPreviewUrl && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Pratinjau Dokumen PDF Resmi
            </h3>
            <button
              type="button"
              onClick={() => setPdfPreviewUrl(null)}
              className="text-xs text-slate-400 hover:text-slate-700 font-semibold"
            >
              Tutup Pratinjau
            </button>
          </div>

          <div className="w-full h-[600px] bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
            <iframe
              src={pdfPreviewUrl}
              className="w-full h-full border-0"
              title="Pratinjau Dokumen PDF Laporan Gudang"
            />
          </div>
        </div>
      )}

    </div>
  );
};
