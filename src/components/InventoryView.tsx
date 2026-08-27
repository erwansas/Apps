import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  ArrowDownLeft, 
  ArrowUpRight, 
  SlidersHorizontal, 
  QrCode, 
  Download, 
  FileText, 
  Check, 
  AlertTriangle, 
  X,
  Sparkles,
  RefreshCw,
  Printer,
  ShieldAlert,
  Lock,
  KeyRound,
  ShieldCheck,
  Database
} from 'lucide-react';
import { Item, InventoryData, Transaction, UserRole } from '../types';
import { 
  getItemStockStatus, 
  formatRupiah, 
  generateSKU, 
  exportInventoryToCSV,
  generateTransactionCode 
} from '../utils/storage';
import { generateStockReportPDF } from '../utils/pdfGenerator';
import { canUserAddItem, canUserAdjustStock } from '../utils/rbac';
import { AdminPurgeModal, PurgeMode } from './AdminPurgeModal';

interface InventoryViewProps {
  data: InventoryData;
  onSaveItem: (item: Item, isNew: boolean) => void;
  onDeleteItem: (itemId: string) => void;
  onRecordAdjustment: (transaction: Transaction, updatedItem: Item) => void;
  onOpenStockIn: (item: Item) => void;
  onOpenStockOut: (item: Item) => void;
  onRestoreData?: (newData: InventoryData) => void;
  currentRole: UserRole;
  onOpenRoleModal: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  data,
  onSaveItem,
  onDeleteItem,
  onRecordAdjustment,
  onOpenStockIn,
  onOpenStockOut,
  onRestoreData,
  currentRole,
  onOpenRoleModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState<'semua' | 'aman' | 'menipis' | 'habis'>('semua');

  // Modals state
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState<Item | null>(null);
  const [actualStockInput, setActualStockInput] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState('Hasil Stock Opname Bulanan');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');

  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [barcodeItem, setBarcodeItem] = useState<Item | null>(null);

  // Admin Purge and Single Delete States
  const [adminPurgeModalOpen, setAdminPurgeModalOpen] = useState(false);
  const [adminFeedbackToast, setAdminFeedbackToast] = useState<string | null>(null);
  const [singleDeleteModalOpen, setSingleDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [singleDeletePinInput, setSingleDeletePinInput] = useState('');
  const [singleDeleteError, setSingleDeleteError] = useState('');

  // Form State for Add/Edit Item
  const [formSku, setFormSku] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formKategori, setFormKategori] = useState(data.categories[0] || 'Elektronik & Perangkat');
  const [formLokasi, setFormLokasi] = useState(data.locations[0] || 'Gudang Utama');
  const [formStok, setFormStok] = useState<number | string>('');
  const [formMinStok, setFormMinStok] = useState<number | string>('');
  const [formSatuan, setFormSatuan] = useState(data.units[0] || 'Pcs');
  const [formHargaBeli, setFormHargaBeli] = useState<number | string>('');
  const [formHargaJual, setFormHargaJual] = useState<number | string>('');
  const [formDeskripsi, setFormDeskripsi] = useState('');
  const [formSupplier, setFormSupplier] = useState('');

  // Filter Items
  const filteredItems = data.items.filter(item => {
    const matchSearch = 
      item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.supplierUtama && item.supplierUtama.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchCategory = selectedCategory === 'Semua' || item.kategori === selectedCategory;
    
    const status = getItemStockStatus(item);
    const matchStatus = selectedStatus === 'semua' || status === selectedStatus;

    return matchSearch && matchCategory && matchStatus;
  });

  const openAddItemModal = () => {
    setEditingItem(null);
    const initialCat = data.categories[0] || 'Elektronik & Perangkat';
    setFormSku(generateSKU(initialCat, 'BARANG'));
    setFormNama('');
    setFormKategori(initialCat);
    setFormLokasi(data.locations[0] || 'Gudang Utama');
    setFormStok('');
    setFormMinStok('');
    setFormSatuan(data.units[0] || 'Pcs');
    setFormHargaBeli('');
    setFormHargaJual('');
    setFormDeskripsi('');
    setFormSupplier('');
    setItemModalOpen(true);
  };

  const openEditItemModal = (item: Item) => {
    setEditingItem(item);
    setFormSku(item.sku);
    setFormNama(item.nama);
    setFormKategori(item.kategori);
    setFormLokasi(item.lokasiRak || 'Gudang Utama');
    setFormStok(item.stok);
    setFormMinStok(item.minStok);
    setFormSatuan(item.satuan);
    setFormHargaBeli(item.hargaBeli);
    setFormHargaJual(item.hargaJual || 0);
    setFormDeskripsi(item.deskripsi || '');
    setFormSupplier(item.supplierUtama || '');
    setItemModalOpen(true);
  };

  const handleAutoSKU = () => {
    setFormSku(generateSKU(formKategori, formNama || 'ITEM'));
  };

  const handleSaveItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim() || !formSku.trim()) {
      alert('Mohon isi SKU dan Nama Barang!');
      return;
    }

    const now = new Date().toISOString();
    const itemToSave: Item = {
      id: editingItem ? editingItem.id : `item-${Date.now()}`,
      sku: formSku.trim().toUpperCase(),
      nama: formNama.trim(),
      kategori: formKategori,
      lokasiRak: formLokasi,
      stok: formStok === '' ? 0 : Math.max(0, Number(formStok)),
      minStok: formMinStok === '' ? 5 : Math.max(0, Number(formMinStok)),
      satuan: formSatuan,
      hargaBeli: formHargaBeli === '' ? 0 : Math.max(0, Number(formHargaBeli)),
      hargaJual: formHargaJual === '' ? 0 : Math.max(0, Number(formHargaJual)),
      deskripsi: formDeskripsi.trim(),
      supplierUtama: formSupplier.trim(),
      createdAt: editingItem ? editingItem.createdAt : now,
      updatedAt: now
    };

    onSaveItem(itemToSave, !editingItem);
    setItemModalOpen(false);
  };

  const openAdjustmentModal = (item: Item) => {
    setAdjustingItem(item);
    setActualStockInput(item.stok);
    setAdjustmentReason('Hasil Stock Opname Bulanan');
    setAdjustmentNotes('');
    setAdjustmentModalOpen(true);
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem) return;

    const diff = actualStockInput - adjustingItem.stok;
    if (diff === 0) {
      alert('Stok fisik sama dengan stok sistem, tidak ada perubahan yang dicatat.');
      setAdjustmentModalOpen(false);
      return;
    }

    const updatedItem: Item = {
      ...adjustingItem,
      stok: actualStockInput,
      updatedAt: new Date().toISOString()
    };

    const newTrx: Transaction = {
      id: `trx-${Date.now()}`,
      kodeTransaksi: generateTransactionCode('penyesuaian'),
      tanggal: new Date().toISOString().slice(0, 16).replace('T', ' '),
      tipe: 'penyesuaian',
      itemId: adjustingItem.id,
      itemNama: adjustingItem.nama,
      itemSku: adjustingItem.sku,
      jumlah: Math.abs(diff),
      stokSebelum: adjustingItem.stok,
      stokSesudah: actualStockInput,
      alasanAlur: `${adjustmentReason} (${diff > 0 ? 'Koreksi Lebih +' : 'Koreksi Kurang -'}${Math.abs(diff)} ${adjustingItem.satuan})`,
      petugas: data.companySettings.adminGudang || 'Admin Gudang',
      catatan: adjustmentNotes || `Penyesuaian stok manual dari ${adjustingItem.stok} menjadi ${actualStockInput}`,
      biayaSatuan: adjustingItem.hargaBeli,
      totalNilai: Math.abs(diff) * adjustingItem.hargaBeli,
      createdAt: new Date().toISOString()
    };

    onRecordAdjustment(newTrx, updatedItem);
    setAdjustmentModalOpen(false);
  };

  const handlePrintStockReport = () => {
    const doc = generateStockReportPDF(filteredItems, data.companySettings);
    doc.save(`laporan_stok_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Main Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Katalog &amp; Data Stok Barang
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {currentRole === 'public'
              ? 'Tampilan publik (read-only): Telusuri katalog stok barang, nomor SKU, dan posisi rak.'
              : 'Kelola master data barang, ambang batas minimum, posisi rak, dan penyesuaian stok opname.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canUserAddItem(currentRole, data.companySettings) && (
            <button
              type="button"
              onClick={openAddItemModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              + Tambah Barang Baru
            </button>
          )}

          {currentRole === 'admin' && data.items.length > 0 && (
            <button
              type="button"
              onClick={() => setAdminPurgeModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
              title="Pembersihan Data Sampel (Khusus Admin)"
            >
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span>Bersihkan Sampel (Admin)</span>
            </button>
          )}

          {currentRole !== 'public' && (
            <>
              <button
                type="button"
                onClick={() => exportInventoryToCSV(filteredItems)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer"
                title="Ekspor CSV / Excel"
              >
                <Download className="w-4 h-4" />
                Ekspor CSV
              </button>

              <button
                type="button"
                onClick={handlePrintStockReport}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-xs transition-colors cursor-pointer"
                title="Cetak Laporan Stok PDF"
              >
                <FileText className="w-4 h-4" />
                Cetak PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari SKU, nama, supplier..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="Semua">Semua Kategori ({data.items.length})</option>
              {data.categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Stock Status Pills Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
            >
              <option value="semua">Semua Status Stok</option>
              <option value="aman">🟢 Stok Aman</option>
              <option value="menipis">🟡 Stok Menipis (≤ Min)</option>
              <option value="habis">🔴 Stok Habis (0 Unit)</option>
            </select>
          </div>

        </div>

        {/* Quick Result Counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Menampilkan <strong className="text-slate-800">{filteredItems.length}</strong> dari {data.items.length} item</span>
          {(searchQuery || selectedCategory !== 'Semua' || selectedStatus !== 'semua') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Semua');
                setSelectedStatus('semua');
              }}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="py-3.5 px-4">SKU / Kode</th>
                <th className="py-3.5 px-4">Nama Barang &amp; Kategori</th>
                <th className="py-3.5 px-4 text-right">Stok Fisik</th>
                <th className="py-3.5 px-4 text-right">Min. Batas</th>
                <th className="py-3.5 px-4 text-right">Harga Beli</th>
                <th className="py-3.5 px-4 text-right">Valuasi Stok</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-medium text-slate-500">
                      {data.items.length === 0 
                        ? 'Belum ada data barang di inventaris gudang.' 
                        : 'Tidak ada barang yang cocok dengan filter pencarian.'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {data.items.length === 0 
                        ? 'Klik tombol "+ Tambah Barang Baru" di atas untuk mulai menambahkan data perusahaan Anda.' 
                        : 'Coba ubah kata kunci atau reset filter.'}
                    </p>
                    {data.items.length === 0 && (
                      <button
                        type="button"
                        onClick={openAddItemModal}
                        className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
                        + Tambah Barang Pertama
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const status = getItemStockStatus(item);
                  const totalValuasi = item.stok * item.hargaBeli;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* SKU */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {item.sku}
                      </td>

                      {/* Nama & Kategori */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{item.nama}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span>{item.kategori}</span>
                          {item.supplierUtama && (
                            <span className="truncate max-w-[150px]">• {item.supplierUtama}</span>
                          )}
                        </div>
                      </td>

                      {/* Stok Fisik */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className={`font-mono text-sm font-black ${
                          status === 'habis' ? 'text-red-600' :
                          status === 'menipis' ? 'text-amber-600' :
                          'text-slate-900'
                        }`}>
                          {item.stok}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-1">{item.satuan}</span>
                      </td>

                      {/* Min Batas */}
                      <td className="py-3 px-4 text-right whitespace-nowrap text-slate-500 font-mono">
                        {item.minStok} {item.satuan}
                      </td>

                      {/* Harga Beli */}
                      <td className="py-3 px-4 text-right whitespace-nowrap text-slate-700 font-mono">
                        {formatRupiah(item.hargaBeli)}
                      </td>

                      {/* Valuasi Stok */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-semibold text-slate-900">
                        {formatRupiah(totalValuasi)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          status === 'habis' ? 'bg-red-100 text-red-700 border border-red-200' :
                          status === 'menipis' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                          'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}>
                          {status === 'habis' ? '🔴 HABIS' : status === 'menipis' ? '🟡 MENIPIS' : '🟢 AMAN'}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          
                          {/* Stock In Button (Staff, Supervisor, Admin) */}
                          {currentRole !== 'public' && (
                            <button
                              type="button"
                              onClick={() => onOpenStockIn(item)}
                              className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                              title="Catat Barang Masuk (+)"
                            >
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Stock Out Button (Staff, Supervisor, Admin) */}
                          {currentRole !== 'public' && (
                            <button
                              type="button"
                              onClick={() => onOpenStockOut(item)}
                              className="p-1.5 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                              title="Catat Barang Keluar (-)"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Quick Opname Adjustment (Supervisor, Admin, or authorized Staff) */}
                          {canUserAdjustStock(currentRole, data.companySettings) && (
                            <button
                              type="button"
                              onClick={() => openAdjustmentModal(item)}
                              className="p-1.5 rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                              title="Penyesuaian Stok (Opname)"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Barcode Tag (Available to all roles including Public) */}
                          <button
                            type="button"
                            onClick={() => {
                              setBarcodeItem(item);
                              setBarcodeModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                            title="Lihat Label / Barcode"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Item (Supervisor & Admin only) */}
                          {(currentRole === 'admin' || currentRole === 'supervisor') && (
                            <button
                              type="button"
                              onClick={() => openEditItemModal(item)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Edit Data Barang"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete Item (Admin Protected) */}
                          {currentRole === 'admin' && (
                            <button
                              type="button"
                              onClick={() => {
                                setItemToDelete(item);
                                setSingleDeletePinInput('');
                                setSingleDeleteError('');
                                setSingleDeleteModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Hapus Barang (Otorisasi Admin)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ----------------- MODAL: TAMBAH / EDIT BARANG ----------------- */}
      {itemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingItem ? 'Edit Master Data Barang' : 'Tambah Barang Baru ke Inventaris'}
                </h3>
                <p className="text-xs text-slate-500">
                  Lengkapi data detail barang, lokasi rak, dan ambang batas minimum stok.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setItemModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItemSubmit} className="p-5 space-y-4">
              
              {/* SKU & Auto Generate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode SKU / Barcode <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value.toUpperCase())}
                      placeholder="CONTOH: ELK-SSD-001"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono font-bold uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAutoSKU}
                      className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-semibold text-slate-700 shrink-0"
                      title="Generate Otomatis SKU"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori Barang <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {data.categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nama Barang */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Barang Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Misal: Monitor LED 24 Inch Full HD IPS"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Satuan Ukuran */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Satuan Ukuran Barang <span className="text-red-500">*</span>
                </label>
                <select
                  value={formSatuan}
                  onChange={(e) => setFormSatuan(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold"
                >
                  {data.units.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              {/* Stok Awal & Ambang Batas Minimum */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Stok Fisik Saat Ini
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formStok}
                    onChange={(e) => setFormStok(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                    placeholder="0 (Jumlah stok awal)"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400 placeholder:font-normal"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Jumlah unit yang tersedia di rak saat ini (bisa dikosongkan jika 0).</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-800 mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Ambang Batas Stok Minimum (Min Alert)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formMinStok}
                    onChange={(e) => setFormMinStok(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                    placeholder="5 (Standar minimum)"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 bg-amber-50/50 font-mono font-bold text-amber-900 focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder:text-amber-500/60 placeholder:font-normal"
                  />
                  <p className="text-[10px] text-amber-700 mt-1">Sistem otomatis memberi peringatan bila stok ≤ angka ini (default: 5).</p>
                </div>
              </div>

              {/* Harga Beli & Harga Jual */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Harga Beli / Pokok Satuan (IDR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formHargaBeli}
                    onChange={(e) => setFormHargaBeli(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                    placeholder="0 (Ketik harga beli...)"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                    {formHargaBeli !== '' && Number(formHargaBeli) > 0 ? formatRupiah(Number(formHargaBeli)) : 'Rp 0 (Opsional jika belum ada)'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Harga Jual / Valuasi Satuan (IDR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formHargaJual}
                    onChange={(e) => setFormHargaJual(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                    placeholder="0 (Ketik harga jual/valuasi...)"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                    {formHargaJual !== '' && Number(formHargaJual) > 0 ? formatRupiah(Number(formHargaJual)) : 'Rp 0 (Opsional)'}
                  </p>
                </div>
              </div>

              {/* Supplier Utama & Deskripsi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supplier / Vendor Utama
                  </label>
                  <input
                    type="text"
                    value={formSupplier}
                    onChange={(e) => setFormSupplier(e.target.value)}
                    placeholder="Contoh: PT. Sumber Sukses Logistik"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catatan / Spesifikasi Singkat
                  </label>
                  <input
                    type="text"
                    value={formDeskripsi}
                    onChange={(e) => setFormDeskripsi(e.target.value)}
                    placeholder="Catatan tambahan spesifikasi"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Footer Modal Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setItemModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {editingItem ? 'Simpan Perubahan' : 'Simpan Barang Baru'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: PENYESUAIAN STOK (OPNAME) ----------------- */}
      {adjustmentModalOpen && adjustingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Penyesuaian Stok (Stock Opname)
                </h3>
                <p className="text-xs text-slate-500">
                  Sesuaikan jumlah stok fisik aktual hasil audit gudang.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAdjustmentModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="font-bold text-xs text-slate-800">{adjustingItem.nama}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                SKU: <span className="font-mono font-semibold">{adjustingItem.sku}</span> • Lokasi: {adjustingItem.lokasiRak}
              </div>
              <div className="text-xs font-semibold text-slate-700 mt-2">
                Stok Tercatat di Sistem: <span className="font-mono font-bold text-blue-600">{adjustingItem.stok} {adjustingItem.satuan}</span>
              </div>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Stok Fisik Aktual Sebenarnya ({adjustingItem.satuan}) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={actualStockInput}
                  onChange={(e) => setActualStockInput(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                
                {/* Difference indicator */}
                <div className="mt-2 text-xs font-semibold">
                  {actualStockInput - adjustingItem.stok > 0 ? (
                    <span className="text-emerald-600">
                      Selisih Lebih: +{actualStockInput - adjustingItem.stok} {adjustingItem.satuan} (Stok akan ditambah)
                    </span>
                  ) : actualStockInput - adjustingItem.stok < 0 ? (
                    <span className="text-red-600">
                      Selisih Kurang: {actualStockInput - adjustingItem.stok} {adjustingItem.satuan} (Stok akan dikurangi)
                    </span>
                  ) : (
                    <span className="text-slate-400">Tidak ada selisih stok.</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alasan Penyesuaian
                </label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Hasil Stock Opname Bulanan">Hasil Stock Opname Bulanan</option>
                  <option value="Koreksi Salah Input Data">Koreksi Salah Input Data</option>
                  <option value="Barang Hilang / Selisih Fisik">Barang Hilang / Selisih Fisik</option>
                  <option value="Barang Rusak / Kadaluwarsa / Afkir">Barang Rusak / Kadaluwarsa / Afkir</option>
                  <option value="Penyesuaian Audit Manajemen">Penyesuaian Audit Manajemen</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Tambahan
                </label>
                <input
                  type="text"
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                  placeholder="Misal: Ditemukan 2 unit tertukar di rak C2"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustmentModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs"
                >
                  Simpan Penyesuaian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: BARCODE / LABEL RAK GUDANG ----------------- */}
      {barcodeModalOpen && barcodeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 p-5 space-y-4 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-800">Label Rak &amp; Barcode Gudang</span>
              <button
                type="button"
                onClick={() => setBarcodeModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl space-y-3">
              <div className="text-sm font-black text-slate-900">{barcodeItem.nama}</div>
              
              {/* Simulated visual barcode stripes */}
              <div className="py-3 px-4 bg-white border border-slate-200 rounded-lg flex flex-col items-center justify-center">
                <div className="flex items-center gap-[2px] h-12">
                  <div className="w-1 h-full bg-slate-900" />
                  <div className="w-2 h-full bg-slate-900" />
                  <div className="w-0.5 h-full bg-slate-900" />
                  <div className="w-1.5 h-full bg-slate-900" />
                  <div className="w-3 h-full bg-slate-900" />
                  <div className="w-1 h-full bg-slate-900" />
                  <div className="w-0.5 h-full bg-slate-900" />
                  <div className="w-2 h-full bg-slate-900" />
                  <div className="w-1 h-full bg-slate-900" />
                  <div className="w-2.5 h-full bg-slate-900" />
                  <div className="w-0.5 h-full bg-slate-900" />
                  <div className="w-1.5 h-full bg-slate-900" />
                  <div className="w-1 h-full bg-slate-900" />
                  <div className="w-2 h-full bg-slate-900" />
                </div>
                <span className="font-mono text-xs font-black tracking-widest text-slate-900 mt-1.5">
                  *{barcodeItem.sku}*
                </span>
              </div>

              <div className="text-left text-[11px] text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Kategori:</span>
                  <strong className="text-slate-900">{barcodeItem.kategori}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Satuan:</span>
                  <strong className="text-slate-900">{barcodeItem.satuan}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Ambang Min:</span>
                  <strong className="text-amber-700">{barcodeItem.minStok} {barcodeItem.satuan}</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                Cetak Label
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: HAPUS BARANG SATUAN (OTORISASI ADMIN PIN) ----------------- */}
      {singleDeleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-rose-700 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="text-sm font-bold">Otorisasi Hapus Barang</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSingleDeleteModalOpen(false);
                  setItemToDelete(null);
                  setSingleDeletePinInput('');
                  setSingleDeleteError('');
                }}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const expectedPin = data.companySettings.adminPin || '1234';
                if (singleDeletePinInput.trim() !== expectedPin) {
                  setSingleDeleteError('PIN Administrator salah. Silakan coba lagi.');
                  return;
                }
                if (itemToDelete) {
                  onDeleteItem(itemToDelete.id);
                  setAdminFeedbackToast(`Barang "${itemToDelete.nama}" (${itemToDelete.sku}) berhasil dihapus.`);
                  setTimeout(() => setAdminFeedbackToast(null), 4000);
                }
                setSingleDeleteModalOpen(false);
                setItemToDelete(null);
                setSingleDeletePinInput('');
                setSingleDeleteError('');
              }}
              className="p-5 space-y-4"
            >
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Barang yang akan dihapus:</p>
                <p className="text-sm font-bold text-slate-900">{itemToDelete.nama}</p>
                <p className="text-[11px] font-mono text-slate-600">SKU: {itemToDelete.sku} • Stok: {itemToDelete.stok} {itemToDelete.satuan}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                  Masukkan PIN Administrator <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={singleDeletePinInput}
                  onChange={(e) => setSingleDeletePinInput(e.target.value)}
                  placeholder="Masukkan PIN Administrator"
                  maxLength={12}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 font-mono tracking-widest text-center font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Penghapusan data master barang dibatasi khusus Administrator.
                </span>
              </div>

              {singleDeleteError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{singleDeleteError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setSingleDeleteModalOpen(false);
                    setItemToDelete(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-red-600 text-white hover:bg-red-700 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Konfirmasi Hapus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- ADMIN PURGE MODAL ----------------- */}
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
        initialMode="total-clean"
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
