import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Item, Transaction, CompanySettings } from '../types';
import { formatRupiah, formatDateIndo, getItemStockStatus } from './storage';

// Helper to add clean official corporate header
function addCorporateHeader(doc: jsPDF, settings: CompanySettings, title: string, subtitle?: string) {
  const pageWidth = doc.internal.pageSize.width;
  
  // Top brand bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Company Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(settings.namaPerusahaan.toUpperCase(), 14, 15);

  // Warehouse Name & Address
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`${settings.namaGudang} | Telp: ${settings.telepon}`, 14, 20);
  doc.text(`${settings.alamat} | Email: ${settings.email}`, 14, 24.5);

  // Separator line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(14, 28, pageWidth - 14, 28);

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text(title.toUpperCase(), 14, 35);

  // Subtitle / Date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  const printDate = `Tanggal Cetak: ${formatDateIndo(new Date().toISOString())} | Pukul: ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
  doc.text(subtitle ? `${subtitle} | ${printDate}` : printDate, 14, 40);

  return 45; // Return Y start position for content
}

// Helper to add official signatures
function addSignatureBlocks(doc: jsPDF, settings: CompanySettings, startY: number) {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Check if we need a new page for signatures
  let y = startY + 10;
  if (y + 40 > pageHeight) {
    doc.addPage();
    y = 20;
  }

  const colWidth = (pageWidth - 28) / 3;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  // Signature Column 1: Dibuat Oleh (Admin)
  doc.text('Dibuat Oleh (Admin Gudang):', 14, y);
  doc.text('( ......................................... )', 14, y + 25);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.adminGudang || 'Admin Gudang', 14, y + 30);

  // Signature Column 2: Diperiksa Oleh (Supervisor)
  doc.setFont('helvetica', 'normal');
  doc.text('Diperiksa Oleh (Supervisor):', 14 + colWidth, y);
  doc.text('( ......................................... )', 14 + colWidth, y + 25);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.supervisor || 'Supervisor Logistik', 14 + colWidth, y + 30);

  // Signature Column 3: Disetujui Oleh (Kepala Gudang)
  doc.setFont('helvetica', 'normal');
  doc.text('Disetujui Oleh (Kepala Gudang):', 14 + colWidth * 2, y);
  doc.text('( ......................................... )', 14 + colWidth * 2, y + 25);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.kepalaGudang || 'Kepala Bagian Gudang', 14 + colWidth * 2, y + 30);

  // Bottom Notice
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(settings.catatanLaporanFooter || 'Dokumen resmi yang dicetak secara otomatis dari Sistem Inventaris Gudang.', 14, pageHeight - 8);
}

// 1. LAPORAN STOK LENGKAP & VALUASI INVENTARIS
export function generateStockReportPDF(items: Item[], settings: CompanySettings): jsPDF {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const startY = addCorporateHeader(
    doc,
    settings,
    'LAPORAN POSISI STOK & VALUASI ASSET GUDANG',
    `Total: ${items.length} Item SKU Terdaftar`
  );

  const totalNilaiAset = items.reduce((acc, curr) => acc + (curr.stok * curr.hargaBeli), 0);
  const totalFisikStok = items.reduce((acc, curr) => acc + curr.stok, 0);
  const totalItemMenipis = items.filter(i => getItemStockStatus(i) === 'menipis').length;
  const totalItemHabis = items.filter(i => getItemStockStatus(i) === 'habis').length;

  // Render Table
  const tableData = items.map((item, idx) => {
    const status = getItemStockStatus(item);
    const statusLabel = status === 'habis' ? 'HABIS (0)' : status === 'menipis' ? 'MENIPIS' : 'AMAN';
    const subtotalNilai = item.stok * item.hargaBeli;

    return [
      idx + 1,
      item.sku,
      item.nama,
      item.kategori,
      `${item.stok} ${item.satuan}`,
      `${item.minStok} ${item.satuan}`,
      formatRupiah(item.hargaBeli),
      formatRupiah(subtotalNilai),
      statusLabel
    ];
  });

  autoTable(doc, {
    startY: startY,
    head: [['No', 'SKU', 'Nama Barang', 'Kategori', 'Stok', 'Min.', 'Harga Beli', 'Total Valuasi', 'Status']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      font: 'helvetica',
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { fontStyle: 'bold', cellWidth: 28 },
      2: { cellWidth: 65 },
      3: { cellWidth: 45 },
      4: { halign: 'right', fontStyle: 'bold', cellWidth: 24 },
      5: { halign: 'right', cellWidth: 20 },
      6: { halign: 'right', cellWidth: 28 },
      7: { halign: 'right', fontStyle: 'bold', cellWidth: 32 },
      8: { halign: 'center', cellWidth: 22 }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 8) {
        const text = String(data.cell.raw);
        if (text.includes('HABIS')) {
          data.cell.styles.textColor = [220, 38, 38]; // Red
          data.cell.styles.fontStyle = 'bold';
        } else if (text.includes('MENIPIS')) {
          data.cell.styles.textColor = [217, 119, 6]; // Amber
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [22, 101, 52]; // Green
        }
      }
    }
  });

  // Summary box below table
  const finalY = (doc as any).lastAutoTable.finalY || 150;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(`RINGKASAN TOTAL:`, 14, finalY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`• Total Kuantitas Unit Fisik: ${totalFisikStok.toLocaleString('id-ID')} unit/pcs`, 14, finalY + 13);
  doc.text(`• Total Nilai Aset Inventaris: ${formatRupiah(totalNilaiAset)}`, 14, finalY + 18);
  doc.text(`• Peringatan: ${totalItemMenipis} item menipis, ${totalItemHabis} item habis`, 14, finalY + 23);

  addSignatureBlocks(doc, settings, finalY + 28);

  return doc;
}

// 2. LAPORAN MUTASI BARANG MASUK & KELUAR
export function generateMutationReportPDF(
  transactions: Transaction[],
  settings: CompanySettings,
  filterDescription: string
): jsPDF {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const startY = addCorporateHeader(
    doc,
    settings,
    'LAPORAN MUTASI TRANSAKSI BARANG MASUK & KELUAR',
    filterDescription
  );

  const totalMasukTrx = transactions.filter(t => t.tipe === 'masuk').reduce((acc, c) => acc + c.jumlah, 0);
  const totalKeluarTrx = transactions.filter(t => t.tipe === 'keluar').reduce((acc, c) => acc + c.jumlah, 0);

  const tableData = transactions.map((t, idx) => {
    const tipeLabel = t.tipe === 'masuk' ? 'MASUK (+)' : t.tipe === 'keluar' ? 'KELUAR (-)' : 'PENYESUAIAN';
    return [
      idx + 1,
      t.kodeTransaksi,
      t.tanggal,
      tipeLabel,
      `${t.itemNama}\n(${t.itemSku})`,
      `${t.tipe === 'masuk' ? '+' : t.tipe === 'keluar' ? '-' : ''}${t.jumlah}`,
      `${t.stokSebelum} → ${t.stokSesudah}`,
      t.alasanAlur,
      t.pihakTerkait || '-',
      t.referensiDokumen || '-',
      t.petugas
    ];
  });

  autoTable(doc, {
    startY: startY,
    head: [['No', 'Kode Trx', 'Waktu', 'Jenis', 'Barang & SKU', 'Qty', 'Perubahan Stok', 'Alur / Alasan', 'Pihak Terkait', 'No. Dokumen', 'Petugas']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      font: 'helvetica',
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { fontStyle: 'bold', cellWidth: 26 },
      2: { cellWidth: 22 },
      3: { halign: 'center', fontStyle: 'bold', cellWidth: 20 },
      4: { cellWidth: 45 },
      5: { halign: 'right', fontStyle: 'bold', cellWidth: 14 },
      6: { halign: 'center', cellWidth: 22 },
      7: { cellWidth: 35 },
      8: { cellWidth: 32 },
      9: { cellWidth: 24 },
      10: { cellWidth: 22 }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const val = String(data.cell.raw);
        if (val.includes('MASUK')) {
          data.cell.styles.textColor = [22, 101, 52]; // Green
        } else if (val.includes('KELUAR')) {
          data.cell.styles.textColor = [185, 28, 28]; // Red
        } else {
          data.cell.styles.textColor = [30, 64, 175]; // Blue
        }
      }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY || 150;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(`RINGKASAN MUTASI:`, 14, finalY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`• Total Kuantitas Barang Masuk: +${totalMasukTrx.toLocaleString('id-ID')} unit`, 14, finalY + 13);
  doc.text(`• Total Kuantitas Barang Keluar: -${totalKeluarTrx.toLocaleString('id-ID')} unit`, 14, finalY + 18);
  doc.text(`• Total Catatan Transaksi: ${transactions.length} baris`, 14, finalY + 23);

  addSignatureBlocks(doc, settings, finalY + 28);

  return doc;
}

// 3. LAPORAN REKOMENDASI PENGADAAN (STOK MENIPIS / HABIS)
export function generateLowStockReportPDF(lowItems: Item[], settings: CompanySettings): jsPDF {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const startY = addCorporateHeader(
    doc,
    settings,
    'LAPORAN PERINGATAN AMBANG BATAS & REKOMENDASI PEMBELIAN STOK',
    `Daftar ${lowItems.length} Item Membutuhkan Pengadaan Segera`
  );

  const tableData = lowItems.map((item, idx) => {
    const status = getItemStockStatus(item);
    const deficit = Math.max(0, (item.minStok * 2) - item.stok); // Rekomendasi order
    const estimasiBiaya = deficit * item.hargaBeli;

    return [
      idx + 1,
      item.sku,
      item.nama,
      `${item.stok} ${item.satuan}`,
      `${item.minStok} ${item.satuan}`,
      `${deficit} ${item.satuan}`,
      item.supplierUtama || '-',
      formatRupiah(estimasiBiaya),
      status === 'habis' ? 'HABIS (KRITIS)' : 'MENIPIS'
    ];
  });

  autoTable(doc, {
    startY: startY,
    head: [['No', 'SKU', 'Nama Barang', 'Sisa', 'Min.', 'Saran Order', 'Supplier Rekomendasi', 'Estimasi Biaya', 'Prioritas']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      font: 'helvetica'
    },
    headStyles: {
      fillColor: [185, 28, 28], // Red header
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { fontStyle: 'bold', cellWidth: 22 },
      2: { cellWidth: 40 },
      3: { halign: 'right', fontStyle: 'bold', cellWidth: 16 },
      4: { halign: 'right', cellWidth: 15 },
      5: { halign: 'right', fontStyle: 'bold', cellWidth: 18 },
      6: { cellWidth: 32 },
      7: { halign: 'right', cellWidth: 24 },
      8: { halign: 'center', fontStyle: 'bold', cellWidth: 18 }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 8) {
        const val = String(data.cell.raw);
        if (val.includes('KRITIS')) {
          data.cell.styles.textColor = [220, 38, 38];
        } else {
          data.cell.styles.textColor = [217, 119, 6];
        }
      }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY || 150;
  const totalEstimasi = lowItems.reduce((acc, curr) => {
    const deficit = Math.max(0, (curr.minStok * 2) - curr.stok);
    return acc + (deficit * curr.hargaBeli);
  }, 0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(`TOTAL ESTIMASI DANA RE-STOCK: ${formatRupiah(totalEstimasi)}`, 14, finalY + 10);

  addSignatureBlocks(doc, settings, finalY + 18);

  return doc;
}

// 4. CETAK BUKTI TRANSAKSI TUNGGAL (SURAT JALAN / BUKTI BARANG MASUK / KELUAR)
export function generateSingleTransactionReceiptPDF(
  trx: Transaction,
  item: Item | undefined,
  settings: CompanySettings
): jsPDF {
  const doc = new jsPDF('portrait', 'mm', 'a5'); // Standard A5 size for delivery note / receipt
  const pageWidth = doc.internal.pageSize.width;

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(settings.namaPerusahaan, 12, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`${settings.namaGudang} | Telp: ${settings.telepon}`, 12, 16);
  doc.text(settings.alamat, 12, 19.5);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(12, 22, pageWidth - 12, 22);

  // Voucher Title
  const docTitle = trx.tipe === 'masuk' 
    ? 'BUKTI BARANG MASUK (BBM)' 
    : trx.tipe === 'keluar' 
    ? 'SURAT JALAN / BUKTI BARANG KELUAR (BBK)' 
    : 'BUKTI PENYESUAIAN STOK (OPNAME)';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.text(docTitle, 12, 28);

  // Metadata Grid
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  // Left col
  doc.text(`No. Transaksi : ${trx.kodeTransaksi}`, 12, 34);
  doc.text(`Tanggal & Waktu : ${trx.tanggal}`, 12, 39);
  doc.text(`Alur / Tujuan   : ${trx.alasanAlur}`, 12, 44);

  // Right col
  doc.text(`No. Referensi : ${trx.referensiDokumen || '-'}`, 80, 34);
  doc.text(`Pihak Terkait : ${trx.pihakTerkait || '-'}`, 80, 39);
  doc.text(`Petugas Ops   : ${trx.petugas}`, 80, 44);

  // Item Table
  const tableData = [
    [
      '1',
      trx.itemSku,
      trx.itemNama,
      item ? item.kategori : '-',
      `${trx.jumlah} ${item ? item.satuan : 'Unit'}`,
      trx.catatan || 'Kondisi barang baik & sesuai standar.'
    ]
  ];

  autoTable(doc, {
    startY: 48,
    head: [['No', 'Kode SKU', 'Deskripsi Barang', 'Kategori', 'Jumlah', 'Keterangan']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.5
    },
    headStyles: {
      fillColor: trx.tipe === 'masuk' ? [22, 101, 52] : trx.tipe === 'keluar' ? [30, 41, 59] : [14, 116, 144],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { fontStyle: 'bold', cellWidth: 24 },
      2: { cellWidth: 36 },
      3: { cellWidth: 24 },
      4: { halign: 'right', fontStyle: 'bold', cellWidth: 16 },
      5: { cellWidth: 24 }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY || 75;

  // Signatures on A5
  const sigY = finalY + 12;
  const colW = (pageWidth - 24) / 3;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);

  doc.text(trx.tipe === 'masuk' ? 'Pengirim / Vendor:' : 'Penerima / Klien:', 12, sigY);
  doc.text('( ............................. )', 12, sigY + 16);

  doc.text('Petugas Gudang:', 12 + colW, sigY);
  doc.text('( ............................. )', 12 + colW, sigY + 16);
  doc.setFont('helvetica', 'bold');
  doc.text(trx.petugas, 12 + colW, sigY + 20);

  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui / Spv:', 12 + colW * 2, sigY);
  doc.text('( ............................. )', 12 + colW * 2, sigY + 16);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.supervisor, 12 + colW * 2, sigY + 20);

  return doc;
}
