import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Building2, 
  Layers, 
  Package, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Save, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  RotateCcw, 
  Check,
  ShieldAlert,
  Image as ImageIcon,
  Sparkles,
  Type,
  Tag,
  Link as LinkIcon,
  Eye,
  EyeOff,
  Camera,
  Lock,
  KeyRound,
  ShieldCheck,
  Database,
  FileSpreadsheet,
  AlertTriangle,
  SlidersHorizontal
} from 'lucide-react';
import { InventoryData, CompanySettings, UserRole } from '../types';
import { exportDataAsJSON, saveInventoryData } from '../utils/storage';
import { getInitialData } from '../data/initialData';
import { AdminPurgeModal, PurgeMode } from './AdminPurgeModal';
import { ROLE_CONFIGS, getPublicShareableLink } from '../utils/rbac';
import { GoogleSheetsSyncCard } from './GoogleSheetsSyncCard';

interface SettingsViewProps {
  data: InventoryData;
  onUpdateSettings: (newSettings: CompanySettings) => void;
  onUpdateCategories: (newCategories: string[]) => void;
  onUpdateLocations?: (newLocations: string[]) => void;
  onUpdateUnits: (newUnits: string[]) => void;
  onUpdateInboundReasons: (newReasons: string[]) => void;
  onUpdateOutboundReasons: (newReasons: string[]) => void;
  onRestoreData: (restoredData: InventoryData) => void;
  currentRole?: UserRole;
  onOpenRoleModal?: () => void;
  onOpenChangePassword?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  data,
  onUpdateSettings,
  onUpdateCategories,
  onUpdateUnits,
  onUpdateInboundReasons,
  onUpdateOutboundReasons,
  onRestoreData,
  currentRole = 'admin',
  onOpenRoleModal = () => {},
  onOpenChangePassword = () => {}
}) => {
  // Company Profile Form state
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    ...data.companySettings,
    logoText: data.companySettings.logoText || 'NLP INVENTORY',
    logoSubtitle: data.companySettings.logoSubtitle || data.companySettings.namaGudang || 'Gudang Pusat Distribusi Jakarta',
    logoTag: data.companySettings.logoTag !== undefined ? data.companySettings.logoTag : 'PRO',
    logoUrl: data.companySettings.logoUrl || ''
  });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [brandingSavedSuccess, setBrandingSavedSuccess] = useState(false);
  const [logoInputUrl, setLogoInputUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Admin Purge Modal states
  const [purgeModalOpen, setPurgeModalOpen] = useState(false);
  const [purgeMode, setPurgeMode] = useState<PurgeMode>('total-clean');
  const [adminFeedbackToast, setAdminFeedbackToast] = useState<string | null>(null);

  // Admin PIN Change states
  const [changePinModalOpen, setChangePinModalOpen] = useState(false);
  const [oldPinInput, setOldPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  const [adminPinInput, setAdminPinInput] = useState(data.companySettings.adminPin || '1234');
  const [supervisorPinInput, setSupervisorPinInput] = useState(data.companySettings.supervisorPin || '2222');
  const [staffPinInput, setStaffPinInput] = useState(data.companySettings.staffPin || '1111');
  const [staffCanAddItem, setStaffCanAddItem] = useState(data.companySettings.staffCanAddItem || false);
  const [staffCanAdjustStock, setStaffCanAdjustStock] = useState(data.companySettings.staffCanAdjustStock || false);
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [showSupervisorPin, setShowSupervisorPin] = useState(false);
  const [showStaffPin, setShowStaffPin] = useState(false);
  const [rolePinSaved, setRolePinSaved] = useState(false);
  const [copiedPublicLink, setCopiedPublicLink] = useState(false);

  // Synchronize companySettings and PINs whenever data changes from Cloud
  useEffect(() => {
    if (data.companySettings) {
      setCompanySettings({
        ...data.companySettings,
        logoText: data.companySettings.logoText || 'NLP INVENTORY',
        logoSubtitle: data.companySettings.logoSubtitle || data.companySettings.namaGudang || 'Gudang Pusat Distribusi Jakarta',
        logoTag: data.companySettings.logoTag !== undefined ? data.companySettings.logoTag : 'PRO',
        logoUrl: data.companySettings.logoUrl || '',
        staffCanAddItem: data.companySettings.staffCanAddItem || false,
        staffCanAdjustStock: data.companySettings.staffCanAdjustStock || false
      });
      setAdminPinInput(data.companySettings.adminPin || '1234');
      setSupervisorPinInput(data.companySettings.supervisorPin || '2222');
      setStaffPinInput(data.companySettings.staffPin || '1111');
      setStaffCanAddItem(data.companySettings.staffCanAddItem || false);
      setStaffCanAdjustStock(data.companySettings.staffCanAdjustStock || false);
    }
  }, [data.companySettings]);

  const publicLink = getPublicShareableLink();

  const handleCopyPublicLink = () => {
    try {
      navigator.clipboard.writeText(publicLink);
      setCopiedPublicLink(true);
      setTimeout(() => setCopiedPublicLink(false), 3000);
    } catch {
      prompt('Salin link publik:', publicLink);
    }
  };

  const handleToggleStaffPermission = (key: 'staffCanAddItem' | 'staffCanAdjustStock', value: boolean) => {
    if (key === 'staffCanAddItem') setStaffCanAddItem(value);
    if (key === 'staffCanAdjustStock') setStaffCanAdjustStock(value);

    const updated: CompanySettings = {
      ...companySettings,
      [key]: value
    };
    setCompanySettings(updated);
    onUpdateSettings(updated);
    setRolePinSaved(true);
    setTimeout(() => setRolePinSaved(false), 3000);
  };

  const handleSaveRolePins = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: CompanySettings = {
      ...companySettings,
      adminPin: adminPinInput.trim() || '1234',
      supervisorPin: supervisorPinInput.trim() || '2222',
      staffPin: staffPinInput.trim() || '1111',
      staffCanAddItem,
      staffCanAdjustStock
    };
    setCompanySettings(updated);
    onUpdateSettings(updated);
    setRolePinSaved(true);
    setTimeout(() => setRolePinSaved(false), 3000);
  };

  // Lists state
  const [categories, setCategories] = useState<string[]>([...data.categories]);
  const [newCatInput, setNewCatInput] = useState('');

  const [units, setUnits] = useState<string[]>([...data.units]);
  const [newUnitInput, setNewUnitInput] = useState('');

  const [inboundReasons, setInboundReasons] = useState<string[]>([...data.inboundReasons]);
  const [newInboundInput, setNewInboundInput] = useState('');

  const [outboundReasons, setOutboundReasons] = useState<string[]>([...data.outboundReasons]);
  const [newOutboundInput, setNewOutboundInput] = useState('');

  // Handle Logo Upload File (with smart resizing for optimized Cloud Firestore & localStorage persistence)
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar yang valid (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDimension = 240;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Try webp/jpeg for minimal payload, fallback to PNG
          let optimizedDataUrl = '';
          try {
            optimizedDataUrl = canvas.toDataURL('image/webp', 0.85);
            if (!optimizedDataUrl.startsWith('data:image/webp')) {
              optimizedDataUrl = canvas.toDataURL('image/png');
            }
          } catch {
            optimizedDataUrl = canvas.toDataURL('image/png');
          }
          const updated = { ...companySettings, logoUrl: optimizedDataUrl };
          setCompanySettings(updated);
          onUpdateSettings(updated);
          setBrandingSavedSuccess(true);
          setTimeout(() => setBrandingSavedSuccess(false), 3000);
        } else {
          const updated = { ...companySettings, logoUrl: rawDataUrl };
          setCompanySettings(updated);
          onUpdateSettings(updated);
          setBrandingSavedSuccess(true);
          setTimeout(() => setBrandingSavedSuccess(false), 3000);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Handle Apply URL Logo
  const handleApplyLogoUrl = () => {
    if (!logoInputUrl.trim()) return;
    const updated = { ...companySettings, logoUrl: logoInputUrl.trim() };
    setCompanySettings(updated);
    onUpdateSettings(updated);
    setLogoInputUrl('');
    setShowUrlInput(false);
    setBrandingSavedSuccess(true);
    setTimeout(() => setBrandingSavedSuccess(false), 3000);
  };

  // Handle Remove Logo
  const handleRemoveLogo = () => {
    const updated = { ...companySettings, logoUrl: '' };
    setCompanySettings(updated);
    onUpdateSettings(updated);
    setBrandingSavedSuccess(true);
    setTimeout(() => setBrandingSavedSuccess(false), 3000);
  };

  // Save Branding Form
  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(companySettings);
    setBrandingSavedSuccess(true);
    setTimeout(() => setBrandingSavedSuccess(false), 4000);
  };

  // Handle Save Company Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(companySettings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  // Add Category
  const handleAddCategory = () => {
    if (!newCatInput.trim() || categories.includes(newCatInput.trim())) return;
    const updated = [...categories, newCatInput.trim()];
    setCategories(updated);
    onUpdateCategories(updated);
    setNewCatInput('');
  };

  const handleDeleteCategory = (cat: string) => {
    if (confirm(`Hapus kategori "${cat}"?`)) {
      const updated = categories.filter(c => c !== cat);
      setCategories(updated);
      onUpdateCategories(updated);
    }
  };

  // Add Unit
  const handleAddUnit = () => {
    if (!newUnitInput.trim() || units.includes(newUnitInput.trim())) return;
    const updated = [...units, newUnitInput.trim()];
    setUnits(updated);
    onUpdateUnits(updated);
    setNewUnitInput('');
  };

  const handleDeleteUnit = (unit: string) => {
    if (confirm(`Hapus satuan unit "${unit}"?`)) {
      const updated = units.filter(u => u !== unit);
      setUnits(updated);
      onUpdateUnits(updated);
    }
  };

  // Add Inbound Reason
  const handleAddInboundReason = () => {
    if (!newInboundInput.trim() || inboundReasons.includes(newInboundInput.trim())) return;
    const updated = [...inboundReasons, newInboundInput.trim()];
    setInboundReasons(updated);
    onUpdateInboundReasons(updated);
    setNewInboundInput('');
  };

  const handleDeleteInboundReason = (r: string) => {
    const updated = inboundReasons.filter(item => item !== r);
    setInboundReasons(updated);
    onUpdateInboundReasons(updated);
  };

  // Add Outbound Reason
  const handleAddOutboundReason = () => {
    if (!newOutboundInput.trim() || outboundReasons.includes(newOutboundInput.trim())) return;
    const updated = [...outboundReasons, newOutboundInput.trim()];
    setOutboundReasons(updated);
    onUpdateOutboundReasons(updated);
    setNewOutboundInput('');
  };

  const handleDeleteOutboundReason = (r: string) => {
    const updated = outboundReasons.filter(item => item !== r);
    setOutboundReasons(updated);
    onUpdateOutboundReasons(updated);
  };

  // JSON File Upload Restore
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as InventoryData;
        if (parsed.items && Array.isArray(parsed.items)) {
          saveInventoryData(parsed);
          onRestoreData(parsed);
          alert('Data inventaris berhasil dipulihkan dari file backup!');
        } else {
          alert('Format file JSON tidak sesuai struktur inventaris!');
        }
      } catch (err) {
        alert('Gagal membaca file JSON backup.');
      }
    };
    reader.readAsText(file);
  };

  const handleOpenPurgeModal = (mode: PurgeMode) => {
    setPurgeMode(mode);
    setPurgeModalOpen(true);
  };

  const handleDataPurged = (newData: InventoryData, message: string) => {
    onRestoreData(newData);
    setAdminFeedbackToast(message);
    setTimeout(() => setAdminFeedbackToast(null), 5000);
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');

    const currentPin = companySettings.adminPin || '1234';

    if (oldPinInput.trim() !== currentPin) {
      setPinError('PIN Lama salah! Silakan periksa kembali.');
      return;
    }

    if (newPinInput.length < 4) {
      setPinError('PIN Baru minimal terdiri dari 4 digit karakter.');
      return;
    }

    if (newPinInput !== confirmPinInput) {
      setPinError('Konfirmasi PIN Baru tidak cocok.');
      return;
    }

    const updatedSettings = {
      ...companySettings,
      adminPin: newPinInput.trim()
    };

    setCompanySettings(updatedSettings);
    onUpdateSettings(updatedSettings);
    setPinSuccess('PIN Administrator berhasil diperbarui!');
    setOldPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    setTimeout(() => {
      setChangePinModalOpen(false);
      setPinSuccess('');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-slate-900 text-white">
              <Settings className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Pengaturan &amp; Kustomisasi Sistem
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Sesuaikan logo &amp; judul aplikasi, hak akses multi-role (RBAC), tautan publik, identitas perusahaan, kategori barang, serta alur operasional gudang.
          </p>
        </div>

        {/* Cloud Sync Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold self-start sm:self-auto">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span>Cloud Database Aktif (Sinkron Real-Time Antar Perangkat)</span>
        </div>
      </div>

      {/* PROMINENT CARD: MANAJEMEN PERAN PENGGUNA (RBAC) & TAUTAN AKSES PUBLIK */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Manajemen Peran Pengguna (RBAC) &amp; Tautan Akses Publik
                </h3>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  4 Tingkat Akses
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi izin akses, hak ubah data, dan bagikan tautan mode baca saja (read-only) kepada umum.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenRoleModal}
            className="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span>Ganti Peran Pengguna</span>
          </button>
        </div>

        {/* Public Share Box */}
        <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
              <Eye className="w-4 h-4 text-emerald-700" />
              Tautan Akses Publik (Read-Only Share Link)
            </div>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
              Aman Dibagikan
            </span>
          </div>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            Siapa pun yang membuka tautan ini dapat melihat katalog stok, peringatan stok, dan ringkasan mutasi secara langsung tanpa bisa menambah, mengubah, atau menghapus data inventaris.
          </p>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              readOnly
              value={publicLink}
              className="flex-1 px-3 py-2 text-xs rounded-xl bg-white border border-emerald-300 text-slate-800 font-mono select-all focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopyPublicLink}
              className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{copiedPublicLink ? 'Tersalin!' : 'Salin Tautan'}</span>
            </button>
          </div>
        </div>

        {/* 4-Role Permission Matrix Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3.5">Peran (Role)</th>
                <th className="py-2.5 px-3 text-center">Lihat Stok &amp; Cetak PDF</th>
                <th className="py-2.5 px-3 text-center">Input Masuk/Keluar</th>
                <th className="py-2.5 px-3 text-center">Tambah/Edit Master SKU</th>
                <th className="py-2.5 px-3 text-center">Stock Opname</th>
                <th className="py-2.5 px-3 text-center">Pengaturan &amp; Reset Data</th>
                <th className="py-2.5 px-3 text-center">PIN Keamanan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr className="hover:bg-slate-50/60">
                <td className="py-3 px-3.5">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Publik / Tamu
                  </div>
                  <div className="text-[10px] text-slate-500">Masyarakat, Klien, Vendor</div>
                </td>
                <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Diizinkan</td>
                <td className="py-3 px-3 text-center text-slate-400">✕ Nonaktif</td>
                <td className="py-3 px-3 text-center text-slate-400">✕ Nonaktif</td>
                <td className="py-3 px-3 text-center text-slate-400">✕ Nonaktif</td>
                <td className="py-3 px-3 text-center text-slate-400">✕ Nonaktif</td>
                <td className="py-3 px-3 text-center text-slate-500 font-mono text-[11px]">Tanpa PIN</td>
              </tr>
              <tr className="hover:bg-slate-50/60">
                <td className="py-3 px-3.5">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Staf Gudang / Operator
                  </div>
                  <div className="text-[10px] text-slate-500">Petugas Bongkar Muat &amp; Picker</div>
                </td>
                <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Diizinkan</td>
                <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Diizinkan</td>
                <td className="py-3 px-3 text-center">
                  {companySettings.staffCanAddItem ? (
                    <span className="text-emerald-600 font-bold">✓ Diizinkan (Opsi Aktif)</span>
                  ) : (
                    <span className="text-slate-400">✕ Nonaktif (Standar SOP)</span>
                  )}
                </td>
                <td className="py-3 px-3 text-center">
                  {companySettings.staffCanAdjustStock ? (
                    <span className="text-emerald-600 font-bold">✓ Diizinkan (Opsi Aktif)</span>
                  ) : (
                    <span className="text-slate-400">✕ Nonaktif (Standar SOP)</span>
                  )}
                </td>
                <td className="py-3 px-3 text-center text-slate-400">✕ Nonaktif</td>
                <td className="py-3 px-3 text-center font-mono text-blue-700 bg-blue-50/50 font-bold text-xs tracking-widest">••••</td>
              </tr>
              <tr className="hover:bg-slate-50/60">
                <td className="py-3 px-3.5">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Supervisor / Kepala Regu
                  </div>
                  <div className="text-[10px] text-slate-500">Pengawas Lapangan &amp; Auditor</div>
                </td>
                <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Diizinkan</td>
                <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Diizinkan</td>
                <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Diizinkan</td>
                <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Diizinkan</td>
                <td className="py-3 px-3 text-center text-slate-400">✕ Nonaktif</td>
                <td className="py-3 px-3 text-center font-mono text-amber-700 bg-amber-50/50 font-bold text-xs tracking-widest">••••</td>
              </tr>
              <tr className="hover:bg-slate-50/60 bg-rose-50/30">
                <td className="py-3 px-3.5">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Administrator Sistem
                  </div>
                  <div className="text-[10px] text-slate-500">Pemilik Sistem &amp; IT Head</div>
                </td>
                <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Diizinkan</td>
                <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Diizinkan</td>
                <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Diizinkan</td>
                <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Diizinkan</td>
                <td className="py-3 px-3 text-center text-rose-600 font-bold">✓ Otoritas Penuh</td>
                <td className="py-3 px-3 text-center font-mono text-rose-700 bg-rose-50/80 font-bold text-xs tracking-widest">••••</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* PIN Configuration Form */}
        <form onSubmit={handleSaveRolePins} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
              Kelola Kata Sandi / PIN Akun Gudang
            </span>
            <div className="flex items-center gap-2">
              {rolePinSaved && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  PIN Berhasil Disimpan!
                </span>
              )}
              <button
                type="button"
                onClick={onOpenChangePassword}
                className="px-3 py-1 text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
              >
                <KeyRound className="w-3 h-3 text-amber-500" />
                <span>Modal Ganti PIN</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700">
                  PIN Staf Gudang
                </label>
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-blue-100 text-blue-700">
                  Operator
                </span>
              </div>
              <div className="relative">
                <input
                  type={showStaffPin ? 'text' : 'password'}
                  value={staffPinInput}
                  onChange={(e) => setStaffPinInput(e.target.value)}
                  maxLength={12}
                  placeholder="PIN Staf..."
                  className="w-full pl-2.5 pr-8 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white font-mono text-center tracking-widest focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowStaffPin(!showStaffPin)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                  title={showStaffPin ? 'Sembunyikan PIN' : 'Lihat PIN'}
                >
                  {showStaffPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700">
                  PIN Supervisor
                </label>
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-700">
                  Pengawas
                </span>
              </div>
              <div className="relative">
                <input
                  type={showSupervisorPin ? 'text' : 'password'}
                  value={supervisorPinInput}
                  onChange={(e) => setSupervisorPinInput(e.target.value)}
                  maxLength={12}
                  placeholder="PIN Supervisor..."
                  className="w-full pl-2.5 pr-8 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white font-mono text-center tracking-widest focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowSupervisorPin(!showSupervisorPin)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                  title={showSupervisorPin ? 'Sembunyikan PIN' : 'Lihat PIN'}
                >
                  {showSupervisorPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700">
                  PIN Administrator
                </label>
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-rose-100 text-rose-700">
                  Master
                </span>
              </div>
              <div className="relative">
                <input
                  type={showAdminPin ? 'text' : 'password'}
                  value={adminPinInput}
                  onChange={(e) => setAdminPinInput(e.target.value)}
                  maxLength={12}
                  placeholder="PIN Admin..."
                  className="w-full pl-2.5 pr-8 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white font-mono text-center tracking-widest focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPin(!showAdminPin)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                  title={showAdminPin ? 'Sembunyikan PIN' : 'Lihat PIN'}
                >
                  {showAdminPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Konfigurasi PIN</span>
            </button>
          </div>
        </form>

        {/* Staff Flexibility Controls */}
        <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-600 text-white">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Fleksibilitas Wewenang Staf Gudang (Operator Lapangan)
                </h4>
                <p className="text-[11px] text-slate-600">
                  Sesuaikan tingkat kewenangan Staf Gudang sesuai SOP dan kebutuhan operasional perusahaan Anda.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wide">
              {companySettings.staffCanAddItem || companySettings.staffCanAdjustStock ? 'Mode Fleksibel' : 'SOP Standar (Ketat)'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Toggle Tambah SKU */}
            <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-2xs flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  <span>Izin Tambah Master SKU Baru</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Staf dapat mendaftarkan barang baru langsung dari lapangan saat proses Barang Masuk.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleStaffPermission('staffCanAddItem', !staffCanAddItem)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  staffCanAddItem ? 'bg-blue-600' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={staffCanAddItem}
                title={staffCanAddItem ? 'Nonaktifkan Izin Tambah SKU' : 'Aktifkan Izin Tambah SKU'}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    staffCanAddItem ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle Stock Opname */}
            <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-2xs flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
                  <span>Izin Stock Opname (Penyesuaian)</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Staf dapat mencatat penyesuaian fisik stok secara langsung saat audit atau inspeksi rak.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleStaffPermission('staffCanAdjustStock', !staffCanAdjustStock)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  staffCanAdjustStock ? 'bg-blue-600' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={staffCanAdjustStock}
                title={staffCanAdjustStock ? 'Nonaktifkan Izin Opname' : 'Aktifkan Izin Opname'}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    staffCanAdjustStock ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* TOP PROMINENT CARD: BRANDING, JUDUL & LOGO APLIKASI */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-2xl border border-slate-700 shadow-md space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-700/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                Kustomisasi Judul &amp; Logo Header Aplikasi
              </h3>
              <p className="text-xs text-slate-300">
                Ubah judul brand, sub-judul, tag badge, dan unggah logo perusahaan Anda yang tampil di bilah atas aplikasi.
              </p>
            </div>
          </div>

          {brandingSavedSuccess && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-bold animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              Perubahan Header Tersimpan!
            </span>
          )}
        </div>

        {/* Live Preview Box */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              Pratinjau Langsung Bilah Header (Live Preview)
            </span>
            <span className="text-[10px] text-slate-400">Tampilan bilah atas aplikasi</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-700 flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-3">
              {companySettings.logoUrl ? (
                <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center p-1 overflow-hidden shadow-md">
                  <img 
                    src={companySettings.logoUrl} 
                    alt="Pratinjau Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Package className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white tracking-tight">
                    {companySettings.logoText || 'NLP INVENTORY'}
                  </span>
                  {companySettings.logoTag !== '' && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-900/80 text-blue-300 border border-blue-700/60 shadow-xs">
                      {companySettings.logoTag || 'PRO'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-normal">
                  {companySettings.logoSubtitle || companySettings.namaGudang || 'Gudang Pusat Distribusi Jakarta'}
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700">
                Pencarian SKU...
              </span>
            </div>
          </div>
        </div>

        {/* Inputs Form */}
        <form onSubmit={handleSaveBranding} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Input 1: Judul Utama */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-blue-400" />
                Judul Utama Aplikasi <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={companySettings.logoText}
                onChange={(e) => setCompanySettings({ ...companySettings, logoText: e.target.value })}
                placeholder="Contoh: NLP INVENTORY / GUDANG KITA"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
              />
            </div>

            {/* Input 2: Sub Judul */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Sub-Judul / Keterangan Fasilitas
              </label>
              <input
                type="text"
                value={companySettings.logoSubtitle || ''}
                onChange={(e) => setCompanySettings({ ...companySettings, logoSubtitle: e.target.value })}
                placeholder="Contoh: Gudang Pusat Distribusi Jakarta"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Input 3: Tag / Badge */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-400" />
                Label Tag / Badge (Opsional)
              </label>
              <input
                type="text"
                value={companySettings.logoTag || ''}
                onChange={(e) => setCompanySettings({ ...companySettings, logoTag: e.target.value })}
                placeholder="Contoh: PRO / V2 / GUDANG-1"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase font-bold"
              />
            </div>

          </div>

          {/* Logo Actions */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-700 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white">Logo Gambar Aplikasi</span>
                {companySettings.logoUrl ? (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                    Logo Kustom Terpasang
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                    Menggunakan Ikon Kotak Default
                  </span>
                )}
              </div>

              <div className="flex items-center flex-wrap gap-2">
                {/* Upload Button */}
                <label className="px-3.5 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors shadow-xs">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Unggah File Logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileUpload}
                    className="hidden"
                  />
                </label>

                {/* Input URL Button */}
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Input Link URL</span>
                </button>

                {/* Remove Logo Button */}
                {companySettings.logoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="px-3 py-1.5 text-xs font-bold bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Logo</span>
                  </button>
                )}
              </div>
            </div>

            {/* Expandable URL Input */}
            {showUrlInput && (
              <div className="pt-2 flex items-center gap-2 animate-in fade-in">
                <input
                  type="url"
                  value={logoInputUrl}
                  onChange={(e) => setLogoInputUrl(e.target.value)}
                  placeholder="https://contoh.com/logo-perusahaan.png"
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyLogoUrl}
                  className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shrink-0 cursor-pointer"
                >
                  Pasang URL
                </button>
              </div>
            )}

            <p className="text-[11px] text-slate-400">
              Format didukung: PNG, JPG, JPEG, SVG, WebP. Gambar otomatis disesuaikan agar proporsional dan langsung tersimpan secara aman.
            </p>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan Judul &amp; Logo</span>
            </button>
          </div>
        </form>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Pengaturan profil perusahaan dan alur gudang berhasil disimpan!</span>
        </div>
      )}

      {/* Grid: Company Profile Form & Operational Flow Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: Profil Perusahaan & KOP Laporan */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-blue-600" />
            Identitas Perusahaan &amp; Penandatangan Laporan
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Perusahaan (KOP Surat)
              </label>
              <input
                type="text"
                required
                value={companySettings.namaPerusahaan}
                onChange={(e) => setCompanySettings({ ...companySettings, namaPerusahaan: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Gudang / Fasilitas
              </label>
              <input
                type="text"
                required
                value={companySettings.namaGudang}
                onChange={(e) => setCompanySettings({ ...companySettings, namaGudang: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Lengkap Gudang
              </label>
              <input
                type="text"
                required
                value={companySettings.alamat}
                onChange={(e) => setCompanySettings({ ...companySettings, alamat: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  No. Telepon / Hotline
                </label>
                <input
                  type="text"
                  value={companySettings.telepon}
                  onChange={(e) => setCompanySettings({ ...companySettings, telepon: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Logistik
                </label>
                <input
                  type="email"
                  value={companySettings.email}
                  onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <span className="text-[11px] font-bold text-slate-700 block uppercase">
                Petugas Penandatangan Dokumen &amp; Laporan
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Admin Gudang</label>
                  <input
                    type="text"
                    value={companySettings.adminGudang}
                    onChange={(e) => setCompanySettings({ ...companySettings, adminGudang: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Supervisor</label>
                  <input
                    type="text"
                    value={companySettings.supervisor}
                    onChange={(e) => setCompanySettings({ ...companySettings, supervisor: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Kepala Gudang</label>
                  <input
                    type="text"
                    value={companySettings.kepalaGudang}
                    onChange={(e) => setCompanySettings({ ...companySettings, kepalaGudang: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Simpan Profil &amp; KOP Laporan
              </button>
            </div>

          </form>
        </div>

        {/* Card 2: Custom Kategori & Satuan Unit */}
        <div className="space-y-6">
          
          {/* Custom Kategori */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Kustomisasi Kategori Barang
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={newCatInput}
                onChange={(e) => setNewCatInput(e.target.value)}
                placeholder="Nama kategori baru..."
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-3 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 shrink-0 cursor-pointer"
              >
                + Tambah
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2 max-h-36 overflow-y-auto">
              {categories.map(c => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700"
                >
                  {c}
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(c)}
                    className="text-slate-400 hover:text-red-600 cursor-pointer font-bold text-sm"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Custom Satuan Unit Barang */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              Kustomisasi Satuan Unit Barang
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={newUnitInput}
                onChange={(e) => setNewUnitInput(e.target.value)}
                placeholder="Misal: Rim, Botol, Lusin..."
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddUnit}
                className="px-3 py-1.5 text-xs font-bold bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 shrink-0 cursor-pointer"
              >
                + Tambah
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2 max-h-36 overflow-y-auto">
              {units.map(u => (
                <span
                  key={u}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800"
                >
                  {u}
                  <button
                    type="button"
                    onClick={() => handleDeleteUnit(u)}
                    className="text-emerald-500 hover:text-red-600 cursor-pointer font-bold text-sm"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Row: Custom Alur Operasional Masuk & Keluar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Inbound Workflows */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
            Kustomisasi Alur / Alasan Barang Masuk
          </h3>

          <div className="flex gap-2">
            <input
              type="text"
              value={newInboundInput}
              onChange={(e) => setNewInboundInput(e.target.value)}
              placeholder="Misal: Barang Hibah / CSR..."
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={handleAddInboundReason}
              className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shrink-0 cursor-pointer"
            >
              + Tambah
            </button>
          </div>

          <div className="space-y-1.5 pt-2 max-h-48 overflow-y-auto">
            {inboundReasons.map(r => (
              <div key={r} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-700 font-medium">{r}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteInboundReason(r)}
                  className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Outbound Workflows */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
            Kustomisasi Alur / Alasan Barang Keluar
          </h3>

          <div className="flex gap-2">
            <input
              type="text"
              value={newOutboundInput}
              onChange={(e) => setNewOutboundInput(e.target.value)}
              placeholder="Misal: Donasi / CSR Perusahaan..."
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <button
              type="button"
              onClick={handleAddOutboundReason}
              className="px-3 py-1.5 text-xs font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700 shrink-0 cursor-pointer"
            >
              + Tambah
            </button>
          </div>

          <div className="space-y-1.5 pt-2 max-h-48 overflow-y-auto">
            {outboundReasons.map(r => (
              <div key={r} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-700 font-medium">{r}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteOutboundReason(r)}
                  className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Row: Google Spreadsheet Live Sync Card */}
      <GoogleSheetsSyncCard data={data} onUpdateSettings={onUpdateSettings} />

      {/* Row: Backup & Restore Data */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Download className="w-4 h-4 text-blue-600" />
          Cadangan &amp; Pemulihan Data (Backup &amp; Restore)
        </h3>
        <p className="text-xs text-slate-500">
          Simpan seluruh database stok, katalog SKU, riwayat mutasi, dan pengaturan ke dalam file JSON untuk arsip atau migrasi antar-perangkat.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={exportDataAsJSON}
            className="px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Unduh Cadangan Lengkap (.json)
          </button>

          <label className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-xl cursor-pointer flex items-center gap-2 transition-colors">
            <Upload className="w-4 h-4" />
            <span>Pulihkan dari File (.json)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Row: Administrator Security & Data Purge Center */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-6 rounded-2xl border border-slate-800 shadow-lg space-y-5">
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Zona Pembersihan Data &amp; Otoritas Administrator
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                  Protected
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Pengelolaan data sampel, pembersihan mutasi, dan pengaturan PIN pengaman sistem.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setChangePinModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl flex items-center gap-2 transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            Ganti PIN Admin
          </button>
        </div>

        {/* Info Card */}
        <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 flex items-start gap-3">
          <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p>
            Tindakan di bawah ini dilindungi oleh <strong className="text-white">PIN Administrator</strong> untuk mencegah staf non-otoritas menghapus data inventaris atau riwayat transaksi secara tidak sengaja.
          </p>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          
          {/* Action 1: Kosongkan Total */}
          <div className="bg-slate-800/40 p-4 rounded-xl border border-red-500/30 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-red-400 text-xs font-bold">
                <Database className="w-4 h-4" />
                Kosongkan Database Total
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Hapus semua {data.items.length} barang sampel &amp; {data.transactions.length} mutasi. Profil perusahaan &amp; logo tetap aman.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenPurgeModal('total-clean')}
              className="w-full py-2 px-3 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Mulai Kosongkan Database
            </button>
          </div>

          {/* Action 2: Hapus Transaksi Saja */}
          <div className="bg-slate-800/40 p-4 rounded-xl border border-amber-500/30 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                <FileSpreadsheet className="w-4 h-4" />
                Hapus Transaksi &amp; Nol-kan Stok
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Hapus seluruh {data.transactions.length} riwayat transaksi dan jadikan stok semua SKU menjadi 0.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenPurgeModal('transactions-only')}
              className="w-full py-2 px-3 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Hapus Riwayat Mutasi
            </button>
          </div>

          {/* Action 3: Reset Demo */}
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-blue-400 text-xs font-bold">
                <RotateCcw className="w-4 h-4" />
                Reset ke Data Demo Pabrik
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Muat ulang data contoh katalog barang dan transaksi bawaan untuk demonstrasi/latihan staf.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenPurgeModal('reset-demo')}
              className="w-full py-2 px-3 text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset ke Demo Awal
            </button>
          </div>

        </div>

      </div>

      {/* Admin Purge Modal */}
      <AdminPurgeModal
        isOpen={purgeModalOpen}
        onClose={() => setPurgeModalOpen(false)}
        data={data}
        onDataPurged={handleDataPurged}
        initialMode={purgeMode}
      />

      {/* Change Admin PIN Modal */}
      {changePinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold">Ganti PIN Administrator</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setChangePinModalOpen(false);
                  setPinError('');
                  setPinSuccess('');
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePinSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  PIN Lama Saat Ini <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={oldPinInput}
                  onChange={(e) => setOldPinInput(e.target.value)}
                  placeholder="Masukkan PIN Lama..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 font-mono tracking-widest text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  PIN Baru (Minimal 4 Karakter/Angka) <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  placeholder="Ketik PIN Baru..."
                  maxLength={12}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 font-mono tracking-widest text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Konfirmasi PIN Baru <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value)}
                  placeholder="Ulangi PIN Baru..."
                  maxLength={12}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 font-mono tracking-widest text-center"
                />
              </div>

              {pinError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                  {pinError}
                </div>
              )}

              {pinSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  {pinSuccess}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setChangePinModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-xl shadow-xs"
                >
                  Simpan PIN Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Purge Toast Notification */}
      {adminFeedbackToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{adminFeedbackToast}</span>
        </div>
      )}

    </div>
  );
};

