import React, { useState, useEffect } from 'react';
import { 
  ArrowDownLeft, 
  Search, 
  Check, 
  FileText, 
  Printer, 
  Building2, 
  Calendar, 
  Hash, 
  UserCheck, 
  PackageCheck,
  TrendingUp
} from 'lucide-react';
import { InventoryData, Item, Transaction } from '../types';
import { 
  formatRupiah, 
  formatDateTimeIndo, 
  generateTransactionCode 
} from '../utils/storage';
import { generateSingleTransactionReceiptPDF } from '../utils/pdfGenerator';

interface StockInViewProps {
  data: InventoryData;
  preselectedItem?: Item | null;
  onRecordStockIn: (transaction: Transaction, updatedItem: Item) => void;
  onViewTransactionReceipt: (trx: Transaction) => void;
  onNavigateToInventory?: () => void;
}

const getNowDateTimeLocal = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const StockInView: React.FC<StockInViewProps> = ({
  data,
  preselectedItem,
  onRecordStockIn,
  onViewTransactionReceipt,
  onNavigateToInventory
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string>(
    preselectedItem ? preselectedItem.id : (data.items[0]?.id || '')
  );

  const [quantity, setQuantity] = useState<number | string>('');
  const [dateStr, setDateStr] = useState<string>(getNowDateTimeLocal());
  const [supplier, setSupplier] = useState<string>('');
  const [documentRef, setDocumentRef] = useState<string>('');
  const [reason, setReason] = useState<string>(data.inboundReasons[0] || 'Pembelian dari Supplier');
  const [unitCost, setUnitCost] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [petugas, setPetugas] = useState<string>(data.companySettings.adminGudang || 'Ahmad Fauzi');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-sync date to current whenever component opens
  useEffect(() => {
    setDateStr(getNowDateTimeLocal());
  }, []);

  // Update selected item if preselectedItem changes or items list changes
  useEffect(() => {
    if (preselectedItem) {
      setSelectedItemId(preselectedItem.id);
      setSupplier(preselectedItem.supplierUtama || '');
      setUnitCost(preselectedItem.hargaBeli || 0);
    } else if (data.items.length > 0 && !data.items.some(i => i.id === selectedItemId)) {
      setSelectedItemId(data.items[0].id);
    }
  }, [preselectedItem, data.items]);

  const currentItem = data.items.find(i => i.id === selectedItemId) || data.items[0];

  useEffect(() => {
    if (currentItem && !preselectedItem) {
      setSupplier(currentItem.supplierUtama || '');
      setUnitCost(currentItem.hargaBeli || 0);
    }
  }, [selectedItemId]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      setQuantity('');
      return;
    }
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed)) {
      setQuantity(Math.max(0, parsed));
    }
  };

  const handleQuickAddQty = (amount: number) => {
    const currentVal = typeof quantity === 'number' ? quantity : (parseInt(quantity, 10) || 0);
    setQuantity(currentVal + amount);
  };

  const recentInboundTransactions = data.transactions
    .filter(t => t.tipe === 'masuk')
    .sort((a, b) => new Date(b.createdAt || b.tanggal).getTime() - new Date(a.createdAt || a.tanggal).getTime());

  const numericQuantity = Number(quantity) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem) {
      alert('Pilih barang terlebih dahulu! Jika belum ada data barang, silakan tambahkan barang di tab Data Stok Barang.');
      return;
    }

    const qtyToRecord = Number(quantity);
    if (!qtyToRecord || qtyToRecord <= 0) {
      alert('Kuantitas masuk harus lebih dari 0!');
      return;
    }

    const now = new Date();
    const newStock = currentItem.stok + qtyToRecord;
    const formattedDate = dateStr ? dateStr.replace('T', ' ') : now.toISOString().slice(0, 16).replace('T', ' ');

    const newTrx: Transaction = {
      id: `trx-in-${Date.now()}`,
      kodeTransaksi: generateTransactionCode('masuk'),
      tanggal: formattedDate,
      tipe: 'masuk',
      itemId: currentItem.id,
      itemNama: currentItem.nama,
      itemSku: currentItem.sku,
      jumlah: qtyToRecord,
      stokSebelum: currentItem.stok,
      stokSesudah: newStock,
      alasanAlur: reason,
      referensiDokumen: documentRef.trim() || `PO/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${Math.floor(100 + Math.random() * 900)}`,
      pihakTerkait: supplier.trim() || 'Supplier Umum',
      petugas: petugas.trim() || 'Petugas Gudang',
      catatan: notes.trim() || 'Penerimaan barang masuk selesai dan diverifikasi.',
      biayaSatuan: unitCost,
      totalNilai: unitCost * qtyToRecord,
      createdAt: now.toISOString()
    };

    const updatedItem: Item = {
      ...currentItem,
      stok: newStock,
      hargaBeli: unitCost > 0 ? unitCost : currentItem.hargaBeli,
      supplierUtama: supplier.trim() || currentItem.supplierUtama,
      updatedAt: now.toISOString()
    };

    onRecordStockIn(newTrx, updatedItem);
    setSuccessMessage(`Berhasil mencatat Barang Masuk! +${qtyToRecord} ${currentItem.satuan} ${currentItem.nama}. Stok sekarang: ${newStock} ${currentItem.satuan}.`);
    
    // reset form fields
    setDocumentRef('');
    setNotes('');
    setQuantity('');
    setDateStr(getNowDateTimeLocal());
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handlePrintReceipt = (trx: Transaction) => {
    const itm = data.items.find(i => i.id === trx.itemId);
    const doc = generateSingleTransactionReceiptPDF(trx, itm, data.companySettings);
    doc.save(`bukti_masuk_${trx.kodeTransaksi}.pdf`);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Pencatatan Barang Masuk (Inbound)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Catat penerimaan stok dari supplier, hasil produksi pabrik, atau retur pelanggan.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          <span>Total Masuk: {recentInboundTransactions.reduce((a, c) => a + c.jumlah, 0)} Unit</span>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Main Form & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Form Input */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          
          <form onSubmit={handleSubmit} className="space-y-5">
            
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-emerald-600" />
              Formulir Penerimaan Barang Masuk
            </h3>

            {/* Select Item */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pilih Barang yang Diterima <span className="text-red-500">*</span>
              </label>
              <select
                id="select-stockin-item"
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-semibold focus:outline-none"
              >
                {data.items.length === 0 ? (
                  <option value="">(Belum ada data barang — tambahkan di Data Stok Barang)</option>
                ) : (
                  data.items.map(item => (
                    <option key={item.id} value={item.id}>
                      [{item.sku}] {item.nama} — Sisa Stok: {item.stok} {item.satuan} • {item.kategori}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Quantity & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jumlah / Kuantitas Masuk <span className="text-red-500">*</span>
                </label>
                
                <div className="relative">
                  <input
                    id="input-stockin-qty"
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={handleQuantityChange}
                    placeholder="0 (Ketik kuantitas...)"
                    className="w-full px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none placeholder:text-slate-400 placeholder:font-normal"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-700 pointer-events-none">
                    {currentItem ? currentItem.satuan : 'Unit'}
                  </span>
                </div>

                {/* Quick Add Helper Chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-500 font-medium mr-0.5">Tambah cepat:</span>
                  {[5, 10, 25, 50, 100].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleQuickAddQty(num)}
                      className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                    >
                      +{num}
                    </button>
                  ))}
                  {quantity !== '' && Number(quantity) > 0 && (
                    <button
                      type="button"
                      onClick={() => setQuantity('')}
                      className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Tanggal &amp; Waktu Masuk <span className="text-emerald-600 text-[10px] font-bold">(Otomatis)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setDateStr(getNowDateTimeLocal())}
                    className="text-[10px] text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
                    title="Perbarui ke waktu detik ini"
                  >
                    ⚡ Set Sekarang
                  </button>
                </div>
                <input
                  type="datetime-local"
                  required
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-medium bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-800"
                />
              </div>
            </div>

            {/* Workflow Reason & Supplier */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alur / Alasan Penerimaan
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {data.inboundReasons.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pemasok / Supplier / Asal Barang
                </label>
                <input
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="Nama PT, Vendor, atau Supplier"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Document Reference & Cost */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Referensi (No. PO / Faktur / DO)
                </label>
                <input
                  type="text"
                  value={documentRef}
                  onChange={(e) => setDocumentRef(e.target.value)}
                  placeholder="CONTOH: PO/2026/08/882"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Harga Beli Satuan (IDR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={unitCost}
                  onChange={(e) => setUnitCost(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Petugas & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Petugas Penerima (Gudang)
                </label>
                <input
                  type="text"
                  value={petugas}
                  onChange={(e) => setPetugas(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan / Keterangan Kondisi
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Segel utuh, lolos QC masuk"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Simpan &amp; Tambahkan ke Stok Gudang
              </button>
            </div>

          </form>
        </div>

        {/* Right 1 Col: Live Preview Stock Card */}
        <div className="space-y-6">
          {currentItem ? (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Pratinjau Perubahan Stok
              </h4>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div>
                  <div className="font-mono text-xs font-bold text-slate-500">{currentItem.sku}</div>
                  <div className="font-bold text-sm text-slate-900 mt-0.5">{currentItem.nama}</div>
                  <div className="text-xs text-slate-500">{currentItem.kategori}</div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200 text-center">
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Stok Awal</span>
                    <span className="font-mono font-bold text-slate-700 text-xs">{currentItem.stok}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] text-emerald-700 block">Masuk</span>
                    <span className="font-mono font-bold text-emerald-700 text-xs">+{numericQuantity}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
                    <span className="text-[10px] text-blue-700 block">Stok Akhir</span>
                    <span className="font-mono font-black text-blue-700 text-sm">
                      {currentItem.stok + numericQuantity}
                    </span>
                  </div>
                </div>

                <div className="pt-2 text-xs text-slate-600 flex justify-between">
                  <span>Total Nilai Pembelian:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatRupiah(unitCost * numericQuantity)}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                💡 <strong>Tips Gudang:</strong> Setelah menyimpan, transaksi akan langsung tercatat di Buku Mutasi dan dokumen Bukti Barang Masuk (BBM) dapat langsung dicetak.
              </div>
            </div>
          ) : (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center text-xs text-slate-400 py-8">
              Pilih atau tambahkan barang untuk melihat kalkulasi perubahan stok secara langsung.
            </div>
          )}
        </div>

      </div>

      {/* Table: Recent Inbound Transactions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Riwayat Barang Masuk Terbaru</h3>
            <p className="text-xs text-slate-500">Daftar transaksi penerimaan barang dan re-stock gudang</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {recentInboundTransactions.length} Transaksi Masuk
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                <th className="pb-3 pr-4">Kode Transaksi</th>
                <th className="pb-3 px-3">Tanggal &amp; Waktu</th>
                <th className="pb-3 px-3">Barang &amp; SKU</th>
                <th className="pb-3 px-3 text-right">Jumlah Masuk</th>
                <th className="pb-3 px-3">Pemasok / Sumber</th>
                <th className="pb-3 px-3">No. Dokumen</th>
                <th className="pb-3 pl-3 text-center">Cetak BBM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentInboundTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    Belum ada riwayat transaksi barang masuk.
                  </td>
                </tr>
              ) : (
                recentInboundTransactions.map(trx => (
                  <tr key={trx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 pr-4 font-mono font-bold text-slate-800">{trx.kodeTransaksi}</td>
                    <td className="py-3 px-3 text-slate-500">{formatDateTimeIndo(trx.tanggal)}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{trx.itemNama}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{trx.itemSku}</div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="font-mono font-black text-emerald-600">+{trx.jumlah}</span>
                      <div className="text-[10px] text-slate-400">{trx.stokSebelum} → {trx.stokSesudah}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-700">{trx.pihakTerkait || '-'}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{trx.referensiDokumen || '-'}</td>
                    <td className="py-3 pl-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onViewTransactionReceipt(trx)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Lihat Bukti BBM"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrintReceipt(trx)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                          title="Unduh PDF BBM"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
