import React, { useState, useEffect } from 'react';
import { BookItem } from '../types';
import { UserAccount } from '../lib/authService';
import { formatTimerSeconds } from '../lib/shelfUtils';
import {
  reserveBookTransaction,
  cancelOrExpireReservationTransaction,
  joinWaitlistTransaction,
  leaveWaitlistTransaction,
} from '../lib/firestoreService';
import {
  X,
  Clock,
  MapPin,
  Bookmark,
  Users,
  Footprints,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
  RotateCcw,
  LogIn,
} from 'lucide-react';

interface ReservationModalProps {
  book: BookItem;
  tableName: string;
  currentUser: UserAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: () => void;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  book,
  tableName,
  currentUser,
  isOpen,
  onClose,
  onOpenAuth,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300);

  const currentUid = currentUser?.username || '';
  const isHolding = currentUid ? book.reservedBy === currentUid : false;
  const isOtherHolding = !!book.reservedBy && !isHolding;
  const userQueueIndex = currentUid ? book.queue.indexOf(currentUid) : -1;
  const isInQueue = userQueueIndex !== -1;

  // Real-time countdown calculation based on holdExpiresAt or default 300s
  useEffect(() => {
    if (book.status !== 'Reserved' || !book.holdExpiresAt) return;

    const computeSeconds = () => {
      if (book.holdExpiresAt) {
        const diff = Math.max(0, Math.floor((book.holdExpiresAt - Date.now()) / 1000));
        return diff;
      }
      return 300;
    };

    setSecondsRemaining(computeSeconds());

    const interval = setInterval(() => {
      const remaining = computeSeconds();
      setSecondsRemaining(remaining);

      // Auto-expire when timer hits 0
      if (remaining <= 0) {
        clearInterval(interval);
        handleAutoExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [book.holdExpiresAt, book.status, book.reservedBy]);

  // Handle auto-expiry in Firestore
  const handleAutoExpire = async () => {
    try {
      console.log('Reservation timer expired for', book.bookId);
      await cancelOrExpireReservationTransaction(tableName, book.bookId);
      setFeedback({
        type: 'error',
        message: '5-minute hold time elapsed. The reservation has been released/transferred to next patron.',
      });
    } catch (err) {
      console.error('Auto-expire failed:', err);
    }
  };

  if (!isOpen) return null;

  // 1. Direct Hold Reserve Action
  const handleReserve = async () => {
    if (!currentUid) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    setLoading(true);
    setFeedback(null);
    try {
      const res = await reserveBookTransaction(tableName, book.bookId, currentUid);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Hold failed.' });
    } finally {
      setLoading(false);
    }
  };

  // 2. Cancel Reservation
  const handleCancelHold = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await cancelOrExpireReservationTransaction(tableName, book.bookId);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Cancel failed.' });
    } finally {
      setLoading(false);
    }
  };

  // 3. Join Waitlist
  const handleJoinWaitlist = async () => {
    if (!currentUid) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    setLoading(true);
    setFeedback(null);
    try {
      const res = await joinWaitlistTransaction(tableName, book.bookId, currentUid);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Waitlist join failed.' });
    } finally {
      setLoading(false);
    }
  };

  // 4. Leave Waitlist
  const handleLeaveWaitlist = async () => {
    if (!currentUid) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await leaveWaitlistTransaction(tableName, book.bookId, currentUid);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Waitlist leave failed.' });
    } finally {
      setLoading(false);
    }
  };

  const { minutes, seconds } = formatTimerSeconds(secondsRemaining);
  const circumference = 339.29;
  const progressRatio = Math.min(1, Math.max(0, secondsRemaining / 300));
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Dimmer Scrim */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Bottom Sheet Modal Container */}
      <div
        id="reservation-bottom-sheet"
        className="relative w-full max-w-xl bg-[#171f33] border-t border-[#464554] rounded-t-[32px] shadow-[0_-8px_36px_rgba(0,0,0,0.6)] z-50 flex flex-col max-h-[85vh] overflow-hidden"
      >
        {/* Drag Handle Bar */}
        <div className="w-full flex justify-center pt-3 pb-1 cursor-grab" onClick={onClose}>
          <div className="w-12 h-1.5 bg-[#464554] rounded-full hover:bg-[#8083ff] transition-colors" />
        </div>

        {/* Modal Header Controls */}
        <div className="flex justify-between items-center px-6 pt-2 pb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#c7c4d7]">
            Hold & Queue Manager
          </span>
          <button
            onClick={onClose}
            className="text-[#c7c4d7] hover:text-white p-1 rounded-full hover:bg-[#2d3449] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="px-6 pb-8 overflow-y-auto space-y-4">
          {/* Header */}
          <div className="flex gap-4 items-start bg-[#0b1326]/60 p-4 rounded-2xl border border-[#464554]">
            <div className="w-16 h-20 rounded-xl bg-[#222a3d] border border-[#8083ff]/40 flex flex-col items-center justify-between p-1.5 shrink-0 shadow-inner">
              <span className="text-[9px] font-mono text-[#c0c1ff] font-bold">R{book.row}</span>
              <span className="material-symbols-outlined text-[26px] text-[#c0c1ff]">book</span>
              <span className="text-[8px] font-mono text-[#c7c4d7]">C{book.col}</span>
            </div>

            <div className="flex-1 flex flex-col">
              <span className="text-[10px] font-mono font-bold text-[#8083ff] uppercase">
                {book.bookId}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-[#dae2fd] leading-tight">
                {book.title}
              </h2>
              <p className="text-xs text-[#c7c4d7] mb-2">by {book.author || 'Unknown'}</p>

              <div className="flex flex-wrap gap-1.5">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#2d3449] rounded-md border border-[#464554] text-[11px] font-mono text-[#dae2fd]">
                  <MapPin className="w-3 h-3 text-[#c0c1ff]" />
                  <span>Row {book.row}, Col {book.col}</span>
                </div>

                <div className="inline-flex items-center px-2.5 py-0.5 bg-[#2d3449] rounded-md border border-[#464554] text-[11px] font-bold text-[#dae2fd]">
                  <span>Qty: {book.qty}</span>
                </div>

                <div className="inline-flex items-center px-2 py-0.5 bg-[#171f33] rounded-md border border-[#464554] text-[10px] text-[#c7c4d7]">
                  <span>{book.section}</span>
                </div>
              </div>
            </div>
          </div>

          {!currentUser && (
            <div className="p-3.5 rounded-2xl bg-[#0b1326] border border-[#8083ff]/40 flex items-center justify-between gap-3">
              <div className="text-xs text-[#c7c4d7]">
                <strong className="text-[#dae2fd] block">Not signed in</strong>
                <span>Sign in with your patron username to place holds.</span>
              </div>
              <button
                onClick={() => {
                  onClose();
                  if (onOpenAuth) onOpenAuth();
                }}
                className="bg-[#8083ff] hover:bg-[#c0c1ff] text-[#0d0096] font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            </div>
          )}

          {/* Feedback Message Banner */}
          {feedback && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-[#002113] border-[#4edea3] text-[#6ffbbe]'
                  : 'bg-[#93000a]/20 border-[#ffb4ab] text-[#ffdad6]'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0 text-[#4edea3]" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-[#ffb4ab]" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* STATE A: PATRON CURRENTLY HOLDS THIS BOOK (IMAGE 7 SPEC) */}
          {isHolding && (
            <div className="flex flex-col items-center py-2 space-y-4">
              {/* Radial Countdown Clock Display */}
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="#222a3d"
                    strokeWidth="8"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="#ffb95f"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>

                <div className="absolute flex flex-col items-center justify-center text-center">
                  <div className="text-3xl sm:text-4xl font-extrabold font-mono text-[#ffddb8] tracking-wider leading-none">
                    {minutes}:{seconds}
                  </div>
                  <span className="text-[10px] uppercase font-bold text-[#c7c4d7] tracking-widest mt-1">
                    Hold Time Remaining
                  </span>
                </div>
              </div>

              {/* Retrieval Notice & Instructions */}
              <div className="bg-[#3e2400]/40 border border-[#ffb95f]/30 rounded-2xl p-4 w-full text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#ffddb8]">
                  <Footprints className="w-4 h-4 text-[#ffb95f]" />
                  <span>Physical Retrieval in Progress</span>
                </div>
                <p className="text-xs text-[#c7c4d7] leading-relaxed">
                  Head to <strong>Row {book.row}, Col {book.col}</strong> to collect this book.
                  The matrix slot is locked in yellow for you.
                </p>
              </div>

              {/* Cancel Hold Button */}
              <button
                onClick={handleCancelHold}
                disabled={loading}
                className="w-full bg-[#222a3d] hover:bg-[#32394e] text-[#ffb4ab] border border-[#ffb4ab]/40 font-bold py-3 px-4 rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Cancel Reservation & Release Hold</span>
              </button>
            </div>
          )}

          {/* STATE B: BOOK IS AVAILABLE FOR HOLD */}
          {!isHolding && !isOtherHolding && book.status === 'Available' && (
            <div className="space-y-4 pt-2">
              <div className="bg-[#002113] border border-[#4edea3]/40 rounded-2xl p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#4edea3] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-[#6ffbbe] block mb-0.5">
                    Ready for 5-Minute Hold
                  </span>
                  <p className="text-[#c7c4d7] leading-relaxed">
                    Reserving locks the item for 5 minutes in Firestore so other patrons know you
                    are walking to the shelf.
                  </p>
                </div>
              </div>

              <button
                id="btn-confirm-hold"
                onClick={handleReserve}
                disabled={loading}
                className="w-full bg-[#8083ff] hover:bg-[#c0c1ff] text-[#0d0096] font-extrabold py-3.5 px-6 rounded-2xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-[#0d0096] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    <span>Place 5-Minute Hold</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* STATE C: HELD BY ANOTHER PATRON -> WAITLIST OPTION */}
          {!isHolding && (isOtherHolding || book.status === 'Reserved') && (
            <div className="space-y-4 pt-2">
              <div className="bg-[#3e2400]/40 border border-[#ffb95f]/40 rounded-2xl p-4 flex items-start gap-3">
                <Users className="w-5 h-5 text-[#ffb95f] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-[#ffddb8] block mb-0.5">
                    Currently Held by Patron ({book.reservedBy || 'Active Patron'})
                  </span>
                  <p className="text-[#c7c4d7] leading-relaxed">
                    Another patron is retrieving this book. If their 5-minute timer expires, the hold will automatically transfer to the first person in queue.
                  </p>
                </div>
              </div>

              {/* Waiting Queue List */}
              <div className="bg-[#0b1326] p-3 rounded-2xl border border-[#464554] space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-[#c7c4d7]">Queue Length:</span>
                  <span className="text-[#c0c1ff] font-bold">{book.queue.length} patrons waiting</span>
                </div>
                {isInQueue && (
                  <div className="p-2 bg-[#8083ff]/15 rounded-xl border border-[#8083ff]/40 text-xs font-semibold text-[#c0c1ff] flex items-center justify-between">
                    <span>Your Position:</span>
                    <span className="font-mono font-bold text-sm">#{userQueueIndex + 1} in Line</span>
                  </div>
                )}
              </div>

              {isInQueue ? (
                <button
                  onClick={handleLeaveWaitlist}
                  disabled={loading}
                  className="w-full bg-[#222a3d] hover:bg-[#32394e] text-[#ffb4ab] border border-[#ffb4ab]/40 font-bold py-3 px-4 rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Leave Waitlist</span>
                </button>
              ) : (
                <button
                  onClick={handleJoinWaitlist}
                  disabled={loading}
                  className="w-full bg-[#8083ff] hover:bg-[#c0c1ff] text-[#0d0096] font-bold py-3.5 px-6 rounded-2xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  <Users className="w-4 h-4" />
                  <span>Join Next-in-Line Waitlist</span>
                </button>
              )}
            </div>
          )}

          {/* STATE D: OUT OF STOCK */}
          {!isHolding && !isOtherHolding && book.status === 'Out of Stock' && (
            <div className="p-4 rounded-2xl bg-[#370001]/40 border border-[#ffb4ab]/40 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-[#ffb4ab] mx-auto" />
              <h3 className="text-sm font-bold text-[#ffdad6]">Currently Out of Stock</h3>
              <p className="text-xs text-[#c7c4d7]">
                All copies for this title are currently checked out. Please check back later.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
