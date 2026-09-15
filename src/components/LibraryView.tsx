import React, { useState } from 'react';
import { BookItem } from '../types';
import { UserAccount } from '../lib/authService';
import { formatTimerSeconds, formatTableName } from '../lib/shelfUtils';
import { Bookmark, Users, MapPin, Clock, ArrowRight, BookOpen, LogIn, QrCode } from 'lucide-react';

interface LibraryViewProps {
  books: BookItem[];
  tableName: string | null;
  currentUser: UserAccount | null;
  onSelectBook: (book: BookItem) => void;
  onOpenReservationModal: (book: BookItem) => void;
  onOpenAuth: () => void;
  onRescanClick: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  books,
  tableName,
  currentUser,
  onSelectBook,
  onOpenReservationModal,
  onOpenAuth,
  onRescanClick,
}) => {
  const [activeTab, setActiveTab] = useState<'my_holds' | 'all_catalog'>('my_holds');
  const [, setTick] = useState<number>(0);

  // Live 1-second tick to update countdown timers on active hold cards
  React.useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentUid = currentUser?.username || '';
  // Patron's active holds
  const myHolds = currentUid ? books.filter((b) => b.reservedBy === currentUid) : [];

  // Patron's waitlisted books
  const myWaitlist = currentUid ? books.filter((b) => b.queue.includes(currentUid)) : [];

  // If no shelf is connected
  if (!tableName) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-12 max-w-md mx-auto space-y-5">
        <div className="w-20 h-20 rounded-3xl bg-[#171f33] border-2 border-[#8083ff]/40 flex items-center justify-center shadow-xl">
          <QrCode className="w-10 h-10 text-[#8083ff]" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-[#dae2fd]">No Shelf Connected</h2>
          <p className="text-xs text-[#c7c4d7]">
            Please scan a shelf QR code to view live holds and current shelf inventory.
          </p>
        </div>
        <button
          onClick={onRescanClick}
          className="bg-[#8083ff] hover:bg-[#c0c1ff] text-[#0d0096] font-bold px-6 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-lg"
        >
          <QrCode className="w-4 h-4" />
          <span>Scan Shelf QR</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col w-full max-w-3xl mx-auto px-4 py-3 gap-4 pb-28 md:pb-12 overflow-y-auto">
      {/* Header & Subtabs */}
      <div className="flex justify-between items-center bg-[#171f33] border border-[#464554] rounded-2xl p-2">
        <button
          id="btn-subtab-holds"
          onClick={() => setActiveTab('my_holds')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'my_holds'
              ? 'bg-[#8083ff] text-[#0d0096] shadow-md'
              : 'text-[#c7c4d7] hover:text-white'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>My Holds & Waitlist ({myHolds.length + myWaitlist.length})</span>
        </button>

        <button
          id="btn-subtab-catalog"
          onClick={() => setActiveTab('all_catalog')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'all_catalog'
              ? 'bg-[#8083ff] text-[#0d0096] shadow-md'
              : 'text-[#c7c4d7] hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Shelf Inventory ({books.length})</span>
        </button>
      </div>

      {/* TAB 1: MY HOLDS & WAITLIST */}
      {activeTab === 'my_holds' && (
        <div className="space-y-4">
          {!currentUser && (
            <div className="bg-[#171f33] border border-[#8083ff]/40 rounded-2xl p-5 text-center flex flex-col items-center">
              <LogIn className="w-8 h-8 text-[#8083ff] mb-2" />
              <h3 className="text-sm font-bold text-[#dae2fd]">Sign in as a Patron to track holds</h3>
              <p className="text-xs text-[#c7c4d7] max-w-sm mt-1 mb-4">
                Sign in with your patron account to reserve books, hold items for 5 minutes, and join waiting queues.
              </p>
              <button
                onClick={onOpenAuth}
                className="bg-[#8083ff] hover:bg-[#c0c1ff] text-[#0d0096] font-bold py-2 px-5 rounded-xl text-xs shadow-md transition-transform active:scale-95"
              >
                Sign In / Create Account
              </button>
            </div>
          )}

          {/* Active Holds Section */}
          <div>
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="w-2 h-2 rounded-full bg-[#ffb95f]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#dae2fd]">
                Active 5-Minute Holds ({myHolds.length})
              </h2>
            </div>

            {myHolds.length === 0 ? (
              <div className="bg-[#171f33] border border-[#464554] rounded-2xl p-6 text-center text-[#c7c4d7]">
                <Clock className="w-8 h-8 text-[#8083ff] mx-auto mb-2 opacity-60" />
                <p className="text-sm font-semibold text-[#dae2fd]">No active reservations</p>
                <p className="text-xs mt-0.5">
                  Select a book from search or shelf map to place a 5-minute hold.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {myHolds.map((book) => {
                  const diff = book.holdExpiresAt
                    ? Math.max(0, Math.floor((book.holdExpiresAt - Date.now()) / 1000))
                    : 300;
                  const { formatted } = formatTimerSeconds(diff);

                  return (
                    <div
                      key={book.bookId}
                      className="bg-[#171f33] border border-[#ffb95f]/50 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row justify-between sm:items-center gap-3 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[#ffb95f]/5 rounded-full blur-xl pointer-events-none" />

                      <div className="flex items-start gap-3">
                        <div className="w-12 h-14 rounded-xl bg-[#222a3d] border border-[#ffb95f]/40 flex flex-col items-center justify-center shrink-0">
                          <span className="text-[10px] text-[#ffddb8] font-mono font-bold">R{book.row}</span>
                          <span className="text-xs text-[#dae2fd] font-mono">C{book.col}</span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#3e2400] text-[#ffddb8] border border-[#ffb95f]/30">
                              ACTIVE HOLD
                            </span>
                            <span className="text-xs text-[#c7c4d7]">{book.bookId}</span>
                          </div>
                          <h3 className="text-sm md:text-base font-bold text-[#dae2fd] mt-0.5">
                            {book.title}
                          </h3>
                          <p className="text-xs text-[#c7c4d7]">Section: {book.section}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#464554]/40">
                        {/* Countdown Pill */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0b1326] border border-[#ffb95f]/40 font-mono text-sm font-bold text-[#ffb95f]">
                          <Clock className="w-3.5 h-3.5 animate-spin text-[#ffb95f]" />
                          <span>{formatted}</span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => onSelectBook(book)}
                            className="bg-[#8083ff] hover:bg-[#c0c1ff] text-[#0d0096] px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-transform active:scale-95 flex items-center gap-1"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Locate</span>
                          </button>
                          <button
                            onClick={() => onOpenReservationModal(book)}
                            className="bg-[#222a3d] hover:bg-[#2d3449] text-[#dae2fd] border border-[#464554] px-2.5 py-1.5 rounded-xl text-xs font-semibold"
                          >
                            Manage
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Waitlisted Books Section */}
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="w-2 h-2 rounded-full bg-[#8083ff]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#dae2fd]">
                Waitlist Positions ({myWaitlist.length})
              </h2>
            </div>

            {myWaitlist.length === 0 ? (
              <div className="bg-[#171f33] border border-[#464554] rounded-2xl p-6 text-center text-[#c7c4d7]">
                <Users className="w-8 h-8 text-[#8083ff] mx-auto mb-2 opacity-60" />
                <p className="text-sm font-semibold text-[#dae2fd]">No active waitlists</p>
                <p className="text-xs mt-0.5">
                  When a book is held by another patron, you can queue in line for the next available slot.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {myWaitlist.map((book) => {
                  const queuePos = book.queue.indexOf(currentUid) + 1;
                  return (
                    <div
                      key={book.bookId}
                      className="bg-[#171f33] border border-[#8083ff]/40 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row justify-between sm:items-center gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-14 rounded-xl bg-[#0b1326] border border-[#8083ff]/40 flex flex-col items-center justify-center shrink-0">
                          <span className="text-[10px] text-[#c0c1ff] font-mono">QUEUE</span>
                          <span className="text-sm font-mono font-bold text-[#c0c1ff]">#{queuePos}</span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#1b243b] text-[#c0c1ff] border border-[#8083ff]/30">
                              WAITLIST #{queuePos} OF {book.queue.length}
                            </span>
                            <span className="text-xs text-[#c7c4d7]">{book.bookId}</span>
                          </div>
                          <h3 className="text-sm md:text-base font-bold text-[#dae2fd] mt-0.5">
                            {book.title}
                          </h3>
                          <p className="text-xs text-[#c7c4d7]">
                            Current holder: {book.reservedBy || 'None'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#464554]/40">
                        <button
                          onClick={() => onSelectBook(book)}
                          className="bg-[#222a3d] hover:bg-[#2d3449] text-[#dae2fd] border border-[#464554] px-3 py-1.5 rounded-xl text-xs font-semibold"
                        >
                          View Shelf
                        </button>
                        <button
                          onClick={() => onOpenReservationModal(book)}
                          className="bg-[#8083ff] hover:bg-[#c0c1ff] text-[#0d0096] px-3 py-1.5 rounded-xl text-xs font-bold"
                        >
                          Queue Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SHELF STACKS INVENTORY */}
      {activeTab === 'all_catalog' && (
        <div className="space-y-2">
          {books.length === 0 ? (
            <div className="bg-[#171f33] border border-[#464554] rounded-2xl p-6 text-center text-[#c7c4d7]">
              <p className="text-sm font-semibold text-[#dae2fd]">No books on this shelf yet</p>
            </div>
          ) : (
            books.map((book) => (
              <div
                key={book.bookId}
                onClick={() => onSelectBook(book)}
                className="bg-[#171f33] border border-[#464554] hover:border-[#8083ff] rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all group shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0b1326] border border-[#464554] flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-mono font-bold text-[#c0c1ff]">R{book.row}</span>
                    <span className="text-[9px] font-mono text-[#c7c4d7]">C{book.col}</span>
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#dae2fd] group-hover:text-[#c0c1ff] transition-colors">
                      {book.title}
                    </h4>
                    <p className="text-[11px] text-[#c7c4d7]">{book.author} • {book.bookId}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      book.status === 'Available'
                        ? 'bg-[#002113] text-[#4edea3] border-[#4edea3]/30'
                        : book.status === 'Reserved'
                        ? 'bg-[#3e2400] text-[#ffb95f] border-[#ffb95f]/30'
                        : 'bg-[#370001] text-[#ffb4ab] border-[#ffb4ab]/30'
                    }`}
                  >
                    {book.status}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#c7c4d7] group-hover:text-[#c0c1ff] group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
