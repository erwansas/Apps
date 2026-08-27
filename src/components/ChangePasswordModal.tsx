import React, { useState } from 'react';
import { 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  AlertCircle, 
  ShieldCheck, 
  UserCheck, 
  Users 
} from 'lucide-react';
import { UserRole, CompanySettings } from '../types';
import { ROLE_CONFIGS } from '../utils/rbac';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  companySettings: CompanySettings;
  onUpdateCompanySettings: (newSettings: CompanySettings) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  companySettings,
  onUpdateCompanySettings
}) => {
  const [targetRole, setTargetRole] = useState<'admin' | 'supervisor' | 'staff'>(
    currentRole === 'public' ? 'staff' : (currentRole as 'admin' | 'supervisor' | 'staff')
  );

  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showOldPin, setShowOldPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const currentAdminPin = companySettings.adminPin || '1234';
  const currentSupervisorPin = companySettings.supervisorPin || '2222';
  const currentStaffPin = companySettings.staffPin || '1111';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Validation
    if (newPin.trim().length < 4) {
      setErrorMessage('PIN baru minimal harus 4 digit/karakter.');
      return;
    }

    if (newPin !== confirmPin) {
      setErrorMessage('Konfirmasi PIN baru tidak sesuai.');
      return;
    }

    // Verify current/old PIN if not admin managing other roles
    const isMasterAdmin = currentRole === 'admin';

    if (!isMasterAdmin) {
      let expectedOldPin = '';
      if (currentRole === 'staff') expectedOldPin = currentStaffPin;
      else if (currentRole === 'supervisor') expectedOldPin = currentSupervisorPin;
      else if (currentRole === 'admin') expectedOldPin = currentAdminPin;

      if (oldPin.trim() !== expectedOldPin) {
        setErrorMessage('PIN lama yang Anda masukkan salah.');
        return;
      }
    } else {
      // If admin is changing own admin PIN, verify old admin PIN
      if (targetRole === 'admin' && oldPin.trim() !== currentAdminPin) {
        setErrorMessage('PIN Administrator lama salah.');
        return;
      }
    }

    // Update settings
    let updatedSettings: CompanySettings = { ...companySettings };

    if (targetRole === 'admin') {
      updatedSettings.adminPin = newPin.trim();
    } else if (targetRole === 'supervisor') {
      updatedSettings.supervisorPin = newPin.trim();
    } else if (targetRole === 'staff') {
      updatedSettings.staffPin = newPin.trim();
    }

    onUpdateCompanySettings(updatedSettings);
    setSuccessMessage(`PIN untuk ${ROLE_CONFIGS[targetRole].shortLabel} berhasil diperbarui!`);
    
    // Clear inputs
    setOldPin('');
    setNewPin('');
    setConfirmPin('');

    setTimeout(() => {
      onClose();
      setSuccessMessage('');
    }, 1500);
  };

  const isMasterAdmin = currentRole === 'admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Ganti Password / PIN Keamanan
              </h3>
              <p className="text-[11px] text-slate-400">
                Perbarui PIN akun untuk menjaga keamanan inventaris
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 text-slate-800">
          
          {/* Admin Role Selector Tabs (If Admin) */}
          {isMasterAdmin ? (
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700">
                Pilih Akun yang Ingin Diubah PIN-nya:
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setTargetRole('staff');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    targetRole === 'staff'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Staf</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTargetRole('supervisor');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    targetRole === 'supervisor'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Supervisor</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTargetRole('admin');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    targetRole === 'admin'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <div className={`p-2 rounded-lg shrink-0 ${
                currentRole === 'staff' ? 'bg-blue-100 text-blue-700' :
                currentRole === 'supervisor' ? 'bg-amber-100 text-amber-700' :
                'bg-rose-100 text-rose-700'
              }`}>
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Ubah PIN Akun: {ROLE_CONFIGS[currentRole].label}
                </div>
                <div className="text-[11px] text-slate-500">
                  Masukkan PIN lama Anda sebelum menentukan PIN baru.
                </div>
              </div>
            </div>
          )}

          {/* Old PIN (Required if not admin updating staff/supervisor, or if admin updating admin) */}
          {(!isMasterAdmin || targetRole === 'admin') && (
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700">
                PIN Lama Saat Ini:
              </label>
              <div className="relative">
                <input
                  type={showOldPin ? "text" : "password"}
                  required
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value)}
                  placeholder="Masukkan PIN lama..."
                  maxLength={12}
                  className="w-full pl-3 pr-10 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPin(!showOldPin)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  tabIndex={-1}
                >
                  {showOldPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* New PIN */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700">
              PIN Baru ({ROLE_CONFIGS[targetRole].shortLabel}):
            </label>
            <div className="relative">
              <input
                type={showNewPin ? "text" : "password"}
                required
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Minimal 4 karakter/angka..."
                maxLength={12}
                className="w-full pl-3 pr-10 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowNewPin(!showNewPin)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                tabIndex={-1}
              >
                {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New PIN */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700">
              Ulangi PIN Baru:
            </label>
            <input
              type={showNewPin ? "text" : "password"}
              required
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              placeholder="Ketik ulang PIN baru..."
              maxLength={12}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.99] rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Simpan PIN Baru</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
