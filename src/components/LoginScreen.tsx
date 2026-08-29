import React, { useState } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Boxes,
  KeyRound,
  Sparkles,
  Info,
  Building2,
  Users,
  ShieldAlert
} from 'lucide-react';
import { UserRole, CompanySettings } from '../types';
import { saveActiveRole } from '../utils/rbac';

interface LoginScreenProps {
  onLoginSuccess: (role: UserRole) => void;
  companySettings: CompanySettings;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  companySettings
}) => {
  const [pinInput, setPinInput] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [successRole, setSuccessRole] = useState<UserRole | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessRole(null);

    const enteredPin = pinInput.trim();
    if (!enteredPin) {
      setErrorMessage('Silakan masukkan PIN keamanan Anda.');
      return;
    }

    setIsAuthenticating(true);

    // Retrieve active PINs from company settings
    const adminPin = (companySettings.adminPin || '1234').trim();
    const supervisorPin = (companySettings.supervisorPin || '2222').trim();
    const staffPin = (companySettings.staffPin || '1111').trim();

    let authenticatedRole: UserRole | null = null;

    if (enteredPin === adminPin) {
      authenticatedRole = 'admin';
    } else if (enteredPin === supervisorPin) {
      authenticatedRole = 'supervisor';
    } else if (enteredPin === staffPin) {
      authenticatedRole = 'staff';
    }

    if (!authenticatedRole) {
      setTimeout(() => {
        setIsAuthenticating(false);
        setErrorMessage('PIN keamanan tidak sesuai. Silakan periksa kembali atau hubungi Administrator.');
      }, 300);
      return;
    }

    setSuccessRole(authenticatedRole);

    setTimeout(() => {
      setIsAuthenticating(false);
      if (rememberMe) {
        saveActiveRole(authenticatedRole!);
      }
      onLoginSuccess(authenticatedRole!);
    }, 450);
  };

  const handleGuestAccess = () => {
    if (rememberMe) {
      saveActiveRole('public');
    }
    onLoginSuccess('public');
  };

  const handleKeypadClick = (val: string) => {
    if (pinInput.length < 10) {
      setPinInput(prev => prev + val);
    }
  };

  const handleKeypadClear = () => {
    setPinInput('');
    setErrorMessage('');
  };

  const handleKeypadBackspace = () => {
    setPinInput(prev => prev.slice(0, -1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 font-sans antialiased text-slate-100 selection:bg-blue-600 selection:text-white">
      
      {/* Background Decorative Lighting */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-10 w-[500px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      {/* Top Header / Status */}
      <header className="w-full max-w-5xl flex items-center justify-between z-10 py-2">
        <div className="flex items-center gap-3">
          {companySettings.logoUrl ? (
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/80 p-0.5 overflow-hidden flex items-center justify-center shadow-inner">
              <img 
                src={companySettings.logoUrl} 
                alt="Logo Perusahaan" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Boxes className="w-5 h-5 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight leading-tight">
              {companySettings.logoText || 'Smart Stock, Better Control'}
            </h1>
            <p className="text-[11px] text-slate-400">
              {companySettings.logoSubtitle || companySettings.namaGudang || 'Harian Kompas (Kompas.id)'}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Sistem Terlindungi PIN</span>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="w-full max-w-md my-auto py-6 z-10">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          
          {/* Card Header & Brand Icon */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-blue-600/15 border border-blue-500/30 text-blue-400 mb-1 shadow-inner">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Autentikasi Akses Gudang
            </h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Silakan masukkan PIN keamanan akun petugas Anda untuk mengakses sistem manajemen inventaris.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {/* Input PIN Field */}
            <div className="space-y-1.5">
              <label htmlFor="login-pin-input" className="block text-xs font-semibold text-slate-300">
                PIN Keamanan / Kata Sandi:
              </label>
              <div className="relative">
                <input
                  id="login-pin-input"
                  type="password"
                  inputMode="numeric"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="Masukkan 4 digit PIN..."
                  autoFocus
                  className="w-full px-4 py-3.5 pl-11 bg-slate-950/80 border border-slate-700/90 rounded-2xl text-center text-lg font-mono font-bold tracking-widest text-white placeholder:text-slate-600 placeholder:text-sm placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner"
                />
                <KeyRound className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message */}
            {successRole && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>PIN Terverifikasi! Masuk sebagai <strong>{successRole.toUpperCase()}</strong>...</span>
              </div>
            )}

            {/* Virtual Keypad (for touch & quick click) */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadClick(num.toString())}
                  className="py-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 active:bg-blue-600 text-sm font-bold font-mono text-slate-200 hover:text-white transition-all cursor-pointer border border-slate-700/50"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleKeypadClear}
                className="py-2.5 rounded-xl bg-slate-800/40 hover:bg-red-500/20 text-xs font-semibold text-slate-400 hover:text-red-300 transition-all cursor-pointer border border-slate-800"
              >
                Hapus
              </button>
              <button
                type="button"
                onClick={() => handleKeypadClick('0')}
                className="py-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 active:bg-blue-600 text-sm font-bold font-mono text-slate-200 hover:text-white transition-all cursor-pointer border border-slate-700/50"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleKeypadBackspace}
                className="py-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-700/80 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all cursor-pointer border border-slate-800"
              >
                ←
              </button>
            </div>

            {/* Remember Me Option */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs text-slate-300">Ingat sesi di perangkat ini</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isAuthenticating || !!successRole}
              className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isAuthenticating ? 'Memverifikasi...' : 'Masuk ke Sistem'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </form>

          {/* Guest / Public Mode Option */}
          <div className="pt-2 border-t border-slate-800 text-center space-y-2">
            <button
              type="button"
              onClick={handleGuestAccess}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors border border-slate-700/60 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Masuk sebagai Tamu (Mode Hanya-Lihat)</span>
            </button>
            <p className="text-[10px] text-slate-500">
              *Mode Tamu hanya dapat memantau ketersediaan stok tanpa izin transaksi/perubahan data.
            </p>
          </div>

          {/* Security Notice */}
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/90 flex items-center gap-2.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Akses dibatasi hanya untuk staf resmi. Hubungi Administrator jika Anda lupa PIN akun.
            </span>
          </div>

        </div>
      </main>

      {/* Footer info */}
      <footer className="w-full max-w-5xl text-center py-3 z-10 border-t border-slate-800/60 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>© {new Date().getFullYear()} {companySettings.namaPerusahaan || 'Harian Kompas (Kompas.id)'} • Sistem Inventaris Terpadu</span>
        <span className="text-[11px] text-slate-600">Keamanan Enkripsi Berbasis Peran (RBAC &amp; Cloud Database)</span>
      </footer>

    </div>
  );
};
