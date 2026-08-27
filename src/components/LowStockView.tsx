import React from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  ArrowDownLeft, 
  FileText, 
  Printer, 
  CheckCircle2, 
  Wallet, 
  ShoppingBag, 
  Boxes,
  Sparkles
} from 'lucide-react';
import { InventoryData, Item, UserRole } from '../types';
import { getItemStockStatus, formatRupiah } from '../utils/storage';
import { generateLowStockReportPDF } from '../utils/pdfGenerator';

interface LowStockViewProps {
  data: InventoryData;
  onSelectItemForRestock: (item: Item) => void;
  currentRole: UserRole;
  onOpenRoleModal: () => void;
}

export const LowStockView: React.FC<LowStockViewProps> = ({
  data,
  onSelectItemForRestock,
  currentRole,
  onOpenRoleModal
}) => {
  const outOfStockItems = data.items.filter(i => getItemStockStatus(i) === 'habis');
  const lowStockItems = data.items.filter(i => getItemStockStatus(i) === 'menipis');
  const allAlertItems = [...outOfStockItems, ...lowStockItems];

  const totalEstimatedCost = allAlertItems.reduce((acc, curr) => {
    const deficit = Math.max(0, (curr.minStok * 2) - curr.stok);
    return acc + (deficit * curr.hargaBeli);
  }, 0);

  const handlePrintReport = () => {
    const doc = generateLowStockReportPDF(allAlertItems, data.companySettings);
    doc.save(`laporan_rekomendasi_restock_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Pemantauan Ambang Batas &amp; Rekomendasi Re-stock
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitoring otomatis barang yang telah mencapai batas minimum atau habis total untuk percepatan pengadaan (Purchase Order).
          </p>
        </div>

        {allAlertItems.length > 0 && currentRole !== 'public' && (
          <button
            type="button"
            onClick={handlePrintReport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-xs transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            Cetak Laporan Re-stock PDF
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Out of Stock */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-rose-700 block">Stok Habis Total (0 Unit)</span>
            <span className="font-mono text-2xl font-black text-rose-600 mt-1 block">
              {outOfStockItems.length} SKU
            </span>
            <span className="text-[11px] text-slate-400">Prioritas Kritis Pengadaan</span>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50 text-rose-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-700 block">Stok Menipis (≤ Ambang Batas)</span>
            <span className="font-mono text-2xl font-black text-amber-600 mt-1 block">
              {lowStockItems.length} SKU
            </span>
            <span className="text-[11px] text-slate-400">Perlu Pemesanan Re-order</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Estimated Reorder Budget */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Estimasi Dana Re-order</span>
            <span className="font-mono text-xl font-black text-slate-900 mt-1 block truncate">
              {formatRupiah(totalEstimatedCost)}
            </span>
            <span className="text-[11px] text-slate-400">Target Stok Pengaman (2x Min)</span>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Alert List */}
      {allAlertItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">Semua Stok Gudang Dalam Kondisi Aman</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Tidak ada item barang yang berada di bawah ambang batas minimum. Operasional dan pengiriman dapat berjalan dengan lancar.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Daftar Rekomendasi Re-order Pengadaan ({allAlertItems.length} SKU)
            </h3>
            <span className="text-xs text-slate-500">
              Klik <strong>Restock Masuk</strong> untuk langsung memproses penerimaan stok
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-semibold">
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">SKU / Kode</th>
                  <th className="py-3.5 px-4">Nama Barang</th>
                  <th className="py-3.5 px-4 text-right">Sisa Stok</th>
                  <th className="py-3.5 px-4 text-right">Ambang Min</th>
                  <th className="py-3.5 px-4 text-right">Saran Order</th>
                  <th className="py-3.5 px-4">Supplier Utama</th>
                  <th className="py-3.5 px-4 text-right">Estimasi Biaya</th>
                  <th className="py-3.5 px-4 text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allAlertItems.map(item => {
                  const status = getItemStockStatus(item);
                  const isZero = status === 'habis';
                  const suggestedOrder = Math.max(1, (item.minStok * 2) - item.stok);
                  const estimatedCost = suggestedOrder * item.hargaBeli;

                  return (
                    <tr key={item.id} className={isZero ? 'bg-rose-50/30 hover:bg-rose-50/60' : 'hover:bg-amber-50/40'}>
                      
                      {/* Priority Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isZero ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                          'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {isZero ? '🔴 HABIS TOTAL' : '🟡 MENIPIS'}
                        </span>
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {item.sku}
                      </td>

                      {/* Nama */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{item.nama}</div>
                        <div className="text-[10px] text-slate-400">{item.kategori}</div>
                      </td>

                      {/* Sisa Stok */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className={`font-mono font-black text-sm ${isZero ? 'text-red-600' : 'text-amber-600'}`}>
                          {item.stok}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">{item.satuan}</span>
                      </td>

                      {/* Min Batas */}
                      <td className="py-3 px-4 text-right whitespace-nowrap text-slate-500 font-mono">
                        {item.minStok} {item.satuan}
                      </td>

                      {/* Saran Order */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          +{suggestedOrder} {item.satuan}
                        </span>
                      </td>

                      {/* Supplier */}
                      <td className="py-3 px-4 text-slate-700">
                        {item.supplierUtama || '-'}
                      </td>

                      {/* Estimasi Biaya */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-semibold text-slate-800">
                        {formatRupiah(estimatedCost)}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {currentRole !== 'public' ? (
                          <button
                            type="button"
                            onClick={() => onSelectItemForRestock(item)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            Restock Masuk
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={onOpenRoleModal}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Masuk untuk memproses restock"
                          >
                            <span>Perlu Login</span>
                          </button>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
