import { InventoryData, Item, Transaction, CompanySettings } from '../types';

export const KOMPAS_ID_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><defs><linearGradient id="gold1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23fbe168"/><stop offset="100%" stop-color="%23e8ba26"/></linearGradient><linearGradient id="gold2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23e3b320"/><stop offset="100%" stop-color="%23c4910e"/></linearGradient></defs><polygon points="100,100 58.58,0 141.42,0" fill="url(%23gold1)"/><polygon points="100,100 141.42,0 200,58.58" fill="%23f5ce40"/><polygon points="100,100 200,58.58 200,141.42" fill="%23eabf2e"/><polygon points="100,100 200,141.42 141.42,200" fill="url(%23gold2)"/><polygon points="100,100 141.42,200 58.58,200" fill="%23deb022"/><polygon points="100,100 58.58,200 0,141.42" fill="%23f0c534"/><polygon points="100,100 0,141.42 0,58.58" fill="%23f6ce3e"/><polygon points="100,100 0,58.58 58.58,0" fill="%23f9d548"/><path d="M100,100 L58.58,0 M100,100 L141.42,0 M100,100 L200,58.58 M100,100 L200,141.42 M100,100 L141.42,200 M100,100 L58.58,200 M100,100 L0,141.42 M100,100 L0,58.58" stroke="rgba(255,255,255,0.25)" stroke-width="1"/><g fill="%23005596"><polygon points="66,54 100,54 97,60 83,60 61,140 75,140 72,146 48,146 51,140 64,140 85,60 70,60"/><polygon points="88,99 122,54 116,54 118,48 152,48 150,54 136,54 99,100"/><polygon points="89,95 108,119 128,140 118,140 116,146 150,146 152,140 140,140 114,109 97,90"/></g></svg>`;

export const initialCompanySettings: CompanySettings = {
  namaPerusahaan: 'Harian Kompas (Kompas.id)',
  namaGudang: 'Harian Kompas (Kompas.id)',
  alamat: 'Jl. Palmerah Selatan No. 26-28, Gelora, Tanah Abang, Jakarta Pusat 10270',
  telepon: '(021) 5347-710 / 0812-9000-8000',
  email: 'gudang@kompas.id',
  kepalaGudang: 'Budi Santoso, S.T.',
  supervisor: 'Rina Wijayanti',
  adminGudang: 'Ahmad Fauzi',
  mataUang: 'IDR',
  logoText: 'Smart Stock, Better Control',
  logoSubtitle: 'Harian Kompas (Kompas.id)',
  logoTag: '',
  logoUrl: KOMPAS_ID_LOGO_SVG,
  adminPin: '1234',
  supervisorPin: '2222',
  staffPin: '1111',
  headerLaporanText: 'SISTEM MANAJEMEN INVENTARIS & DISTRIBUSI GUDANG',
  catatanLaporanFooter: 'Dokumen resmi yang dicetak secara otomatis dari Sistem Inventaris Gudang Kompas.id.'
};

export const initialCategories: string[] = [
  'Elektronik & Perangkat',
  'Bahan Baku & Material',
  'Kemasan & Packaging',
  'Suku Cadang & Sparepart',
  'Peralatan & Perkakas',
  'Alat Tulis Kantor (ATK)',
  'Perlengkapan K3 / Safety'
];

export const initialLocations: string[] = [
  'Rak A-01 (Elektronik)',
  'Rak A-02 (Aksesoris)',
  'Rak B-01 (Bahan Baku)',
  'Rak B-02 (Kemasan)',
  'Rak C-01 (Sparepart Utama)',
  'Rak C-02 (Perkakas & Tools)',
  'Rak D-01 (ATK & Kantor)',
  'Zona Karantina / Transit',
  'Lantai 2 - Mezzanine'
];

export const initialUnits: string[] = [
  'Pcs',
  'Unit',
  'Box',
  'Kg',
  'Liter',
  'Meter',
  'Roll',
  'Pack',
  'Set',
  'Sak',
  'Lusin'
];

export const initialInboundReasons: string[] = [
  'Pembelian dari Supplier',
  'Penerimaan PO Pabrik',
  'Hasil Produksi Internal',
  'Retur dari Pelanggan',
  'Transfer dari Gudang Cabang',
  'Koreksi Lebih / Penyesuaian',
  'Sampel Vendor & Uji Coba'
];

export const initialOutboundReasons: string[] = [
  'Penjualan ke Pelanggan / Order Delivery',
  'Pemakaian Operasional / Internal Kantor',
  'Pengiriman ke Pabrik / Produksi',
  'Retur ke Supplier (Barang Rusak/Cacat)',
  'Transfer ke Gudang Cabang',
  'Barang Rusak / Kadaluwarsa / Afkir',
  'Sampel & Pameran Bisnis'
];

export const initialItems: Item[] = [];

export const initialTransactions: Transaction[] = [];

export const getInitialData = (): InventoryData => {
  return {
    items: initialItems,
    transactions: initialTransactions,
    categories: initialCategories,
    locations: initialLocations,
    units: initialUnits,
    inboundReasons: initialInboundReasons,
    outboundReasons: initialOutboundReasons,
    companySettings: initialCompanySettings
  };
};
