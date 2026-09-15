import React, { useState } from 'react';
import { BookItem } from '../types';
import { UserAccount, clearSession } from '../lib/authService';
import { formatTableName } from '../lib/shelfUtils';
import {
  User,
  QrCode,
  Bookmark,
  Clock,
  ArrowRight,
  ShieldCheck,
  Library,
  LogOut,
  LogIn,
  Database,
  Calendar,
  Unlink,
} from 'lucide-react';

interface AccountViewProps {
  currentUser: UserAccount | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  tableName: string | null;
  onRescanClick: () => void;
  onDisconnectShelf?: () => void;
  books: BookItem[];
}

export const AccountView: React.FC<AccountViewProps> = ({
  currentUser,
  onOpenAuth,
  onLogout,
  tableName,
  onRescanClick,
  onDisconnectShelf,
  books,
}) => {
  const currentUid = currentUser?.username || 'guest';
  const userHolds = books.filter((b) => b.reservedBy === currentUid);
  const userWaitlists = books.filter((b) => b.queue.includes(currentUid));

  return (
    <div className="flex-1 flex flex-col w-full max-w-3xl mx-auto px-4 py-4 gap-5 pb-28 md:pb-12 overflow-y-auto">
      {/* Patron Digital Library Pass Card */}
      <div className="bg-[#171f33] border border-[#464554] rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#8083ff]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#8083ff] to-[#4edea3] flex items-center justify-center text-[#0d0096] text-3xl font-extrabold shadow-lg border-2 border-white/20 shrink-0">
            {currentUser ? currentUser.username.charAt(0).toUpperCase() : 'P'}
          </div>

          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#8083ff]/20 text-[#c0c1ff] text-xs font-mono mb-1.5">
              <User className="w-3 h-3" />
              <span>{currentUser ? 'PATRON PASS (PATRONS COLLECTION)' : 'GUEST PATRON PASS'}</span>
            </div>

            <h2 className="text-xl font-bold text-[#dae2fd]">
              {currentUser ? currentUser.username : 'Guest Patron'}
            </h2>
            
            {currentUser?.createdAt && (
              <p className="text-xs text-[#c7c4d7] mt-0.5 flex items-center justify-center sm:justify-start gap-1">
                <Calendar className="w-3 h-3 text-[#4edea3]" />
                <span>Patron since {new Date(currentUser.createdAt).toLocaleDateString()}</span>
              </p>
            )}

            <p className="text-[11px] font-mono text-[#8083ff] mt-0.5">
              Patron ID: {currentUser ? currentUser.username : 'guest_session'} (Role: Patron)
            </p>

            <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
              <div className="bg-[#0b1326] px-3.5 py-1.5 rounded-xl border border-[#464554] text-xs flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#ffb95f]" />
                <span className="text-[#c7c4d7]">Active Holds: </span>
                <strong className="text-[#ffb95f] font-bold">{userHolds.length}</strong>
              </div>
              <div className="bg-[#0b1326] px-3.5 py-1.5 rounded-xl border border-[#464554] text-xs flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-[#c0c1ff]" />
                <span className="text-[#c7c4d7]">Waitlists: </span>
                <strong className="text-[#c0c1ff] font-bold">{userWaitlists.length}</strong>
              </div>
            </div>
          </div>

          {/* Login / Logout Action */}
          <div className="shrink-0 pt-2 sm:pt-0">
            {currentUser ? (
              <button
                onClick={onLogout}
                className="bg-[#222a3d] hover:bg-[#93000a]/50 text-[#ffb4ab] border border-[#464554] hover:border-[#ffb4ab]/50 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="bg-[#8083ff] hover:bg-[#c0c1ff] text-[#0d0096] font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Patron Sign In / Register</span>
              </button>
            )}
          </div>
        </div>

        {/* Digital Barcode Strip */}
        <div className="mt-6 pt-4 border-t border-[#464554]/50 flex flex-col items-center gap-1">
          <div className="flex items-center gap-1 h-8 opacity-75">
            {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 3, 4, 1, 2, 1, 3, 2, 4, 1].map((w, i) => (
              <div
                key={i}
                className="bg-[#dae2fd] h-full rounded-sm"
                style={{ width: `${w * 2}px` }}
              />
            ))}
          </div>
          <span className="text-[10px] font-mono text-[#c7c4d7] tracking-widest uppercase">
            PATRON-CARD-{currentUser ? currentUser.username : 'GUEST'}
          </span>
        </div>
      </div>

      {/* Account & Storage Info */}
      <div className="bg-[#171f33] border border-[#464554] rounded-2xl p-5 shadow-lg space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#dae2fd] flex items-center gap-2">
          <Database className="w-4 h-4 text-[#8083ff]" />
          <span>Exclusive Patron Storage</span>
        </h3>
        <p className="text-xs text-[#c7c4d7] leading-relaxed">
          Patron accounts are isolated in the Firestore <code className="text-[#c0c1ff] font-mono">patrons</code> collection and strictly cannot log in to the admin web portal.
        </p>
      </div>

      {/* Active Shelf Location */}
      <div className="bg-[#171f33] border border-[#464554] rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-[#464554]/50">
          <div className="flex items-center gap-2">
            <Library className="w-4 h-4 text-[#4edea3]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#dae2fd]">
              Active Shelf Link
            </h3>
          </div>
          {tableName && (
            <span className="flex items-center gap-1 text-[11px] text-[#4edea3] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse" />
              Live Sync
            </span>
          )}
        </div>

        {tableName ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-[#0b1326] border border-[#464554]">
            <div>
              <div className="text-xs font-semibold text-[#dae2fd]">
                {formatTableName(tableName)}
              </div>
              <div className="text-[11px] font-mono text-[#c7c4d7]">
                Collection: {tableName} • {books.length} books indexed
              </div>
            </div>
            <button
              onClick={onRescanClick}
              className="bg-[#8083ff] hover:bg-[#c0c1ff] text-[#0d0096] font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0 active:scale-95"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Scan QR Code</span>
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-[#0b1326] border border-[#464554] text-center space-y-2">
            <p className="text-xs text-[#c7c4d7]">No shelf connected yet. Scan a shelf QR code to connect.</p>
            <button
              onClick={onRescanClick}
              className="bg-[#8083ff] hover:bg-[#c0c1ff] text-[#0d0096] font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Scan Physical Shelf QR</span>
            </button>
          </div>
        )}

        {tableName && (
          <div className="pt-3 border-t border-[#464554]/40 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-[#c7c4d7]">Need to connect to a different shelf bookcase?</span>
            <div className="flex items-center gap-3">
              {onDisconnectShelf && (
                <button
                  onClick={onDisconnectShelf}
                  className="text-[#ffb4ab] hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              )}
              <button
                onClick={onRescanClick}
                className="text-[#c0c1ff] hover:text-white text-xs font-bold underline flex items-center gap-1"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Scan New Shelf QR</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
