import React from 'react';
import { NavTab } from '../types';
import { UserAccount } from '../lib/authService';
import { formatTableName } from '../lib/shelfUtils';
import { QrCode, Search, Library, User, LogIn, Lock } from 'lucide-react';

interface TopAppBarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  tableName: string | null;
  onRescanClick: () => void;
  onDisconnectShelf?: () => void;
  currentUser: UserAccount | null;
  onOpenAuth: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  currentTab,
  onTabChange,
  tableName,
  onRescanClick,
  onDisconnectShelf,
  currentUser,
  onOpenAuth,
}) => {
  const isGated = !tableName;

  return (
    <header className="bg-[#171f33] border-b border-[#464554] flex justify-between items-center w-full px-4 py-2.5 sticky top-0 z-40">
      {/* Brand & Connection Badge */}
      <div className="flex items-center gap-3">
        <div
          id="app-brand"
          onClick={() => onTabChange(tableName ? 'search' : 'scan')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-[#8083ff] flex items-center justify-center text-[#0d0096] font-bold shadow-md">
            <span className="material-symbols-outlined text-[20px]">local_library</span>
          </div>
          <h1 className="text-xl font-bold text-[#c0c1ff] tracking-tight group-hover:text-white transition-colors">
            ShelfLocator
          </h1>
        </div>

        {/* Live Sync Status Pill */}
        <div
          id="connection-badge"
          onClick={onRescanClick}
          className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border shadow-sm cursor-pointer transition-all ${
            tableName
              ? 'bg-[#0b1326] border-[#464554] hover:border-[#c0c1ff]'
              : 'bg-[#93000a]/20 border-[#ffb4ab]/40 hover:border-[#ffb4ab]'
          }`}
          title="Click to scan shelf QR code"
        >
          <div
            className={`w-2 h-2 rounded-full ${
              tableName ? 'bg-[#4edea3] animate-pulse' : 'bg-[#ffb4ab]'
            }`}
          />
          <span className="text-xs font-bold text-[#dae2fd] tracking-wider uppercase">
            {formatTableName(tableName)}
          </span>
        </div>
      </div>

      {/* Desktop Navigation Cluster */}
      <nav className="hidden md:flex items-center gap-6">
        <button
          id="nav-desk-scan"
          onClick={() => onTabChange('scan')}
          className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
            currentTab === 'scan' ? 'text-[#c0c1ff]' : 'text-[#c7c4d7] hover:text-[#c0c1ff]'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Scan Shelf QR</span>
        </button>

        <button
          id="nav-desk-search"
          onClick={() => onTabChange('search')}
          className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
            currentTab === 'search'
              ? 'text-[#c0c1ff]'
              : isGated
              ? 'text-[#c7c4d7]/50 hover:text-[#c7c4d7]'
              : 'text-[#c7c4d7] hover:text-[#c0c1ff]'
          }`}
        >
          {isGated ? <Lock className="w-3.5 h-3.5" /> : <Search className="w-4 h-4" />}
          <span>Find Book</span>
        </button>

        <button
          id="nav-desk-library"
          onClick={() => onTabChange('library')}
          className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
            currentTab === 'library'
              ? 'text-[#c0c1ff]'
              : isGated
              ? 'text-[#c7c4d7]/50 hover:text-[#c7c4d7]'
              : 'text-[#c7c4d7] hover:text-[#c0c1ff]'
          }`}
        >
          {isGated ? <Lock className="w-3.5 h-3.5" /> : <Library className="w-4 h-4" />}
          <span>My Holds</span>
        </button>

        <button
          id="nav-desk-account"
          onClick={() => onTabChange('account')}
          className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
            currentTab === 'account' ? 'text-[#c0c1ff]' : 'text-[#c7c4d7] hover:text-[#c0c1ff]'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Account</span>
        </button>
      </nav>

      {/* Patron Profile / Sign In Action */}
      <div className="flex items-center gap-2">
        {currentUser ? (
          <button
            id="btn-patron-profile"
            onClick={() => onTabChange('account')}
            className="flex items-center gap-2 bg-[#222a3d] hover:bg-[#2d3449] border border-[#464554] px-2.5 py-1 rounded-full transition-all"
            title={`Patron: ${currentUser.username}`}
          >
            <div className="w-6 h-6 rounded-full bg-[#8083ff] text-[#0d0096] flex items-center justify-center text-xs font-bold shadow-sm">
              {currentUser.username.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-medium text-[#dae2fd] hidden sm:inline">
              {currentUser.username}
            </span>
          </button>
        ) : (
          <button
            id="btn-nav-login"
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 bg-[#8083ff] hover:bg-[#c0c1ff] text-[#0d0096] font-bold px-3 py-1.5 rounded-full text-xs transition-all shadow-sm active:scale-95"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Patron Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
