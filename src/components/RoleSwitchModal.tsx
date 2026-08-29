import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Eye, 
  EyeOff,
  UserCheck, 
  Users, 
  Lock, 
  Check, 
  X, 
  Copy, 
  AlertCircle,
  LogOut,
  KeyRound,
  ArrowRight
} from 'lucide-react';
import { UserRole, CompanySettings } from '../types';
import { ROLE_CONFIGS, getPublicShareableLink } from '../utils/rbac';

interface RoleSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  onRoleChanged: (newRole: UserRole) => void;
  companySettings: CompanySettings;
  onOpenChangePassword?: () => void;
  onLogout?: () => void;
}

export const RoleSwitchModal: React.FC<RoleSwitchModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onRoleChanged,
  companySettings,
  onOpenChangePassword,
  onLogout
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [successRole, setSuccessRole] = useState<UserRole | null>(null);

  if (!isOpen) return null;

  const publicLink = getPublicShareableLink();

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(publicLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      prompt('Salin tautan mode publik berikut:', publicLink);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessRole(null);

    const enteredPin = pinInput.trim();
    if (!enteredPin) {
      setErrorMessage('Silakan masukkan PIN keamanan Anda.');
      return;
    }

    const masterAdminPin = (companySettings.adminPin || '1234').trim();
    const supervisorPin = (companySettings.supervisorPin || '2222').trim();
    const staffPin = (companySettings.staffPin || '1111').trim();

    let authenticatedRole: UserRole | null = null;

    // Check against configured role PINs
    if (enteredPin === masterAdminPin) {
      authenticatedRole = 'admin';
    } else if (enteredPin === supervisorPin) {
      authenticatedRole = 'supervisor';
    } else if (enteredPin === staffPin) {
      authenticatedRole = 'staff';
    }

    if (!authenticatedRole) {
      setErrorMessage('PIN / Kata Sandi salah. Silakan periksa kembali atau hubungi Administrator.');
      return;
    }

    setSuccessRole(authenticatedRole);
    
    // Quick pleasant animation before closing
    setTimeout(() => {
      onRoleChanged(authenticatedRole);
      onClose();
      setPinInput('');
      setSuccessRole(null);
    }, 400);
  };

  const isLoggedIn = currentRole !== 'public';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-sm rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                {isLoggedIn ? 'Status Akun Pengguna' : 'Masuk Sistem Gudang'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isLoggedIn ? 'Kelola sesi atau ganti password' : 'Ketik PIN untuk login otomatis'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-slate-800">
          
          {isLoggedIn ? (
            /* Already Logged In View */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500">Peran Aktif Saat Ini:</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    currentRole === 'admin' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                    currentRole === 'supervisor' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                    'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}>
                    {ROLE_CONFIGS[currentRole].shortLabel}
                  </span>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    currentRole === 'admin' ? 'bg-rose-600 text-white' :
                    currentRole === 'supervisor' ? 'bg-amber-600 text-white' :
                    'bg-blue-600 text-white'
                  }`}>
                    {currentRole === 'admin' ? <ShieldCheck className="w-5 h-5" /> :
                     currentRole === 'supervisor' ? <Users className="w-5 h-5" /> :
                     <UserCheck className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {ROLE_CONFIGS[currentRole].label}
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                      {ROLE_CONFIGS[currentRole].accessLevelText}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Logged in user */}
              <div className="space-y-2 pt-1">
                {onOpenChangePassword && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenChangePassword();
                    }}
                    className="w-full py-2.5 px-4 text-xs font-bold text-slate-800 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <KeyRound className="w-4 h-4 text-amber-600" />
                    <span>Ganti Password / PIN Akun</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onLogout) {
                      onLogout();
                    } else {
                      onRoleChanged('public');
                    }
                  }}
                  className="w-full py-2.5 px-4 text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Logout / Kunci Sesi (Layar Login)</span>
                </button>
              </div>
            </div>
          ) : (
            /* Login View (Single Password / PIN Field with Auto Role Detect) */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  PIN / Kata Sandi Akun Gudang:
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    autoFocus
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="Masukkan PIN Anda..."
                    maxLength={12}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-center tracking-widest font-bold"
                  />
                </div>
                <p className="text-[11px] text-slate-500 text-center">
                  Sistem otomatis mendeteksi peran Staf, Supervisor, atau Administrator berdasarkan PIN yang Anda masukkan.
                </p>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Success Notification */}
              {successRole && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Berhasil masuk sebagai {ROLE_CONFIGS[successRole].label}!</span>
                </div>
              )}

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={Boolean(successRole)}
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.99] rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                <span>Masuk ke Sistem</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Public Link Share option */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer py-1 px-1.5 rounded hover:bg-slate-100 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'Tautan Tersalin!' : 'Salin Link Publik'}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-800 py-1 px-3 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
