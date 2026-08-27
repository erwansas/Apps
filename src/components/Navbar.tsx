import React, { useState } from 'react';
import { 
  Package, 
  Bell, 
  Search, 
  Menu, 
  X, 
  AlertTriangle, 
  Layers, 
  Building2, 
  Calendar,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  UserCheck,
  Users,
  ShieldCheck,
  Share2,
  ChevronDown,
  LogOut,
  Lock,
  KeyRound
} from 'lucide-react';
import { InventoryData, ActiveTab, Item, UserRole } from '../types';
import { getItemStockStatus } from '../utils/storage';
import { ROLE_CONFIGS } from '../utils/rbac';

interface NavbarProps {
  data: InventoryData;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onSelectItemForRestock?: (item: Item) => void;
  currentRole: UserRole;
  onOpenRoleModal: () => void;
  onOpenChangePassword?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  data,
  setActiveTab,
  mobileMenuOpen,
  setMobileMenuOpen,
  onSelectItemForRestock,
  currentRole,
  onOpenRoleModal,
  onOpenChangePassword = () => {},
  onLogout = () => {}
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const lowStockItems = data.items.filter(item => {
    const status = getItemStockStatus(item);
    return status === 'menipis' || status === 'habis';
  });

  const outOfStockCount = data.items.filter(i => getItemStockStatus(i) === 'habis').length;
  const lowStockCount = data.items.filter(i => getItemStockStatus(i) === 'menipis').length;

  const roleConfig = ROLE_CONFIGS[currentRole];

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'public':
        return <Eye className="w-3.5 h-3.5 text-emerald-400" />;
      case 'staff':
        return <UserCheck className="w-3.5 h-3.5 text-blue-400" />;
      case 'supervisor':
        return <Users className="w-3.5 h-3.5 text-amber-400" />;
      case 'admin':
        return <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />;
    }
  };

  const filteredSearchItems = searchQuery.trim() === '' ? [] : data.items.filter(i => 
    i.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
    i.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.kategori.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Mobile Menu Toggle & Brand */}
          <div className="flex items-center gap-3">
            <button
              id="btn-mobile-menu-toggle"
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none lg:hidden"
              aria-label="Buka Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div 
              onClick={() => setActiveTab('dashboard')} 
              className="flex items-center gap-3 cursor-pointer select-none group"
              title="Klik untuk ke Dashboard (Ubah Logo & Judul di Menu Pengaturan)"
            >
              {data.companySettings.logoUrl ? (
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-lg shadow-blue-500/10 overflow-hidden group-hover:border-blue-500 transition-colors p-1">
                  <img 
                    src={data.companySettings.logoUrl} 
                    alt="Logo Perusahaan" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:bg-blue-500 transition-colors">
                  <Package className="w-6 h-6 text-white" />
                </div>
              )}
              <div className="hidden sm:block">
                <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                  <span>{data.companySettings.logoText || 'Smart Stock, Better Control'}</span>
                </h1>
                <p className="text-xs text-slate-400 truncate max-w-[200px] md:max-w-xs font-normal">
                  {data.companySettings.logoSubtitle || data.companySettings.namaGudang || 'Harian Kompas (Kompas.id)'}
                </p>
              </div>
            </div>
          </div>

          {/* Center: Global Search Bar */}
          <div className="relative hidden md:block w-72 lg:w-96">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-global-inventory-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari SKU, nama barang, atau kategori..."
                className="w-full pl-10 pr-4 py-1.5 text-xs rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')} 
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick search dropdown */}
            {filteredSearchItems.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
                <div className="p-2 border-b border-slate-700 text-[11px] font-medium text-slate-400">
                  Hasil Pencarian Cepat ({filteredSearchItems.length})
                </div>
                <div className="divide-y divide-slate-700/50">
                  {filteredSearchItems.map(item => {
                    const status = getItemStockStatus(item);
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setActiveTab('inventory');
                          setSearchQuery('');
                        }}
                        className="p-2.5 hover:bg-slate-700/50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-white">{item.nama}</div>
                          <div className="text-[11px] text-slate-400">{item.sku} • {item.lokasiRak}</div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            status === 'habis' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                            status === 'menipis' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            Stok: {item.stok} {item.satuan}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right: Quick Date, Notification Bell & User info */}
          <div className="flex items-center gap-3">
            
            {/* Real-time Date Badge */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>{currentDate}</span>
            </div>

            {/* Notification Center */}
            <div className="relative">
              <button
                id="btn-notification-center-trigger"
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none transition-colors"
                title="Peringatan Stok Gudang"
              >
                <Bell className="w-5 h-5" />
                {lowStockItems.length > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 text-[9px] font-bold text-white items-center justify-center">
                      {lowStockItems.length > 9 ? '9+' : lowStockItems.length}
                    </span>
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div 
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="p-3.5 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="font-semibold text-xs text-white">Notifikasi Ambang Batas Stok</span>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-mono font-medium">
                      {lowStockItems.length} Peringatan
                    </span>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800">
                    {lowStockItems.length === 0 ? (
                      <div className="p-6 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                        <p className="text-xs font-medium text-slate-300">Semua Stok Dalam Kondisi Aman</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Tidak ada barang yang berada di bawah ambang batas.</p>
                      </div>
                    ) : (
                      lowStockItems.map(item => {
                        const isZero = item.stok <= 0;
                        return (
                          <div 
                            key={item.id} 
                            className="p-3 hover:bg-slate-800/60 transition-colors flex items-start justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${isZero ? 'bg-red-500' : 'bg-amber-400'}`} />
                                <span className="font-semibold text-xs text-slate-200 line-clamp-1">{item.nama}</span>
                              </div>
                              <p className="text-[11px] text-slate-400">
                                SKU: <span className="font-mono text-slate-300">{item.sku}</span> • Rak: {item.lokasiRak}
                              </p>
                              <div className="flex items-center gap-2 text-[11px]">
                                <span className={isZero ? 'text-red-400 font-bold' : 'text-amber-400 font-semibold'}>
                                  Sisa: {item.stok} {item.satuan}
                                </span>
                                <span className="text-slate-500">(Min: {item.minStok} {item.satuan})</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setShowNotifications(false);
                                if (onSelectItemForRestock) {
                                  onSelectItemForRestock(item);
                                }
                                setActiveTab('stock-in');
                              }}
                              className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors shrink-0 flex items-center gap-1"
                            >
                              <ArrowDownLeft className="w-3 h-3" />
                              Restock
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {lowStockItems.length > 0 && (
                    <div className="p-2.5 bg-slate-800/80 border-t border-slate-700 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setShowNotifications(false);
                          setActiveTab('low-stock');
                        }}
                        className="text-xs font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                      >
                        Buka Halaman Pemantauan Stok &amp; Restock
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Interactive Role Switcher & Profile Button */}
            <div className="relative pl-2 border-l border-slate-800">
              {currentRole === 'public' ? (
                <button
                  type="button"
                  onClick={onOpenRoleModal}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-blue-500/50 bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer shadow-xs font-semibold text-xs"
                  title="Masuk menggunakan PIN Staf, Supervisor, atau Administrator"
                >
                  <Lock className="w-3.5 h-3.5 text-blue-200" />
                  <span>Masuk / Login</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(!profileMenuOpen);
                      setShowNotifications(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                      currentRole === 'staff'
                        ? 'bg-blue-950/80 border-blue-500/50 hover:bg-blue-900/90 text-blue-100'
                        : currentRole === 'supervisor'
                        ? 'bg-amber-950/80 border-amber-500/50 hover:bg-amber-900/90 text-amber-100'
                        : 'bg-rose-950/80 border-rose-500/50 hover:bg-rose-900/90 text-rose-100'
                    }`}
                    title="Menu Akun & Sesi"
                  >
                    <div className={`p-1 rounded-lg ${
                      currentRole === 'staff' ? 'bg-blue-500/30 text-blue-300' :
                      currentRole === 'supervisor' ? 'bg-amber-500/30 text-amber-300' :
                      'bg-rose-500/30 text-rose-300'
                    }`}>
                      {getRoleIcon(currentRole)}
                    </div>

                    <div className="text-left">
                      <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                        <span>{roleConfig.shortLabel}</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${profileMenuOpen ? 'rotate-180 text-white' : 'text-slate-400'}`} />
                      </div>
                      <div className="text-[9px] text-emerald-400 font-medium leading-none flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span>Aktif</span>
                      </div>
                    </div>
                  </button>

                  {/* Profile & Account Dropdown Menu */}
                  {profileMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setProfileMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        {/* Dropdown Header */}
                        <div className="p-3.5 bg-slate-800/80 border-b border-slate-700/80">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-2 rounded-xl ${
                              currentRole === 'staff' ? 'bg-blue-500/20 text-blue-400' :
                              currentRole === 'supervisor' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-rose-500/20 text-rose-400'
                            }`}>
                              {getRoleIcon(currentRole)}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white truncate">
                                {roleConfig.label}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                Sesi Terautentikasi (PIN)
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Dropdown Actions */}
                        <div className="p-1.5 space-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              setProfileMenuOpen(false);
                              onOpenChangePassword();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800/90 rounded-xl transition-colors cursor-pointer text-left"
                          >
                            <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
                            <div>
                              <div className="font-semibold">Ganti Password / PIN</div>
                              <div className="text-[10px] text-slate-400">Ubah PIN akses akun ini</div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setProfileMenuOpen(false);
                              onOpenRoleModal();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800/90 rounded-xl transition-colors cursor-pointer text-left"
                          >
                            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                            <div>
                              <div className="font-semibold">Info Hak Akses</div>
                              <div className="text-[10px] text-slate-400">Lihat wewenang peran aktif</div>
                            </div>
                          </button>

                          {currentRole === 'admin' && (
                            <button
                              type="button"
                              onClick={() => {
                                setProfileMenuOpen(false);
                                setActiveTab('settings');
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800/90 rounded-xl transition-colors cursor-pointer text-left"
                            >
                              <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              <div>
                                <div className="font-semibold">Pengaturan Gudang</div>
                                <div className="text-[10px] text-slate-400">Kelola profil & master PIN</div>
                              </div>
                            </button>
                          )}
                        </div>

                        {/* Logout Section */}
                        <div className="p-1.5 border-t border-slate-800 bg-slate-950/40">
                          <button
                            type="button"
                            onClick={() => {
                              setProfileMenuOpen(false);
                              onLogout();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 rounded-xl transition-colors cursor-pointer text-left"
                          >
                            <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
                            <div>
                              <div>Keluar / Kunci Sesi</div>
                              <div className="text-[10px] text-slate-500 font-normal">Kembali ke Mode Publik</div>
                            </div>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
