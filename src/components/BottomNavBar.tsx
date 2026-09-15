import React from 'react';
import { NavTab } from '../types';
import { Lock } from 'lucide-react';

interface BottomNavBarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  activeHoldCount: number;
  tableName: string | null;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onTabChange,
  activeHoldCount,
  tableName,
}) => {
  const isGated = !tableName;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 pb-3 pt-2 bg-[#171f33] border-t border-[#464554] rounded-t-2xl shadow-2xl backdrop-blur-md">
      {/* Scan Button */}
      <button
        id="tab-scan"
        onClick={() => onTabChange('scan')}
        className={`flex flex-col items-center justify-center px-4 py-1.5 transition-all duration-200 ${
          currentTab === 'scan'
            ? 'bg-[#8083ff] text-[#0d0096] rounded-xl scale-95 shadow-md font-bold'
            : 'text-[#c7c4d7] hover:text-[#c0c1ff]'
        }`}
      >
        <span className="material-symbols-outlined text-[22px] mb-0.5">qr_code_scanner</span>
        <span className="text-[11px] font-bold tracking-wider uppercase">Scan QR</span>
      </button>

      {/* Search Button */}
      <button
        id="tab-search"
        onClick={() => onTabChange('search')}
        className={`flex flex-col items-center justify-center px-4 py-1.5 transition-all duration-200 relative ${
          currentTab === 'search'
            ? 'bg-[#8083ff] text-[#0d0096] rounded-xl scale-95 shadow-md font-bold'
            : isGated
            ? 'text-[#c7c4d7]/50 hover:text-[#c7c4d7]'
            : 'text-[#c7c4d7] hover:text-[#c0c1ff]'
        }`}
      >
        {isGated && (
          <span className="absolute top-1 right-2 w-3.5 h-3.5 bg-[#464554] text-[#c7c4d7] rounded-full flex items-center justify-center">
            <Lock className="w-2.5 h-2.5" />
          </span>
        )}
        <span
          className="material-symbols-outlined text-[22px] mb-0.5"
          style={{ fontVariationSettings: currentTab === 'search' ? "'FILL' 1" : "'FILL' 0" }}
        >
          search
        </span>
        <span className="text-[11px] font-bold tracking-wider uppercase">Search</span>
      </button>

      {/* Library Button */}
      <button
        id="tab-library"
        onClick={() => onTabChange('library')}
        className={`flex flex-col items-center justify-center px-4 py-1.5 relative transition-all duration-200 ${
          currentTab === 'library'
            ? 'bg-[#8083ff] text-[#0d0096] rounded-xl scale-95 shadow-md font-bold'
            : isGated
            ? 'text-[#c7c4d7]/50 hover:text-[#c7c4d7]'
            : 'text-[#c7c4d7] hover:text-[#c0c1ff]'
        }`}
      >
        {isGated ? (
          <span className="absolute top-1 right-2 w-3.5 h-3.5 bg-[#464554] text-[#c7c4d7] rounded-full flex items-center justify-center">
            <Lock className="w-2.5 h-2.5" />
          </span>
        ) : (
          activeHoldCount > 0 && (
            <span className="absolute top-1 right-3 w-4 h-4 bg-[#ffb95f] text-[#3e2400] text-[10px] font-extrabold rounded-full flex items-center justify-center animate-pulse">
              {activeHoldCount}
            </span>
          )
        )}
        <span className="material-symbols-outlined text-[22px] mb-0.5">local_library</span>
        <span className="text-[11px] font-bold tracking-wider uppercase">Library</span>
      </button>

      {/* Account Button */}
      <button
        id="tab-account"
        onClick={() => onTabChange('account')}
        className={`flex flex-col items-center justify-center px-4 py-1.5 transition-all duration-200 ${
          currentTab === 'account'
            ? 'bg-[#8083ff] text-[#0d0096] rounded-xl scale-95 shadow-md font-bold'
            : 'text-[#c7c4d7] hover:text-[#c0c1ff]'
        }`}
      >
        <span className="material-symbols-outlined text-[22px] mb-0.5">person</span>
        <span className="text-[11px] font-bold tracking-wider uppercase">Account</span>
      </button>
    </nav>
  );
};
