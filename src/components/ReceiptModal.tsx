import React from 'react';
import { 
  X, 
  Printer, 
  Download, 
  FileText, 
  CheckCircle2, 
  Calendar, 
  User, 
  Building2, 
  Hash, 
  ArrowDownLeft, 
  ArrowUpRight 
} from 'lucide-react';
import { Transaction, Item, CompanySettings } from '../types';
import { formatRupiah, formatDateTimeIndo } from '../utils/storage';
import { generateSingleTransactionReceiptPDF } from '../utils/pdfGenerator';

interface ReceiptModalProps {
  transaction: Transaction | null;
  item?: Item;
  settings: CompanySettings;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  item,
  settings,
  onClose
}) => {
  if (!transaction) return null;

  const isMasuk = transaction.tipe === 'masuk';
  const isKeluar = transaction.tipe === 'keluar';

  const docTitle = isMasuk 
    ? 'BUKTI BARANG MASUK (BBM)' 
    : isKeluar 
    ? 'SURAT JALAN & BUKTI BARANG KELUAR (BBK)' 
    : 'BUKTI PENYESUAIAN STOK GUDANG';

  const handleDownloadPDF = () => {
    const doc = generateSingleTransactionReceiptPDF(transaction, item, settings);
    doc.save(`dokumen_${transaction.kodeTransaksi}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Control Bar */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold font-mono">{transaction.kodeTransaksi}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh PDF
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Paper */}
        <div className="p-6 space-y-5 bg-slate-50/50 max-h-[80vh] overflow-y-auto">
          
          {/* Header */}
          <div className="border-b border-slate-200 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {settings.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt={settings.namaPerusahaan}
                    className="h-10 w-10 object-contain rounded-lg border border-slate-200 bg-white p-0.5"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-base">
                    <Building2 className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h2 className="text-base font-black text-slate-900">{settings.namaPerusahaan}</h2>
                  <p className="text-xs text-slate-500">{settings.namaGudang}</p>
                  <p className="text-[11px] text-slate-400">{settings.alamat} • Telp: {settings.telepon}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                  isMasuk ? 'bg-emerald-100 text-emerald-800' :
                  isKeluar ? 'bg-rose-100 text-rose-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {isMasuk && <ArrowDownLeft className="w-3.5 h-3.5" />}
                  {isKeluar && <ArrowUpRight className="w-3.5 h-3.5" />}
                  {docTitle}
                </span>
                <div className="text-[11px] font-mono text-slate-400 mt-1">
                  Waktu: {formatDateTimeIndo(transaction.tanggal)}
                </div>
              </div>
            </div>
          </div>

          {/* Meta Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-white p-4 rounded-xl border border-slate-200">
            <div className="space-y-1.5">
              <div>
                <span className="text-slate-400 block text-[10px]">No. Transaksi:</span>
                <span className="font-mono font-bold text-slate-800">{transaction.kodeTransaksi}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Alur / Alasan:</span>
                <span className="font-semibold text-slate-800">{transaction.alasanAlur}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Pihak Terkait:</span>
                <span className="font-semibold text-slate-800">{transaction.pihakTerkait || '-'}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div>
                <span className="text-slate-400 block text-[10px]">No. Dokumen Referensi:</span>
                <span className="font-mono font-semibold text-slate-800">{transaction.referensiDokumen || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Petugas Logistik:</span>
                <span className="font-semibold text-slate-800">{transaction.petugas}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Keterangan:</span>
                <span className="text-slate-600">{transaction.catatan || 'Kondisi barang baik & sesuai standar.'}</span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">No</th>
                  <th className="py-2.5 px-3">Kode SKU</th>
                  <th className="py-2.5 px-3">Deskripsi Barang</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3 text-right">Kuantitas</th>
                  <th className="py-2.5 px-3 text-right">Perubahan Stok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-3 text-slate-500">1</td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-800">{transaction.itemSku}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800">{transaction.itemNama}</td>
                  <td className="py-3 px-3 text-slate-600">{item ? item.kategori : '-'}</td>
                  <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                    {transaction.jumlah} {item ? item.satuan : 'Unit'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-500">
                    {transaction.stokSebelum} → <strong>{transaction.stokSesudah}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 text-center text-xs">
            <div className="space-y-8">
              <span className="text-slate-500 text-[11px] block">
                {isMasuk ? 'Pengirim / Vendor:' : 'Penerima / Klien:'}
              </span>
              <div className="border-b border-slate-300 w-32 mx-auto" />
              <span className="text-slate-600 text-[11px] font-medium block">( ................................... )</span>
            </div>

            <div className="space-y-8">
              <span className="text-slate-500 text-[11px] block">Petugas Gudang:</span>
              <div className="border-b border-slate-300 w-32 mx-auto" />
              <span className="text-slate-800 text-[11px] font-bold block">{transaction.petugas}</span>
            </div>

            <div className="space-y-8">
              <span className="text-slate-500 text-[11px] block">Mengetahui / Supervisor:</span>
              <div className="border-b border-slate-300 w-32 mx-auto" />
              <span className="text-slate-800 text-[11px] font-bold block">{settings.supervisor}</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
