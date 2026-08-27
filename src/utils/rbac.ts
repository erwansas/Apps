import { UserRole, CompanySettings } from '../types';

export const ROLE_STORAGE_KEY = 'ais_inventory_user_role';

export interface RoleConfig {
  id: UserRole;
  label: string;
  shortLabel: string;
  badgeLabel: string;
  badgeBg: string;
  badgeTextColor: string;
  badgeBorder: string;
  description: string;
  accessLevelText: string;
  defaultPin?: string;
  canViewDashboard: boolean;
  canViewInventory: boolean;
  canViewLowStock: boolean;
  canViewReports: boolean;
  canViewTransactions: boolean;
  canCreateStockIn: boolean;
  canCreateStockOut: boolean;
  canAddItem: boolean;
  canEditItem: boolean;
  canDeleteItem: boolean;
  canAdjustStock: boolean; // Stock Opname
  canExportData: boolean;
  canManageSettings: boolean;
  canPurgeData: boolean;
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  public: {
    id: 'public',
    label: 'Publik / Tamu (Hanya Lihat)',
    shortLabel: 'Publik (Viewer)',
    badgeLabel: 'HANYA LIHAT (READ-ONLY)',
    badgeBg: 'bg-emerald-500/15',
    badgeTextColor: 'text-emerald-300',
    badgeBorder: 'border-emerald-500/30',
    description: 'Akses publik hanya-lihat. Dapat memantau ketersediaan stok, SKU, dan posisi rak tanpa izin ekspor/modifikasi.',
    accessLevelText: 'Tingkat 1: Read-Only (Aman Dibagikan)',
    canViewDashboard: true,
    canViewInventory: true,
    canViewLowStock: true,
    canViewReports: false,
    canViewTransactions: true,
    canCreateStockIn: false,
    canCreateStockOut: false,
    canAddItem: false,
    canEditItem: false,
    canDeleteItem: false,
    canAdjustStock: false,
    canExportData: false,
    canManageSettings: false,
    canPurgeData: false
  },
  staff: {
    id: 'staff',
    label: 'Staf Gudang / Operator',
    shortLabel: 'Staf Gudang',
    badgeLabel: 'OPERATOR GUDANG',
    badgeBg: 'bg-blue-500/15',
    badgeTextColor: 'text-blue-300',
    badgeBorder: 'border-blue-500/30',
    description: 'Petugas lapangan yang berwenang mencatat transaksi Barang Masuk, Barang Keluar, serta mencetak surat jalan / bukti penerimaan.',
    accessLevelText: 'Tingkat 2: Operator Transaksi',
    defaultPin: '1111',
    canViewDashboard: true,
    canViewInventory: true,
    canViewLowStock: true,
    canViewReports: true,
    canViewTransactions: true,
    canCreateStockIn: true,
    canCreateStockOut: true,
    canAddItem: false,
    canEditItem: false,
    canDeleteItem: false,
    canAdjustStock: false,
    canExportData: true,
    canManageSettings: false,
    canPurgeData: false
  },
  supervisor: {
    id: 'supervisor',
    label: 'Supervisor / Kepala Regu',
    shortLabel: 'Supervisor',
    badgeLabel: 'SUPERVISOR',
    badgeBg: 'bg-amber-500/15',
    badgeTextColor: 'text-amber-300',
    badgeBorder: 'border-amber-500/30',
    description: 'Pengawas gudang dengan kewenangan menambah/edit master SKU barang, stock opname (penyesuaian stok), dan ekspor laporan.',
    accessLevelText: 'Tingkat 3: Pengawas & Master Data',
    defaultPin: '2222',
    canViewDashboard: true,
    canViewInventory: true,
    canViewLowStock: true,
    canViewReports: true,
    canViewTransactions: true,
    canCreateStockIn: true,
    canCreateStockOut: true,
    canAddItem: true,
    canEditItem: true,
    canDeleteItem: false,
    canAdjustStock: true,
    canExportData: true,
    canManageSettings: false,
    canPurgeData: false
  },
  admin: {
    id: 'admin',
    label: 'Administrator Sistem (Full Control)',
    shortLabel: 'Administrator',
    badgeLabel: 'SUPER ADMIN',
    badgeBg: 'bg-rose-500/15',
    badgeTextColor: 'text-rose-300',
    badgeBorder: 'border-rose-500/30',
    description: 'Otoritas tertinggi dengan hak akses penuh: kustomisasi nama/logo perusahaan, ganti PIN, manajemen alur, backup/restore, dan pembersihan database.',
    accessLevelText: 'Tingkat 4: Otoritas Penuh',
    defaultPin: '1234',
    canViewDashboard: true,
    canViewInventory: true,
    canViewLowStock: true,
    canViewReports: true,
    canViewTransactions: true,
    canCreateStockIn: true,
    canCreateStockOut: true,
    canAddItem: true,
    canEditItem: true,
    canDeleteItem: true,
    canAdjustStock: true,
    canExportData: true,
    canManageSettings: true,
    canPurgeData: true
  }
};

/**
 * Detects initial user role.
 * SECURITY: If no authenticated session exists in this browser's localStorage,
 * it returns null (requiring PIN login gate).
 * Only a previously authenticated session stored locally in this browser
 * can restore staff/supervisor/admin/public role.
 */
export function getInitialRole(): UserRole | null {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(ROLE_STORAGE_KEY) as UserRole | null;
      if (stored && (stored === 'staff' || stored === 'supervisor' || stored === 'admin' || stored === 'public')) {
        return stored;
      }
    }
  } catch (err) {
    console.error('Error getting initial role:', err);
  }

  // When opening fresh or via shared link on a new browser/device, return null (Require Login Gate)
  return null;
}

/**
 * Saves current role to localStorage
 */
export function saveActiveRole(role: UserRole): void {
  try {
    localStorage.setItem(ROLE_STORAGE_KEY, role);
    window.dispatchEvent(new CustomEvent('user-role-changed', { detail: role }));
  } catch {}
}

/**
 * Clears active role from localStorage (Logs out session)
 */
export function clearActiveRole(): void {
  try {
    localStorage.removeItem(ROLE_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('user-role-changed', { detail: null }));
  } catch {}
}

/**
 * Generates a clean public shareable URL
 */
export function getPublicShareableLink(): string {
  try {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('role');
      url.searchParams.delete('mode');
      url.searchParams.delete('view');
      return url.toString();
    }
  } catch {}
  return window?.location?.href || '';
}

/**
 * Checks if the current user role has permission to add new SKU/Item.
 * Admin and Supervisor can always add items.
 * Staff Gudang can add items if enabled by Admin in CompanySettings.
 */
export function canUserAddItem(role: UserRole, settings?: CompanySettings): boolean {
  if (role === 'admin' || role === 'supervisor') return true;
  if (role === 'staff' && settings?.staffCanAddItem) return true;
  return false;
}

/**
 * Checks if the current user role has permission to perform Stock Opname (penyesuaian stok).
 * Admin and Supervisor can always adjust stock.
 * Staff Gudang can adjust stock if enabled by Admin in CompanySettings.
 */
export function canUserAdjustStock(role: UserRole, settings?: CompanySettings): boolean {
  if (role === 'admin' || role === 'supervisor') return true;
  if (role === 'staff' && settings?.staffCanAdjustStock) return true;
  return false;
}
