import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Lock, 
  Zap, 
  FileText,
  LogOut,
  Sparkles,
  Database
} from 'lucide-react';
import { InventoryData, CompanySettings } from '../types';
import { 
  signInWithGoogleSheets, 
  signOutGoogle, 
  initGoogleAuth, 
  getGoogleAccessToken, 
  syncInventoryToGoogleSheets, 
  GoogleSheetsSyncResult 
} from '../services/googleSheets';
import { User } from 'firebase/auth';

interface GoogleSheetsSyncCardProps {
  data: InventoryData;
  onUpdateSettings?: (settings: CompanySettings) => void;
}

export const GoogleSheetsSyncCard: React.FC<GoogleSheetsSyncCardProps> = ({ 
  data, 
  onUpdateSettings 
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getGoogleAccessToken());
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<GoogleSheetsSyncResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [customSpreadsheetId, setCustomSpreadsheetId] = useState<string>(() => {
    return localStorage.getItem('ais_google_sheets_id') || '';
  });
  const [showIdInput, setShowIdInput] = useState(false);

  useEffect(() => {
    const unsub = initGoogleAuth(
      (authUser, authToken) => {
        setUser(authUser);
        setToken(authToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsub();
  }, []);

  const handleConnectGoogle = async () => {
    setIsConnecting(true);
    setErrorMsg(null);
    try {
      const result = await signInWithGoogleSheets();
      setUser(result.user);
      setToken(result.accessToken);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal menghubungkan akun Google. Pastikan pop-up diizinkan.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await signOutGoogle();
      setUser(null);
      setToken(null);
      setSyncResult(null);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSyncNow = async () => {
    if (!token) {
      handleConnectGoogle();
      return;
    }

    setIsSyncing(true);
    setErrorMsg(null);
    try {
      const result = await syncInventoryToGoogleSheets(data, customSpreadsheetId || undefined);
      setSyncResult(result);
      if (result.spreadsheetId) {
        setCustomSpreadsheetId(result.spreadsheetId);
        localStorage.setItem('ais_google_sheets_id', result.spreadsheetId);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal menyinkronkan data ke Google Sheets.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-emerald-200/90 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Integrasi Otomatis Google Spreadsheet
              </h3>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                Live Cloud Sync
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Sinkronkan katalog master produk, stok aktual, nilai aset, serta riwayat mutasi transaksi langsung ke akun Google Spreadsheet Anda.
            </p>
          </div>
        </div>

        {/* Connection status badge */}
        {user ? (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{user.email || 'Terhubung'}</span>
            </div>
            <button
              type="button"
              onClick={handleDisconnect}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors"
              title="Putuskan Hubungan Google"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium self-start sm:self-auto">
            Belum Terhubung
          </div>
        )}
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Terjadi Kendala Koneksi:</p>
            <p className="text-[11px] text-red-700">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Main Action area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Left card: Sync features */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-emerald-600" />
            Data yang Otomatis Dibuat di Google Spreadsheet:
          </span>
          <ul className="text-xs text-slate-600 space-y-2 pl-1">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span><strong>Tab 1 (Master Stok Barang):</strong> SKU, Nama Barang, Kategori, Rak, Stok, Satuan, Min. Stok, Harga Beli, Harga Jual, Nilai Aset, Status.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              <span><strong>Tab 2 (Riwayat Transaksi & Mutasi):</strong> No. Transaksi, Tanggal, Tipe, SKU, Jumlah, Stok Sebelum/Sesudah, Alur, No. PO/SJ, Petugas, Catatan.</span>
            </li>
          </ul>

          <div className="pt-2">
            {!user ? (
              <button
                type="button"
                disabled={isConnecting}
                onClick={handleConnectGoogle}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Menghubungkan ke Akun Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    <span>Hubungkan Google Sheets Akun Saya</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                disabled={isSyncing}
                onClick={handleSyncNow}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sedang Memperbarui Spreadsheet...' : 'Sinkronkan Sekarang ke Google Sheets'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right card: Target spreadsheet & Sync output */}
        <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                Status Spreadsheet Terhubung
              </span>
              <button
                type="button"
                onClick={() => setShowIdInput(!showIdInput)}
                className="text-[11px] text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
              >
                {showIdInput ? 'Tutup ID' : 'Ganti ID Spreadsheet'}
              </button>
            </div>

            {showIdInput && (
              <div className="p-2.5 bg-white rounded-lg border border-emerald-300 space-y-1.5 animate-in fade-in">
                <label className="text-[10px] font-bold text-slate-700">
                  Custom Spreadsheet ID (Opsional jika ingin ke file yang sudah ada):
                </label>
                <input
                  type="text"
                  value={customSpreadsheetId}
                  onChange={(e) => {
                    setCustomSpreadsheetId(e.target.value);
                    localStorage.setItem('ais_google_sheets_id', e.target.value.trim());
                  }}
                  placeholder="Contoh: 1BxiMVs0XR... (kosongkan untuk buat baru otomatis)"
                  className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            )}

            {syncResult ? (
              <div className="p-3 bg-white rounded-xl border border-emerald-300 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Sinkronisasi Sukses!</span>
                </div>
                <div className="text-[11px] text-slate-600 space-y-0.5">
                  <p>• {syncResult.itemsCount} Master SKU terkirim</p>
                  <p>• {syncResult.transactionsCount} Riwayat transaksi terkirim</p>
                  <p className="text-slate-400 text-[10px]">Waktu: {syncResult.lastSynced}</p>
                </div>
                <a
                  href={syncResult.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Google Spreadsheet</span>
                </a>
              </div>
            ) : (
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {user ? (
                  'Akun Google siap. Klik tombol "Sinkronkan Sekarang" untuk membuat Spreadsheet resmi otomatis di Google Drive Anda.'
                ) : (
                  'Setelah login, sistem akan secara otomatis membuat spreadsheet dengan 2 lembar kerja lengkap (Master Stok & Riwayat Mutasi).'
                )}
              </p>
            )}
          </div>

          <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-emerald-200/80">
            <span>Total: {data.items.length} SKU Barang</span>
            <span>{data.transactions.length} Mutasi Tercatat</span>
          </div>
        </div>

      </div>
    </div>
  );
};
