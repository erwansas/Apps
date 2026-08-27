import React from 'react';
import { 
  LayoutDashboard, 
  Boxes, 
  ArrowDownLeft, 
  ArrowUpRight, 
  History, 
  AlertTriangle, 
  FileText, 
  Settings, 
  X, 
  TrendingDown, 
  Warehouse, 
  ShieldCheck,
  Lock,
  Eye,
  LogIn,
  LogOut,
  KeyRound
} from 'lucide-react';
import { ActiveTab, InventoryData, UserRole } from '../types';
import { getItemStockStatus, formatRupiah } from '../utils/storage';
import { ROLE_CONFIGS } from '../utils/rbac';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  data: InventoryData;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  currentRole: UserRole;
  onOpenRoleModal: () => void;
  onOpenChangePassword?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  data,
  mobileMenuOpen,
  setMobileMenuOpen,
  currentRole,
  onOpenRoleModal,
  onOpenChangePassword = () => {},
  onLogout = () => {}
}) => {
  const lowCount = data.items.filter(i => {
    const s = getItemStockStatus(i);
    return s === 'menipis' || s === 'habis';
  }).length;

  const totalNilaiAset = data.items.reduce((sum, item) => sum + (item.stok * item.hargaBeli), 0);

  const navItems: { 
    id: ActiveTab; 
    label: string; 
    icon: any; 
    badge?: number; 
    badgeColor?: string; 
    description: string;
    requiredRole?: 'staff' | 'admin';
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard Gudang',
      icon: LayoutDashboard,
      description: 'Ringkasan & Metrik Real-time'
    },
    {
      id: 'inventory',
      label: 'Data Stok Barang',
      icon: Boxes,
      badge: data.items.length,
      badgeColor: 'bg-slate-800 text-slate-300',
      description: 'Katalog & Posisi Stok'
    },
    {
      id: 'stock-in',
      label: 'Barang Masuk',
      icon: ArrowDownLeft,
      description: 'Penerimaan & Re-stock',
      requiredRole: 'staff'
    },
    {
      id: 'stock-out',
      label: 'Barang Keluar',
      icon: ArrowUpRight,
      description: 'Pengeluaran & Surat Jalan',
      requiredRole: 'staff'
    },
    {
      id: 'transactions',
      label: 'Riwayat Transaksi',
      icon: History,
      badge: data.transactions.length,
      badgeColor: 'bg-slate-800 text-slate-300',
      description: 'Buku Mutasi & Log Lengkap'
    },
    {
      id: 'low-stock',
      label: 'Peringatan Stok',
      icon: AlertTriangle,
      badge: lowCount > 0 ? lowCount : undefined,
      badgeColor: 'bg-amber-500 text-white animate-pulse',
      description: 'Batas Minimum & Kritis'
    },
    {
      id: 'reports',
      label: 'Laporan PDF',
      icon: FileText,
      description: 'Cetak Dokumen Kantor',
      requiredRole: 'staff'
    },
    {
      id: 'settings',
      label: 'Pengaturan & Alur',
      icon: Settings,
      description: 'Kustomisasi Operasional',
      requiredRole: 'admin'
    },
  ];

  const handleSelect = (tab: ActiveTab, isLocked: boolean) => {
    if (isLocked) {
      onOpenRoleModal();
      return;
    }
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const navContent = (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-300">
      
      {/* Warehouse Info Header in Sidebar */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Warehouse className="w-4 h-4 text-blue-400" />
            <span className="truncate">{data.companySettings.namaPerusahaan}</span>
          </div>
          <button 
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-white lg:hidden"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="truncate">{data.companySettings.namaGudang}</span>
          <span className="flex items-center gap-1 text-emerald-400 font-medium shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Online
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Menu Operasional Gudang
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          // Role-based lock check
          let isLocked = false;
          if (item.requiredRole === 'staff' && currentRole === 'public') {
            isLocked = true;
          } else if (item.requiredRole === 'admin' && currentRole !== 'admin') {
            isLocked = true;
          }

          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              type="button"
              onClick={() => handleSelect(item.id, isLocked)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : isLocked
                  ? 'text-slate-500 hover:bg-slate-850 hover:text-slate-400 opacity-80'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-1.5 rounded-lg ${
                  isActive ? 'bg-white/20 text-white' : 
                  isLocked ? 'bg-slate-800 text-slate-500' :
                  'bg-slate-800 text-slate-400 group-hover:text-white'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-left truncate">
                  <div className="truncate font-semibold flex items-center gap-1.5">
                    <span>{item.label}</span>
                    {isLocked && <Lock className="w-3 h-3 text-amber-400/80 shrink-0" />}
                  </div>
                  <div className={`text-[10px] truncate ${isActive ? 'text-blue-100' : isLocked ? 'text-slate-500' : 'text-slate-400'}`}>
                    {isLocked ? (item.requiredRole === 'admin' ? 'Khusus Admin' : 'Khusus Staf/Admin') : item.description}
                  </div>
                </div>
              </div>

              {isLocked ? (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700 shrink-0 ml-2">
                  Terkunci
                </span>
              ) : item.badge !== undefined ? (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ml-2 ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* User Role & Logout Quick Bar in Sidebar */}
      <div className="px-3 pt-2">
        <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between gap-2">
          <div className="min-w-0 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full shrink-0 ${
              currentRole === 'admin' ? 'bg-rose-400' :
              currentRole === 'supervisor' ? 'bg-amber-400' :
              currentRole === 'staff' ? 'bg-blue-400' : 'bg-emerald-400'
            }`} />
            <div className="truncate">
              <div className="text-[11px] font-bold text-slate-200 truncate">
                {ROLE_CONFIGS[currentRole].shortLabel}
              </div>
              <div className="text-[9px] text-slate-400">
                Sesi Aktif
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="p-1.5 rounded-lg text-rose-400 hover:text-white hover:bg-rose-600/30 border border-rose-500/30 transition-all cursor-pointer shrink-0"
            title="Keluar / Kunci Sesi (Kembali ke Layar Login)"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sidebar Quick Footer Summary */}
      <div className="p-3 m-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            Valuasi Aset
          </span>
          <span className="font-semibold text-slate-300 font-mono text-[11px]">
            {data.items.reduce((acc, c) => acc + c.stok, 0).toLocaleString('id-ID')} unit
          </span>
        </div>
        <div className="text-xs font-bold text-white font-mono truncate">
          {formatRupiah(totalNilaiAset)}
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:pt-16 z-20">
        {navContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-4/5 max-w-xs shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
