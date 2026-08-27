import { InventoryData, Item, Transaction, CompanySettings, StockStatus } from '../types';
import { getInitialData } from '../data/initialData';
import { saveInventoryDataToCloud } from '../services/firebase';

const PRIMARY_STORAGE_KEY = 'ais_inventaris_gudang_data_v2';
const LEGACY_STORAGE_KEYS = [
  'ais_inventaris_gudang_data',
  'nlp_inventory_data',
  'inventaris_gudang_db'
];

/**
 * Non-destructive data loader:
 * Safely loads user data from localStorage, gracefully handles migration from legacy keys,
 * and ensures user edits in published apps are preserved without being overwritten.
 */
export function loadInventoryData(): InventoryData {
  try {
    let raw = localStorage.getItem(PRIMARY_STORAGE_KEY);
    
    // Check legacy storage keys if primary doesn't exist yet
    if (!raw) {
      for (const legacyKey of LEGACY_STORAGE_KEYS) {
        const legacyVal = localStorage.getItem(legacyKey);
        if (legacyVal) {
          raw = legacyVal;
          break;
        }
      }
    }

    const initial = getInitialData();

    if (!raw) {
      saveInventoryData(initial);
      return initial;
    }

    const parsed = JSON.parse(raw) as Partial<InventoryData>;
    
    // Non-destructive merge: retain all existing user items, transactions, and custom settings
    const mergedCompanySettings: CompanySettings = {
      ...initial.companySettings,
      ...(parsed.companySettings || {})
    };

    // Auto-update legacy template titles to the new Kompas.id branding if unchanged from legacy defaults
    if (!mergedCompanySettings.logoText || mergedCompanySettings.logoText === 'NLP INVENTORY' || mergedCompanySettings.logoText === 'INVENTARIS GUDANG') {
      mergedCompanySettings.logoText = initial.companySettings.logoText;
    }
    if (!mergedCompanySettings.logoSubtitle || mergedCompanySettings.logoSubtitle === 'Gudang Pusat Distribusi Jakarta' || mergedCompanySettings.logoSubtitle === 'Gudang Pusat Distribusi Jakarta - Harian Kompas (Kompas.id)' || mergedCompanySettings.logoSubtitle === 'Gudang Distribusi') {
      mergedCompanySettings.logoSubtitle = initial.companySettings.logoSubtitle;
    }
    if (!mergedCompanySettings.namaGudang || mergedCompanySettings.namaGudang === 'Gudang Pusat Distribusi Jakarta' || mergedCompanySettings.namaGudang === 'Gudang Pusat Distribusi Jakarta - Harian Kompas (Kompas.id)') {
      mergedCompanySettings.namaGudang = initial.companySettings.namaGudang;
    }
    if (!mergedCompanySettings.namaPerusahaan || mergedCompanySettings.namaPerusahaan === 'PT. NUSANTARA LOGISTIK PRIMA') {
      mergedCompanySettings.namaPerusahaan = initial.companySettings.namaPerusahaan;
    }
    if (!mergedCompanySettings.logoUrl || mergedCompanySettings.logoUrl === '' || mergedCompanySettings.logoUrl.includes('kompasBg')) {
      mergedCompanySettings.logoUrl = initial.companySettings.logoUrl;
    }
    mergedCompanySettings.logoTag = '';

    const mergedData: InventoryData = {
      items: Array.isArray(parsed.items) ? parsed.items : initial.items,
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : initial.transactions,
      categories: Array.isArray(parsed.categories) && parsed.categories.length > 0 ? parsed.categories : initial.categories,
      locations: Array.isArray(parsed.locations) && parsed.locations.length > 0 ? parsed.locations : initial.locations,
      units: Array.isArray(parsed.units) && parsed.units.length > 0 ? parsed.units : initial.units,
      inboundReasons: Array.isArray(parsed.inboundReasons) && parsed.inboundReasons.length > 0 ? parsed.inboundReasons : initial.inboundReasons,
      outboundReasons: Array.isArray(parsed.outboundReasons) && parsed.outboundReasons.length > 0 ? parsed.outboundReasons : initial.outboundReasons,
      companySettings: mergedCompanySettings
    };

    // Ensure it's saved under the primary key
    try {
      localStorage.setItem(PRIMARY_STORAGE_KEY, JSON.stringify(mergedData));
    } catch {}

    return mergedData;
  } catch (err) {
    console.error('Failed to load inventory data from localStorage, falling back safely:', err);
    return getInitialData();
  }
}

/**
 * Persists data to both localStorage AND Firebase Firestore Cloud Database.
 * This guarantees real-time synchronization across all browsers and devices.
 */
export function saveInventoryData(data: InventoryData): void {
  try {
    const jsonStr = JSON.stringify(data);
    localStorage.setItem(PRIMARY_STORAGE_KEY, jsonStr);
    
    // Dispatch custom event for immediate same-tab components update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('inventory-data-updated', { detail: data }));
    }

    // Push to Firestore Cloud asynchronously
    saveInventoryDataToCloud(data).catch((err) => {
      console.warn('Background Firestore cloud save error (local copy preserved):', err);
    });
  } catch (err) {
    console.error('Failed to save inventory data', err);
  }
}

export function getItemStockStatus(item: Item): StockStatus {
  if (item.stok <= 0) return 'habis';
  if (item.stok <= item.minStok) return 'menipis';
  return 'aman';
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDateTimeIndo(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

export function formatDateIndo(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export function generateTransactionCode(type: 'masuk' | 'keluar' | 'penyesuaian'): string {
  const prefix = type === 'masuk' ? 'BM' : type === 'keluar' ? 'BK' : 'ADJ';
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}${month}${day}-${randomSuffix}`;
}

export function generateSKU(kategori: string, nama: string): string {
  const catCode = kategori
    .replace(/[^a-zA-Z]/g, '')
    .substring(0, 3)
    .toUpperCase() || 'ITM';
  const nameCode = nama
    .replace(/[^a-zA-Z]/g, '')
    .substring(0, 3)
    .toUpperCase() || 'GEN';
  const random = Math.floor(100 + Math.random() * 900);
  return `${catCode}-${nameCode}-${random}`;
}

export function exportDataAsJSON(): void {
  const data = loadInventoryData();
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inventaris_gudang_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportInventoryToCSV(items: Item[]): void {
  const headers = ['SKU', 'Nama Barang', 'Kategori', 'Stok Saat Ini', 'Min. Stok', 'Satuan', 'Harga Beli (IDR)', 'Harga Jual (IDR)', 'Status', 'Supplier'];
  
  const rows = items.map(item => [
    `"${item.sku}"`,
    `"${item.nama.replace(/"/g, '""')}"`,
    `"${item.kategori}"`,
    item.stok,
    item.minStok,
    `"${item.satuan}"`,
    item.hargaBeli,
    item.hargaJual || 0,
    `"${getItemStockStatus(item).toUpperCase()}"`,
    `"${(item.supplierUtama || '-').replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `laporan_stok_barang_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
