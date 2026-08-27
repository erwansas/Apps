import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { InventoryData, Item, Transaction } from '../types';

// Use initialized app or create singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Provider with required Google Sheets & Drive scopes
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory token cache (Do NOT persist to localStorage according to security rules)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

/**
 * Initialize Firebase Auth state listener.
 */
export function initGoogleAuth(
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
): () => void {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
}

/**
 * Signs in user with Google Popup to obtain OAuth access token with Sheets permissions.
 */
export async function signInWithGoogleSheets(): Promise<{ user: User; accessToken: string }> {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('Gagal memperoleh Access Token Google Workspace');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sheets Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
}

/**
 * Gets currently cached access token.
 */
export function getGoogleAccessToken(): string | null {
  return cachedAccessToken;
}

/**
 * Signs out from Google and clears in-memory token.
 */
export async function signOutGoogle(): Promise<void> {
  await signOut(auth);
  cachedAccessToken = null;
}

export interface GoogleSheetsSyncResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  itemsCount: number;
  transactionsCount: number;
  lastSynced: string;
}

/**
 * Helper to call Google Sheets API
 */
async function callSheetsApi(url: string, options: RequestInit = {}): Promise<any> {
  if (!cachedAccessToken) {
    throw new Error('Sesi Google Sheets belum terhubung. Silakan login dengan akun Google Anda.');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${cachedAccessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error?.message || `HTTP Error ${response.status}: ${response.statusText}`;
    throw new Error(`Google Sheets API Error: ${message}`);
  }

  return response.json();
}

/**
 * Helper to format Item into row
 */
function itemToRow(item: Item, index: number): any[] {
  const stockVal = item.stok * item.hargaBeli;
  let status = 'AMAN';
  if (item.stok <= 0) status = 'HABIS';
  else if (item.stok <= item.minStok) status = 'MENIPIS';

  return [
    index + 1,
    item.sku,
    item.nama,
    item.kategori,
    item.lokasiRak,
    item.stok,
    item.satuan,
    item.minStok,
    item.hargaBeli,
    item.hargaJual || 0,
    stockVal,
    status,
    item.supplierUtama || '-',
    item.deskripsi || '-',
    item.updatedAt || item.createdAt
  ];
}

/**
 * Helper to format Transaction into row
 */
function transactionToRow(trx: Transaction, index: number): any[] {
  const tipeStr = trx.tipe === 'masuk' ? 'MASUK' : trx.tipe === 'keluar' ? 'KELUAR' : 'PENYESUAIAN';
  return [
    index + 1,
    trx.kodeTransaksi,
    trx.tanggal,
    tipeStr,
    trx.itemSku,
    trx.itemNama,
    trx.jumlah,
    trx.stokSebelum,
    trx.stokSesudah,
    trx.alasanAlur,
    trx.referensiDokumen || '-',
    trx.pihakTerkait || '-',
    trx.petugas,
    trx.biayaSatuan || 0,
    trx.totalNilai || 0,
    trx.catatan || '-'
  ];
}

/**
 * Synchronizes inventory data (all SKU items & transactions) into Google Sheets.
 * If targetSpreadsheetId is provided, updates existing spreadsheet; otherwise creates a new one.
 */
export async function syncInventoryToGoogleSheets(
  data: InventoryData,
  existingSpreadsheetId?: string
): Promise<GoogleSheetsSyncResult> {
  if (!cachedAccessToken) {
    throw new Error('Akses Google Sheets belum diotorisasi. Silakan hubungkan akun Google Anda.');
  }

  let spreadsheetId = existingSpreadsheetId?.trim();
  let spreadsheetUrl = '';

  const sheetItemsHeader = [
    'No', 'Kode SKU', 'Nama Barang', 'Kategori', 'Lokasi Rak', 
    'Stok Saat Ini', 'Satuan', 'Min. Stok', 'Harga Beli (IDR)', 
    'Harga Jual (IDR)', 'Nilai Aset Stok (IDR)', 'Status Stok', 
    'Supplier Utama', 'Deskripsi / Spesifikasi', 'Terakhir Diperbarui'
  ];

  const sheetTrxHeader = [
    'No', 'No. Transaksi', 'Tanggal', 'Tipe Mutasi', 'Kode SKU', 
    'Nama Barang', 'Jumlah Mutasi', 'Stok Sebelum', 'Stok Sesudah', 
    'Alasan / Keperluan', 'No. Dokumen / PO / SJ', 'Pihak Terkait / Vendor / Penerima', 
    'Petugas Operator', 'Harga Satuan (IDR)', 'Total Nilai (IDR)', 'Catatan'
  ];

  const itemsRows = data.items.map((it, idx) => itemToRow(it, idx));
  const trxRows = data.transactions.map((tr, idx) => transactionToRow(tr, idx));

  // If no spreadsheet ID exists, create a brand new Google Spreadsheet with two styled sheets
  if (!spreadsheetId) {
    const createPayload = {
      properties: {
        title: `Inventaris & Mutasi Stok - ${data.companySettings.namaGudang || 'Kompas.id'}`
      },
      sheets: [
        {
          properties: {
            title: 'Master Stok Barang',
            gridProperties: { rowCount: Math.max(100, itemsRows.length + 10), columnCount: 16 }
          }
        },
        {
          properties: {
            title: 'Riwayat Transaksi & Mutasi',
            gridProperties: { rowCount: Math.max(100, trxRows.length + 10), columnCount: 18 }
          }
        }
      ]
    };

    const createRes = await callSheetsApi('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      body: JSON.stringify(createPayload)
    });

    spreadsheetId = createRes.spreadsheetId;
    spreadsheetUrl = createRes.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  } else {
    spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  }

  // 1. Clear and Populate "Master Stok Barang"
  try {
    await callSheetsApi(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Master%20Stok%20Barang!A1:Z5000:clear`,
      { method: 'POST', body: JSON.stringify({}) }
    );
  } catch {}

  const itemsValues = [sheetItemsHeader, ...itemsRows];
  await callSheetsApi(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Master%20Stok%20Barang!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      body: JSON.stringify({
        range: 'Master Stok Barang!A1',
        majorDimension: 'ROWS',
        values: itemsValues
      })
    }
  );

  // 2. Clear and Populate "Riwayat Transaksi & Mutasi"
  try {
    await callSheetsApi(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Riwayat%20Transaksi%20%26%20Mutasi!A1:Z5000:clear`,
      { method: 'POST', body: JSON.stringify({}) }
    );
  } catch {}

  const trxValues = [sheetTrxHeader, ...trxRows];
  await callSheetsApi(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Riwayat%20Transaksi%20%26%20Mutasi!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      body: JSON.stringify({
        range: 'Riwayat Transaksi & Mutasi!A1',
        majorDimension: 'ROWS',
        values: trxValues
      })
    }
  );

  const nowIso = new Date().toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  return {
    spreadsheetId,
    spreadsheetUrl,
    itemsCount: data.items.length,
    transactionsCount: data.transactions.length,
    lastSynced: nowIso
  };
}

/**
 * Appends a single new transaction and updates modified item row in real-time
 */
export async function appendTransactionToGoogleSheets(
  spreadsheetId: string,
  transaction: Transaction,
  updatedItem?: Item
): Promise<void> {
  if (!cachedAccessToken || !spreadsheetId) return;

  try {
    const row = transactionToRow(transaction, Date.now() % 100000);
    // Append to transactions sheet
    await callSheetsApi(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Riwayat%20Transaksi%20%26%20Mutasi!A:P:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        body: JSON.stringify({
          majorDimension: 'ROWS',
          values: [row]
        })
      }
    );
  } catch (err) {
    console.warn('Realtime Google Sheets append error:', err);
  }
}
