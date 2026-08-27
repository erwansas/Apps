import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  Search, 
  Check, 
  FileText, 
  Printer, 
  AlertTriangle, 
  Send, 
  User, 
  Building2, 
  TrendingDown, 
  PackageX
} from 'lucide-react';
import { InventoryData, Item, Transaction } from '../types';
import { 
  formatRupiah, 
  formatDateTimeIndo, 
  generateTransactionCode,
  getItemStockStatus 
} from '../utils/storage';
import { generateSingleTransactionReceiptPDF } from '../utils/pdfGenerator';

interface StockOutViewProps {
  data: InventoryData;
  preselectedItem?: Item | null;
  onRecordStockOut: (transaction: Transaction, updatedItem: Item) => void;
  onViewTransactionReceipt: (trx: Transaction) => void;
  onNavigateToInventory?: () => void;
}

const getNowDateTimeLocal = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const StockOutView: React.FC<StockOutViewProps> = ({
  data,
  preselectedItem,
  onRecordStockOut,
  onViewTransactionReceipt,
  onNavigateToInventory
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string>(
    preselectedItem ? preselectedItem.id : (data.items[0]?.id || '')
  );

  const [quantity, setQuantity] = useState<number | string>('');
  const [dateStr, setDateStr] = useState<string>(getNowDateTimeLocal());
  const [recipient, setRecipient] = useState<string>('');
  const [documentRef, setDocumentRef] = useState<string>('');
  const [reason, setReason] = useState<string>(data.outboundReasons[0] || 'Penjualan ke Pelanggan / Order Delivery');
  const [notes, setNotes] = useState<string>('');
  const [petugas, setPetugas] = useState<string>(data.companySettings.adminGudang || 'Ahmad Fauzi');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-sync date to current whenever component opens
  useEffect(() => {
    setDateStr(getNowDateTimeLocal());
  }, []);

  useEffect(() => {
    if (preselectedItem) {
      setSelectedItemId(preselectedItem.id);
    } else if (data.items.length > 0 && !data.items.some(i => i.id === selectedItemId)) {
      setSelectedItemId(data.items[0].id);
    }
  }, [preselectedItem, data.items]);

  const currentItem = data.items.find(i => i.id === selectedItemId) || data.items[0];

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

  const handleSetMaxStock = () => {
    if (currentItem && currentItem.stok > 0) {
      setQuantity(currentItem.stok);
    }
  };

  const recentOutboundTransactions = data.transactions
    .filter(t => t.tipe === 'keluar')
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
      alert('Kuantitas keluar harus lebih dari 0!');
      return;
    }

    if (qtyToRecord > currentItem.stok) {
      const confirmExceed = confirm(
        `PERINGATAN: Kuantitas keluar (${qtyToRecord} ${currentItem.satuan}) melebihi stok yang tersedia (${currentItem.stok} ${currentItem.satuan}).\n\nTetap lanjutkan pencatatan pengeluaran minus?`
      );
      if (!confirmExceed) return;
    }

    const now = new Date();
    const newStock = Math.max(0, currentItem.stok - qtyToRecord);
    const formattedDate = dateStr ? dateStr.replace('T', ' ') : now.toISOString().slice(0, 16).replace('T', ' ');

    const newTrx: Transaction = {
      id: `trx-out-${Date.now()}`,
      kodeTransaksi: generateTransactionCode('keluar'),
      tanggal: formattedDate,
      tipe: 'keluar',
      itemId: currentItem.id,
      itemNama: currentItem.nama,
      itemSku: currentItem.sku,
      jumlah: qtyToRecord,
      stokSebelum: currentItem.stok,
      stokSesudah: newStock,
      alasanAlur: reason,
      referensiDokumen: documentRef.trim() || `SJ/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${Math.floor(100 + Math.random() * 900)}`,
      pihakTerkait: recipient.trim() || 'Internal / Divisi Operasional',
      petugas: petugas.trim() || 'Petugas Gudang',
      catatan: notes.trim() || 'Pengeluaran barang selesai diverifikasi.',
      biayaSatuan: currentItem.hargaJual || currentItem.hargaBeli,
      totalNilai: (currentItem.hargaJual || currentItem.hargaBeli) * qtyToRecord,
      createdAt: now.toISOString()
    };

    const updatedItem: Item = {
      ...currentItem,
      stok: newStock,
      updatedAt: now.toISOString()
    };

    onRecordStockOut(newTrx, updatedItem);
    setSuccessMessage(`Berhasil mencatat Barang Keluar! -${qtyToRecord} ${currentItem.satuan} ${currentItem.nama}. Sisa stok: ${newStock} ${currentItem.satuan}.`);
    
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
    doc.save(`surat_jalan_${trx.kodeTransaksi}.pdf`);
  };

  const remainingAfter = currentItem ? currentItem.stok - numericQuantity : 0;
  const isDropBelowMin = currentItem && remainingAfter <= currentItem.minStok && remainingAfter >= 0;
  const isOutOfStockAfter = currentItem && remainingAfter <= 0;

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Pencatatan Barang Keluar (Outbound)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Catat pengeluaran stok untuk order penjualan, pemakaian operasional internal, atau pengiriman antar gudang.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
          <TrendingDown className="w-4 h-4" />
          <span>Total Keluar: {recentOutboundTransactions.reduce((a, c) => a + c.jumlah, 0)} Unit</span>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Main Form & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Form Input */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          {data.items.length === 0 && (
            <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Belum ada barang di inventaris gudang. Tambahkan barang terlebih dahulu agar dapat dicatat keluar.</span>
              </div>
              {onNavigateToInventory && (
                <button
                  type="button"
                  onClick={onNavigateToInventory}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 cursor-pointer"
                >
                  + Tambah Barang
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" />
              Formulir Pengeluaran Barang / Surat Jalan
            </h3>

            {/* Select Item */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pilih Barang yang Dikeluarkan <span className="text-red-500">*</span>
              </label>
              <select
                id="select-stockout-item"
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-semibold focus:outline-none"
              >
                {data.items.length === 0 ? (
                  <option value="">(Inventaris kosong — silakan tambahkan barang di Data Stok / Barang Masuk)</option>
                ) : (
                  data.items.map(item => (
                    <option key={item.id} value={item.id}>
                      [{item.sku}] {item.nama} — Tersedia: {item.stok} {item.satuan} • {item.kategori}
                    </option>
                  ))
                )}
              </select>
            </div>

              {/* Quantity & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Jumlah / Kuantitas Keluar <span className="text-red-500">*</span>
                    </label>
                    {currentItem && (
                      <span className="text-[11px] font-semibold text-slate-500">
                        Tersedia: <strong className="text-slate-800 font-mono">{currentItem.stok}</strong> {currentItem.satuan}
                      </span>
                    )}
                  </div>
                  
                  <div className="relative">
                    <input
                      id="input-stockout-qty"
                      type="number"
                      min="1"
                      required
                      value={quantity}
                      onChange={handleQuantityChange}
                      placeholder="0 (Ketik kuantitas...)"
                      className="w-full px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none placeholder:text-slate-400 placeholder:font-normal"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-700 pointer-events-none">
                      {currentItem ? currentItem.satuan : 'Unit'}
                    </span>
                  </div>

                  {/* Quick Helper Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-slate-500 font-medium mr-0.5">Pilih cepat:</span>
                    {[1, 5, 10, 20].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleQuickAddQty(num)}
                        className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer"
                      >
                        +{num}
                      </button>
                    ))}
                    {currentItem && currentItem.stok > 0 && (
                      <button
                        type="button"
                        onClick={handleSetMaxStock}
                        className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors cursor-pointer"
                        title="Isi dengan semua stok yang tersisa saat ini"
                      >
                        Semua ({currentItem.stok})
                      </button>
                    )}
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

                  {currentItem && numericQuantity > currentItem.stok && (
                    <p className="text-[11px] font-bold text-red-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      Kuantitas ({numericQuantity}) melebihi sisa stok ({currentItem.stok} {currentItem.satuan})!
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Tanggal &amp; Waktu Keluar <span className="text-blue-600 text-[10px] font-bold">(Otomatis)</span>
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
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-medium bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800"
                  />
                </div>
              </div>

              {/* Workflow Reason & Destination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alur / Tujuan Pengeluaran
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {data.outboundReasons.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Penerima / Tujuan / Klien / Divisi
                  </label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Nama Klien, Divisi Pabrik, atau Cabang"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Document Ref & Petugas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Dokumen (No. Surat Jalan / DO)
                  </label>
                  <input
                    type="text"
                    value={documentRef}
                    onChange={(e) => setDocumentRef(e.target.value)}
                    placeholder="Contoh: SJ/2026/08/901"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Petugas Pengirim (Gudang)
                  </label>
                  <input
                    type="text"
                    value={petugas}
                    onChange={(e) => setPetugas(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan / Keterangan Tambahan
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Pengiriman via Kurir Logistik Internal"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Simpan &amp; Kurangi Stok Gudang
                </button>
              </div>

            </form>
        </div>

        {/* Right 1 Col: Live Preview Stock Impact Card */}
        <div className="space-y-6">
          {currentItem ? (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Dampak Pengurangan Stok
              </h4>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div>
                  <div className="font-mono text-xs font-bold text-slate-500">{currentItem.sku}</div>
                  <div className="font-bold text-sm text-slate-900 mt-0.5">{currentItem.nama}</div>
                  <div className="text-xs text-slate-500">Ambang Min: {currentItem.minStok} {currentItem.satuan}</div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200 text-center">
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Stok Awal</span>
                    <span className="font-mono font-bold text-slate-700 text-xs">{currentItem.stok}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-200">
                    <span className="text-[10px] text-rose-700 block">Keluar</span>
                    <span className="font-mono font-bold text-rose-700 text-xs">-{numericQuantity}</span>
                  </div>
                  <div className={`p-2 rounded-lg border ${
                    remainingAfter <= 0 ? 'bg-red-50 border-red-300' :
                    remainingAfter <= currentItem.minStok ? 'bg-amber-50 border-amber-300' :
                    'bg-slate-50 border-slate-200'
                  }`}>
                    <span className="text-[10px] text-slate-500 block">Sisa Akhir</span>
                    <span className={`font-mono font-black text-sm ${
                      remainingAfter <= 0 ? 'text-red-700' :
                      remainingAfter <= currentItem.minStok ? 'text-amber-700' :
                      'text-slate-900'
                    }`}>
                      {remainingAfter}
                    </span>
                  </div>
                </div>

                {/* Threshold warning alerts */}
                {isOutOfStockAfter ? (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-[11px] text-red-800 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>PERINGATAN: Transaksi ini akan membuat stok habis (0 unit)!</span>
                  </div>
                ) : isDropBelowMin ? (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Sisa stok ({remainingAfter}) akan berada di bawah ambang batas minimum ({currentItem.minStok}).</span>
                  </div>
                ) : null}
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                📄 <strong>Surat Jalan Otomatis:</strong> Sistem akan membuat dokumen Bukti Barang Keluar (BBK) / Surat Jalan yang siap dicetak dan ditandatangani oleh penerima.
              </div>
            </div>
          ) : (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center text-xs text-slate-400 py-8">
              Pilih atau tambahkan barang untuk melihat kalkulasi dampak pengurangan stok.
            </div>
          )}
        </div>

      </div>

      {/* Table: Recent Outbound Transactions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Riwayat Barang Keluar Terbaru</h3>
            <p className="text-xs text-slate-500">Daftar pengeluaran stok, surat jalan, dan distribusi</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {recentOutboundTransactions.length} Transaksi Keluar
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                <th className="pb-3 pr-4">Kode Transaksi</th>
                <th className="pb-3 px-3">Tanggal &amp; Waktu</th>
                <th className="pb-3 px-3">Barang &amp; SKU</th>
                <th className="pb-3 px-3 text-right">Jumlah Keluar</th>
                <th className="pb-3 px-3">Tujuan / Penerima</th>
                <th className="pb-3 px-3">No. Surat Jalan</th>
                <th className="pb-3 pl-3 text-center">Cetak Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOutboundTransactions.map(trx => (
                <tr key={trx.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 pr-4 font-mono font-bold text-slate-800">{trx.kodeTransaksi}</td>
                  <td className="py-3 px-3 text-slate-500">{formatDateTimeIndo(trx.tanggal)}</td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-800">{trx.itemNama}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{trx.itemSku}</div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="font-mono font-black text-rose-600">-{trx.jumlah}</span>
                    <div className="text-[10px] text-slate-400">{trx.stokSebelum} → {trx.stokSesudah}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-700">{trx.pihakTerkait || '-'}</td>
                  <td className="py-3 px-3 font-mono text-slate-500">{trx.referensiDokumen || '-'}</td>
                  <td className="py-3 pl-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => onViewTransactionReceipt(trx)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Lihat Surat Jalan"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePrintReceipt(trx)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Unduh PDF Surat Jalan"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
