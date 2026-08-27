import React, { useState, useEffect } from 'react';
import { InventoryData, ActiveTab, Item, Transaction, CompanySettings, UserRole } from './types';
import { initialCompanySettings } from './data/initialData';
import { loadInventoryData, saveInventoryData, getItemStockStatus } from './utils/storage';
import { getInitialRole, saveActiveRole, clearActiveRole } from './utils/rbac';
import { subscribeToCloudInventory } from './services/firebase';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { InventoryView } from './components/InventoryView';
import { StockInView } from './components/StockInView';
import { StockOutView } from './components/StockOutView';
import { TransactionsView } from './components/TransactionsView';
import { LowStockView } from './components/LowStockView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { ReceiptModal } from './components/ReceiptModal';
import { RoleSwitchModal } from './components/RoleSwitchModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { LoginScreen } from './components/LoginScreen';

export default function App() {
  const [data, setData] = useState<InventoryData>(() => loadInventoryData());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(() => getInitialRole());
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  // Cross-view state pass (e.g. from LowStock / Inventory to Stock In/Out)
  const [selectedItemForAction, setSelectedItemForAction] = useState<Item | null>(null);

  // Receipt / Voucher modal state
  const [viewingReceipt, setViewingReceipt] = useState<Transaction | null>(null);

  // Sync state changes with persistence
  const updateData = (newData: InventoryData) => {
    setData(newData);
    saveInventoryData(newData);
  };

  const handleRoleChange = (newRole: UserRole) => {
    setCurrentRole(newRole);
    saveActiveRole(newRole);
    if (newRole === 'public') {
      // If active tab requires staff/admin permission, redirect cleanly to dashboard
      if (activeTab === 'stock-in' || activeTab === 'stock-out' || activeTab === 'settings') {
        setActiveTab('dashboard');
      }
    }
  };

  const handleLogout = () => {
    clearActiveRole();
    setCurrentRole(null);
    setActiveTab('dashboard');
  };

  // Real-time Cloud Synchronization with Firebase Firestore
  useEffect(() => {
    // 1. Subscribe to real-time changes from Firestore (multi-device & multi-browser live sync)
    const unsubscribeFirestore = subscribeToCloudInventory((cloudData) => {
      if (cloudData && typeof cloudData === 'object') {
        const upgraded = { ...cloudData };
        if (upgraded.companySettings) {
          if (!upgraded.companySettings.logoText || upgraded.companySettings.logoText === 'NLP INVENTORY' || upgraded.companySettings.logoText === 'INVENTARIS GUDANG') {
            upgraded.companySettings.logoText = 'Smart Stock, Better Control';
          }
          if (!upgraded.companySettings.logoSubtitle || upgraded.companySettings.logoSubtitle === 'Gudang Pusat Distribusi Jakarta' || upgraded.companySettings.logoSubtitle === 'Gudang Pusat Distribusi Jakarta - Harian Kompas (Kompas.id)' || upgraded.companySettings.logoSubtitle === 'Gudang Distribusi') {
            upgraded.companySettings.logoSubtitle = 'Harian Kompas (Kompas.id)';
          }
          if (!upgraded.companySettings.namaGudang || upgraded.companySettings.namaGudang === 'Gudang Pusat Distribusi Jakarta' || upgraded.companySettings.namaGudang === 'Gudang Pusat Distribusi Jakarta - Harian Kompas (Kompas.id)') {
            upgraded.companySettings.namaGudang = 'Harian Kompas (Kompas.id)';
          }
          if (!upgraded.companySettings.namaPerusahaan || upgraded.companySettings.namaPerusahaan === 'PT. NUSANTARA LOGISTIK PRIMA') {
            upgraded.companySettings.namaPerusahaan = 'Harian Kompas (Kompas.id)';
          }
          upgraded.companySettings.logoTag = '';
          if (!upgraded.companySettings.logoUrl || upgraded.companySettings.logoUrl.includes('kompasBg')) {
            upgraded.companySettings.logoUrl = initialCompanySettings.logoUrl;
          }
        }
        setData(upgraded);
        try {
          localStorage.setItem('ais_inventaris_gudang_data_v2', JSON.stringify(upgraded));
        } catch {}
      }
    });

    // 2. Listen to same-window and cross-tab storage events
    const handleStorageUpdate = (e: any) => {
      if (e.detail) {
        setData(e.detail);
      }
    };

    const handleNativeStorageUpdate = (e: StorageEvent) => {
      if (e.key === 'ais_inventaris_gudang_data_v2' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setData(parsed);
        } catch (err) {
          console.error(err);
        }
      }
    };

    window.addEventListener('inventory-data-updated', handleStorageUpdate);
    window.addEventListener('storage', handleNativeStorageUpdate);

    return () => {
      unsubscribeFirestore();
      window.removeEventListener('inventory-data-updated', handleStorageUpdate);
      window.removeEventListener('storage', handleNativeStorageUpdate);
    };
  }, []);

  // Handlers for Inventory View
  const handleSaveItem = (itemToSave: Item, isNew: boolean) => {
    let updatedItems: Item[];
    if (isNew) {
      updatedItems = [itemToSave, ...data.items];
    } else {
      updatedItems = data.items.map(item => item.id === itemToSave.id ? itemToSave : item);
    }
    updateData({
      ...data,
      items: updatedItems
    });
  };

  const handleDeleteItem = (itemId: string) => {
    updateData({
      ...data,
      items: data.items.filter(item => item.id !== itemId)
    });
  };

  const handleRecordAdjustment = (transaction: Transaction, updatedItem: Item) => {
    updateData({
      ...data,
      items: data.items.map(i => i.id === updatedItem.id ? updatedItem : i),
      transactions: [transaction, ...data.transactions]
    });
  };

  // Inbound & Outbound Handlers
  const handleRecordStockIn = (transaction: Transaction, updatedItem: Item) => {
    const itemExists = data.items.some(i => i.id === updatedItem.id);
    const updatedItems = itemExists
      ? data.items.map(i => i.id === updatedItem.id ? updatedItem : i)
      : [updatedItem, ...data.items];

    updateData({
      ...data,
      items: updatedItems,
      transactions: [transaction, ...data.transactions]
    });
  };

  const handleRecordStockOut = (transaction: Transaction, updatedItem: Item) => {
    const itemExists = data.items.some(i => i.id === updatedItem.id);
    const updatedItems = itemExists
      ? data.items.map(i => i.id === updatedItem.id ? updatedItem : i)
      : [updatedItem, ...data.items];

    updateData({
      ...data,
      items: updatedItems,
      transactions: [transaction, ...data.transactions]
    });
  };

  // Settings Handlers
  const handleUpdateCompanySettings = (newSettings: CompanySettings) => {
    updateData({
      ...data,
      companySettings: newSettings
    });
  };

  const handleUpdateCategories = (newCategories: string[]) => {
    updateData({
      ...data,
      categories: newCategories
    });
  };

  const handleUpdateLocations = (newLocations: string[]) => {
    updateData({
      ...data,
      locations: newLocations
    });
  };

  const handleUpdateUnits = (newUnits: string[]) => {
    updateData({
      ...data,
      units: newUnits
    });
  };

  const handleUpdateInboundReasons = (newReasons: string[]) => {
    updateData({
      ...data,
      inboundReasons: newReasons
    });
  };

  const handleUpdateOutboundReasons = (newReasons: string[]) => {
    updateData({
      ...data,
      outboundReasons: newReasons
    });
  };

  const handleRestoreData = (restored: InventoryData) => {
    setData(restored);
  };

  // Cross-Navigation Shortcuts
  const handleSelectItemForRestock = (item: Item) => {
    setSelectedItemForAction(item);
    setActiveTab('stock-in');
  };

  const handleOpenStockIn = (item: Item) => {
    setSelectedItemForAction(item);
    setActiveTab('stock-in');
  };

  const handleOpenStockOut = (item: Item) => {
    setSelectedItemForAction(item);
    setActiveTab('stock-out');
  };

  const handleViewTransactionReceipt = (trx: Transaction) => {
    setViewingReceipt(trx);
  };

  // Find item for receipt modal
  const receiptItem = viewingReceipt ? data.items.find(i => i.id === viewingReceipt.itemId) : undefined;

  // If user is unauthenticated (e.g. fresh browser, shared link, or logged out), show Login Screen Gate
  if (currentRole === null) {
    return (
      <LoginScreen
        onLoginSuccess={handleRoleChange}
        companySettings={data.companySettings}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        data={data}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onSelectItemForRestock={handleSelectItemForRestock}
        currentRole={currentRole}
        onOpenRoleModal={() => setRoleModalOpen(true)}
        onOpenChangePassword={() => setPasswordModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Layout: Persistent Sidebar + Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          data={data}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          currentRole={currentRole}
          onOpenRoleModal={() => setRoleModalOpen(true)}
          onOpenChangePassword={() => setPasswordModalOpen(true)}
          onLogout={handleLogout}
        />

        {/* Dynamic View Content Area */}
        <main className="flex-1 lg:pl-64 p-4 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
          
          {activeTab === 'dashboard' && (
            <DashboardView
              data={data}
              setActiveTab={setActiveTab}
              onSelectItemForRestock={handleSelectItemForRestock}
              onViewTransactionReceipt={handleViewTransactionReceipt}
              currentRole={currentRole}
              onOpenRoleModal={() => setRoleModalOpen(true)}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              data={data}
              onSaveItem={handleSaveItem}
              onDeleteItem={handleDeleteItem}
              onRecordAdjustment={handleRecordAdjustment}
              onOpenStockIn={handleOpenStockIn}
              onOpenStockOut={handleOpenStockOut}
              onRestoreData={handleRestoreData}
              currentRole={currentRole}
              onOpenRoleModal={() => setRoleModalOpen(true)}
            />
          )}

          {activeTab === 'stock-in' && (
            <StockInView
              data={data}
              preselectedItem={selectedItemForAction}
              onRecordStockIn={handleRecordStockIn}
              onViewTransactionReceipt={handleViewTransactionReceipt}
              onNavigateToInventory={() => setActiveTab('inventory')}
            />
          )}

          {activeTab === 'stock-out' && (
            <StockOutView
              data={data}
              preselectedItem={selectedItemForAction}
              onRecordStockOut={handleRecordStockOut}
              onViewTransactionReceipt={handleViewTransactionReceipt}
              onNavigateToInventory={() => setActiveTab('inventory')}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView
              data={data}
              onViewTransactionReceipt={handleViewTransactionReceipt}
              onRestoreData={handleRestoreData}
              currentRole={currentRole}
              onOpenRoleModal={() => setRoleModalOpen(true)}
            />
          )}

          {activeTab === 'low-stock' && (
            <LowStockView
              data={data}
              onSelectItemForRestock={handleSelectItemForRestock}
              currentRole={currentRole}
              onOpenRoleModal={() => setRoleModalOpen(true)}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView 
              data={data} 
              currentRole={currentRole}
              onOpenRoleModal={() => setRoleModalOpen(true)}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              data={data}
              onUpdateSettings={handleUpdateCompanySettings}
              onUpdateCategories={handleUpdateCategories}
              onUpdateLocations={handleUpdateLocations}
              onUpdateUnits={handleUpdateUnits}
              onUpdateInboundReasons={handleUpdateInboundReasons}
              onUpdateOutboundReasons={handleUpdateOutboundReasons}
              onRestoreData={handleRestoreData}
              currentRole={currentRole}
              onOpenRoleModal={() => setRoleModalOpen(true)}
              onOpenChangePassword={() => setPasswordModalOpen(true)}
            />
          )}

        </main>
      </div>

      {/* Voucher / Bukti Transaksi Modal */}
      {viewingReceipt && (
        <ReceiptModal
          transaction={viewingReceipt}
          item={receiptItem}
          settings={data.companySettings}
          onClose={() => setViewingReceipt(null)}
        />
      )}

      {/* Role Switch & Login Modal */}
      <RoleSwitchModal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        currentRole={currentRole}
        onRoleChanged={handleRoleChange}
        companySettings={data.companySettings}
        onOpenChangePassword={() => setPasswordModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        currentRole={currentRole}
        companySettings={data.companySettings}
        onUpdateCompanySettings={handleUpdateCompanySettings}
      />

      {/* Floating Bottom Quick Action for Mobile (Only for active staff/admins) */}
      {currentRole !== 'public' && (
        <div className="lg:hidden fixed bottom-4 right-4 z-40 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('stock-in')}
            className="p-3 rounded-full bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 flex items-center justify-center hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
            title="Catat Barang Masuk"
          >
            <span className="text-xs font-bold px-1">+ Masuk</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stock-out')}
            className="p-3 rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/30 flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all cursor-pointer"
            title="Catat Barang Keluar"
          >
            <span className="text-xs font-bold px-1">- Keluar</span>
          </button>
        </div>
      )}

    </div>
  );
}
