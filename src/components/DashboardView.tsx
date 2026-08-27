import React from 'react';
import { 
  Boxes, 
  ArrowDownLeft, 
  ArrowUpRight, 
  AlertTriangle, 
  Wallet, 
  Plus, 
  FileText, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  ChevronRight,
  ShieldAlert,
  Printer,
  Sparkles,
  Lock,
  Eye
} from 'lucide-react';
import { InventoryData, ActiveTab, Item, Transaction, UserRole } from '../types';
import { formatRupiah, getItemStockStatus, formatDateTimeIndo } from '../utils/storage';
import { canUserAddItem } from '../utils/rbac';

interface DashboardViewProps {
  data: InventoryData;
  setActiveTab: (tab: ActiveTab) => void;
  onSelectItemForRestock: (item: Item) => void;
  onViewTransactionReceipt: (trx: Transaction) => void;
  currentRole: UserRole;
  onOpenRoleModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  setActiveTab,
  onSelectItemForRestock,
  onViewTransactionReceipt,
  currentRole,
  onOpenRoleModal
}) => {
  // Calculations
  const totalSku = data.items.length;
  const totalPhysicalStock = data.items.reduce((acc, curr) => acc + curr.stok, 0);
  const totalAssetValuation = data.items.reduce((acc, curr) => acc + (curr.stok * curr.hargaBeli), 0);

  const lowStockItems = data.items.filter(i => getItemStockStatus(i) === 'menipis');
  const outOfStockItems = data.items.filter(i => getItemStockStatus(i) === 'habis');
  const safeStockItems = data.items.filter(i => getItemStockStatus(i) === 'aman');

  // Transactions metrics
  const totalMasukUnits = data.transactions
    .filter(t => t.tipe === 'masuk')
    .reduce((acc, c) => acc + c.jumlah, 0);

  const totalKeluarUnits = data.transactions
    .filter(t => t.tipe === 'keluar')
    .reduce((acc, c) => acc + c.jumlah, 0);

  const recentTransactions = [...data.transactions]
    .sort((a, b) => new Date(b.createdAt || b.tanggal).getTime() - new Date(a.createdAt || a.tanggal).getTime())
    .slice(0, 5);

  // Group by category for distribution
  const categoryDistribution = data.categories.map(cat => {
    const itemsInCat = data.items.filter(i => i.kategori === cat);
    const count = itemsInCat.length;
    const totalQty = itemsInCat.reduce((acc, c) => acc + c.stok, 0);
    const totalValue = itemsInCat.reduce((acc, c) => acc + (c.stok * c.hargaBeli), 0);
    return {
      category: cat,
      count,
      totalQty,
      totalValue,
      percentage: totalPhysicalStock > 0 ? Math.round((totalQty / totalPhysicalStock) * 100) : 0
    };
  }).sort((a, b) => b.totalQty - a.totalQty);

  return (
    <div className="space-y-6">
      
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Dashboard Manajemen Gudang
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              Sistem Aktif & Terhubung
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pantau pergerakan stok, ambang batas minimum, serta transaksi masuk dan keluar secara real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {currentRole !== 'public' && (
            <>
              <button
                id="btn-quick-stock-in"
                type="button"
                onClick={() => setActiveTab('stock-in')}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer"
              >
                <ArrowDownLeft className="w-4 h-4" />
                + Barang Masuk
              </button>

              <button
                id="btn-quick-stock-out"
                type="button"
                onClick={() => setActiveTab('stock-out')}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-colors cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" />
                - Barang Keluar
              </button>

              {canUserAddItem(currentRole, data.companySettings) && (
                <button
                  id="btn-quick-add-item"
                  type="button"
                  onClick={() => setActiveTab('inventory')}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Tambah SKU
                </button>
              )}

              <button
                id="btn-quick-report"
                type="button"
                onClick={() => setActiveTab('reports')}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                Cetak PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* Critical Stock Alert Banner */}
      {(outOfStockItems.length > 0 || lowStockItems.length > 0) && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900 flex items-center gap-2">
                Peringatan Ambang Batas Stok!
                {outOfStockItems.length > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-600 text-white">
                    {outOfStockItems.length} SKU Habis Total
                  </span>
                )}
                {lowStockItems.length > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-600 text-white">
                    {lowStockItems.length} SKU Menipis
                  </span>
                )}
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Segera lakukan pemesanan ulang (Purchase Order) agar proses operasional dan pengiriman tidak terhambat.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('low-stock')}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-600 text-white hover:bg-amber-700 transition-colors shrink-0 flex items-center justify-center gap-1.5 shadow-xs"
          >
            Lihat Daftar Re-stock
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4 Key KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Physical Stock & SKU */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Stok Fisik</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 font-mono">
              {totalPhysicalStock.toLocaleString('id-ID')}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>{totalSku} SKU Terdaftar</span>
              <span className="text-blue-600 font-medium">{data.locations.length} Lokasi Rak</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Barang Masuk */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Barang Masuk</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600 font-mono">
              +{totalMasukUnits.toLocaleString('id-ID')}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>Unit Diterima</span>
              <span className="text-emerald-700 font-medium">Inbound Logistik</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Barang Keluar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Barang Keluar</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-600 font-mono">
              -{totalKeluarUnits.toLocaleString('id-ID')}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>Unit Terkirim/Dipakai</span>
              <span className="text-rose-700 font-medium">Outbound Logistik</span>
            </div>
          </div>
        </div>

        {/* Card 4: Total Valuasi Asset */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Nilai Aset Stok</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-slate-900 font-mono truncate">
              {formatRupiah(totalAssetValuation)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>Berdasarkan Harga Pokok</span>
              <span className="text-indigo-600 font-medium">Valuasi Gudang</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Grid: Status Kesehatan Stok + Distribusi Kategori */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Recent Transactions Activity */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Riwayat Mutasi Terkini</h3>
              <p className="text-xs text-slate-500">Aktivitas barang masuk, keluar, dan penyesuaian terbaru</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('transactions')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              Buku Mutasi Lengkap
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                  <th className="pb-3 pr-4">Kode Trx / Waktu</th>
                  <th className="pb-3 px-3">Jenis</th>
                  <th className="pb-3 px-3">Barang</th>
                  <th className="pb-3 px-3 text-right">Kuantitas</th>
                  <th className="pb-3 px-3">Pihak / Petugas</th>
                  <th className="pb-3 pl-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.map((trx) => {
                  const isMasuk = trx.tipe === 'masuk';
                  const isKeluar = trx.tipe === 'keluar';

                  return (
                    <tr key={trx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="font-mono font-bold text-slate-800">{trx.kodeTransaksi}</div>
                        <div className="text-[11px] text-slate-400">{formatDateTimeIndo(trx.tanggal)}</div>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isMasuk ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          isKeluar ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {isMasuk && <ArrowDownLeft className="w-3 h-3" />}
                          {isKeluar && <ArrowUpRight className="w-3 h-3" />}
                          {trx.tipe.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800 truncate max-w-[180px]">{trx.itemNama}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{trx.itemSku}</div>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span className={`font-mono font-bold ${
                          isMasuk ? 'text-emerald-600' : isKeluar ? 'text-rose-600' : 'text-blue-600'
                        }`}>
                          {isMasuk ? `+${trx.jumlah}` : isKeluar ? `-${trx.jumlah}` : `${trx.jumlah}`}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {trx.stokSebelum} → {trx.stokSesudah}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="text-slate-700 truncate max-w-[140px]">{trx.pihakTerkait || trx.alasanAlur}</div>
                        <div className="text-[10px] text-slate-400 truncate">{trx.petugas}</div>
                      </td>

                      <td className="py-3 pl-3 text-center">
                        <button
                          type="button"
                          onClick={() => onViewTransactionReceipt(trx)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Cetak Bukti Transaksi"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Status Kesehatan Stok & Re-order Suggestions */}
        <div className="space-y-6">
          
          {/* Status Breakdown Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Kesehatan Stok Gudang</h3>
            
            <div className="space-y-3">
              {/* Aman */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Stok Aman (&gt; Ambang Min)
                  </span>
                  <span className="font-mono font-bold text-slate-800">{safeStockItems.length} SKU</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{ width: `${totalSku > 0 ? (safeStockItems.length / totalSku) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Menipis */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    Stok Menipis (≤ Ambang Min)
                  </span>
                  <span className="font-mono font-bold text-amber-600">{lowStockItems.length} SKU</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all"
                    style={{ width: `${totalSku > 0 ? (lowStockItems.length / totalSku) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Habis */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    Stok Habis (0 Unit)
                  </span>
                  <span className="font-mono font-bold text-rose-600">{outOfStockItems.length} SKU</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-rose-500 h-full rounded-full transition-all"
                    style={{ width: `${totalSku > 0 ? (outOfStockItems.length / totalSku) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('low-stock')}
                className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 transition-colors"
              >
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Kelola Semua Peringatan Stok ({lowStockItems.length + outOfStockItems.length})
              </button>
            </div>
          </div>

          {/* Category Distribution Mini List */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Distribusi Kategori</h3>
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {categoryDistribution.slice(0, 5).map(cat => (
                <div key={cat.category} className="flex items-center justify-between text-xs">
                  <div className="truncate max-w-[150px]">
                    <span className="font-semibold text-slate-700 truncate block">{cat.category}</span>
                    <span className="text-[10px] text-slate-400">{cat.count} SKU terdaftar</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-800">{cat.totalQty} unit</span>
                    <span className="text-[10px] text-slate-400 block">{cat.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
