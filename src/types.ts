export type StockStatus = 'aman' | 'menipis' | 'habis';

export type TransactionType = 'masuk' | 'keluar' | 'penyesuaian';

export interface Item {
  id: string;
  sku: string;
  nama: string;
  kategori: string;
  lokasiRak: string;
  stok: number;
  minStok: number;
  satuan: string;
  hargaBeli: number;
  hargaJual?: number;
  deskripsi?: string;
  supplierUtama?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  kodeTransaksi: string;
  tanggal: string; // ISO string or YYYY-MM-DD
  tipe: TransactionType;
  itemId: string;
  itemNama: string;
  itemSku: string;
  jumlah: number;
  stokSebelum: number;
  stokSesudah: number;
  alasanAlur: string; // e.g. 'Pembelian Supplier', 'Penjualan', 'Retur', 'Internal', 'Rusak/Afkir'
  referensiDokumen?: string; // No PO, Faktur, Surat Jalan, dll
  pihakTerkait?: string; // Supplier, Klien, Divisi, Petugas
  petugas: string;
  catatan?: string;
  biayaSatuan?: number;
  totalNilai?: number;
  createdAt: string;
}

export type UserRole = 'public' | 'staff' | 'supervisor' | 'admin';

export interface CompanySettings {
  namaPerusahaan: string;
  namaGudang: string;
  alamat: string;
  telepon: string;
  email: string;
  kepalaGudang: string;
  supervisor: string;
  adminGudang: string;
  mataUang: string;
  logoText: string;
  logoSubtitle?: string;
  logoTag?: string;
  logoUrl?: string;
  adminPin?: string;
  supervisorPin?: string;
  staffPin?: string;
  staffCanAddItem?: boolean;
  staffCanAdjustStock?: boolean;
  headerLaporanText?: string;
  catatanLaporanFooter?: string;
}

export interface WorkflowOption {
  id: string;
  nama: string;
  deskripsi?: string;
  tipe?: 'masuk' | 'keluar' | 'semua';
}

export interface InventoryData {
  items: Item[];
  transactions: Transaction[];
  categories: string[];
  locations: string[];
  units: string[];
  inboundReasons: string[];
  outboundReasons: string[];
  companySettings: CompanySettings;
}

export type ActiveTab = 
  | 'dashboard'
  | 'inventory'
  | 'stock-in'
  | 'stock-out'
  | 'transactions'
  | 'low-stock'
  | 'reports'
  | 'settings';
