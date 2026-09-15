import React, { useMemo } from 'react';
import { BookItem, ShelfMatrixMeta } from '../types';
import { UserAccount } from '../lib/authService';
import { parseColumnSpan, isColumnOccupied } from '../lib/shelfUtils';
import { ArrowLeft, MapPin, CheckCircle, Clock, Users, Bookmark, AlertCircle } from 'lucide-react';

interface ShelfMatrixCanvasProps {
  selectedBook: BookItem;
  shelfMatrix: ShelfMatrixMeta;
  allBooksOnShelf: BookItem[];
  currentUser: UserAccount | null;
  onBackToSearch: () => void;
  onOpenReservationModal: () => void;
}

export const ShelfMatrixCanvas: React.FC<ShelfMatrixCanvasProps> = ({
  selectedBook,
  shelfMatrix,
  allBooksOnShelf,
  currentUser,
  onBackToSearch,
  onOpenReservationModal,
}) => {
  const targetCols = useMemo(() => {
    return parseColumnSpan(selectedBook.col);
  }, [selectedBook.col]);

  const rowsCount = shelfMatrix.rows || 5;
  const colsCount = shelfMatrix.cols || 10;

  const currentUid = currentUser?.username || '';
  const isUserHolding = currentUid ? selectedBook.reservedBy === currentUid : false;
  const isOtherHolding = !!selectedBook.reservedBy && !isUserHolding;
  const userQueueIndex = currentUid ? selectedBook.queue.indexOf(currentUid) : -1;
  const isInQueue = userQueueIndex !== -1;

  return (
    <div className="flex-1 flex flex-col w-full max-w-4xl mx-auto px-4 py-2 gap-4 pb-28 md:pb-12">
      {/* Top Active Search Bar Header (Image 5) */}
      <div className="flex items-center justify-between bg-[#171f33] border border-[#464554] rounded-2xl p-3 shadow-md">
        <div className="flex items-center gap-3">
          <button
            id="btn-matrix-back"
            onClick={onBackToSearch}
            className="text-[#c0c1ff] hover:bg-[#2d3449] transition-colors p-1.5 rounded-full flex items-center justify-center"
            title="Back to search list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-widest text-[#c7c4d7] uppercase">
              ACTIVE SEARCH
            </span>
            <span className="text-base md:text-lg font-bold text-[#c0c1ff] tracking-tight truncate max-w-[240px] sm:max-w-md">
              {selectedBook.title}
              {selectedBook.author && (
                <span className="text-xs font-normal text-[#dae2fd] ml-1.5 opacity-80">
                  by {selectedBook.author}
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold px-2 py-1 rounded-lg bg-[#0b1326] border border-[#464554] text-[#c0c1ff]">
            {selectedBook.bookId}
          </span>
        </div>
      </div>

      {/* Location Banner (Image 5) */}
      <section
        id="location-highlight-banner"
        className="bg-[#8083ff]/15 border border-[#8083ff]/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 glow-active"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-[#8083ff]/20 border border-[#8083ff]/40 rounded-full flex items-center justify-center shrink-0 shadow-inner">
            <MapPin className="w-6 h-6 text-[#c0c1ff] animate-bounce" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-[#dae2fd] leading-tight">
              Located at Row {selectedBook.row}, Columns {selectedBook.col}
            </h2>
            <p className="text-xs text-[#c7c4d7] mt-0.5">
              Section: <strong className="text-[#dae2fd]">{selectedBook.section}</strong> • Floor: {selectedBook.floor || '2nd Floor North'}
            </p>
          </div>
        </div>

        {/* Action Button for Holds/Waitlist */}
        <button
          id="btn-open-reservation-action"
          onClick={onOpenReservationModal}
          className={`font-bold text-sm py-2.5 px-5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 shrink-0 ${
            isUserHolding
              ? 'bg-[#ca8100] hover:bg-[#ffb95f] text-[#3e2400]'
              : isOtherHolding
              ? 'bg-[#222a3d] hover:bg-[#2d3449] text-[#c0c1ff] border border-[#8083ff]'
              : selectedBook.status === 'Out of Stock'
              ? 'bg-[#2d3449] text-[#c7c4d7] cursor-not-allowed'
              : 'bg-[#8083ff] hover:bg-[#c0c1ff] text-[#0d0096]'
          }`}
        >
          {isUserHolding ? (
            <>
              <Clock className="w-4 h-4" />
              <span>Active Hold (05:00)</span>
            </>
          ) : isOtherHolding ? (
            <>
              <Users className="w-4 h-4 text-[#ffb95f]" />
              <span>{isInQueue ? `In Waitlist (#${userQueueIndex + 1})` : 'Join Waitlist'}</span>
            </>
          ) : selectedBook.status === 'Out of Stock' ? (
            <>
              <AlertCircle className="w-4 h-4 text-[#ffb4ab]" />
              <span>Out of Stock</span>
            </>
          ) : (
            <>
              <Bookmark className="w-4 h-4" />
              <span>Reserve Book</span>
            </>
          )}
        </button>
      </section>

      {/* 2D Bookshelf Grid Matrix Card (Image 5) */}
      <section
        id="bookshelf-matrix-container"
        className="bg-[#2d3449]/70 rounded-2xl border border-[#464554] shadow-2xl flex flex-col overflow-hidden backdrop-blur-md"
      >
        {/* Header with Section name & Legend */}
        <div className="bg-[#171f33] px-4 py-3 border-b border-[#464554] flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm md:text-base font-bold text-[#dae2fd]">
              {selectedBook.section || shelfMatrix.sectionName || 'Shelf Matrix'}
            </h3>
            <span className="text-[10px] font-mono bg-[#0b1326] px-2 py-0.5 rounded text-[#c7c4d7]">
              {rowsCount} Rows × {colsCount} Columns
            </span>
          </div>

          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#171f33] border border-[#464554]" />
              <span className="text-[11px] font-semibold text-[#c7c4d7]">Empty / Other</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#8083ff] pulse-border" />
              <span className="text-[11px] font-bold text-[#c0c1ff]">Target Shelf Slot</span>
            </div>
          </div>
        </div>

        {/* Matrix Canvas Rendering */}
        <div className="w-full overflow-x-auto p-4 md:p-6 bg-[#060e20]/60">
          <div className="flex flex-col gap-6 min-w-[560px] pb-2">
            {Array.from({ length: rowsCount }, (_, rIdx) => {
              const rowNum = rIdx + 1;
              const isTargetRow = rowNum === selectedBook.row;

              return (
                <div key={`row-${rowNum}`} className="flex flex-col">
                  <div className="flex items-end gap-1.5 px-2 pb-1">
                    {/* Row Label (e.g. R1, R2, R3) */}
                    <div
                      className={`w-8 font-mono text-xs font-bold text-right mr-2 mb-3 shrink-0 ${
                        isTargetRow ? 'text-[#c0c1ff]' : 'text-[#c7c4d7]'
                      }`}
                    >
                      R{rowNum}
                    </div>

                    {/* Columns in this Row */}
                    <div className="flex gap-1.5 flex-1 items-end">
                      {Array.from({ length: colsCount }, (_, cIdx) => {
                        const colNum = cIdx + 1;
                        const isTargetSlot = isTargetRow && isColumnOccupied(colNum, selectedBook.col);

                        // Find if another book resides in this slot for realistic visual richness
                        const otherBook = allBooksOnShelf.find(
                          (b) => b.row === rowNum && isColumnOccupied(colNum, b.col)
                        );

                        if (isTargetSlot) {
                          const isFirstTargetCol = colNum === targetCols[0];
                          const isLastTargetCol = colNum === targetCols[targetCols.length - 1];
                          // Put the "HERE" pointer tag on the middle or first target column
                          const showHereTag =
                            colNum === targetCols[Math.floor((targetCols.length - 1) / 2)] ||
                            (targetCols.length === 1 && colNum === targetCols[0]);

                          return (
                            <div
                              key={`slot-${rowNum}-${colNum}`}
                              className={`h-24 flex-1 min-w-[36px] max-w-[56px] bg-[#8083ff] border-y-2 border-[#dae2fd] ${
                                isFirstTargetCol ? 'border-l-2 rounded-l-md' : ''
                              } ${
                                isLastTargetCol ? 'border-r-2 rounded-r-md' : ''
                              } pulse-border flex flex-col items-center justify-between relative cursor-pointer hover:bg-[#c0c1ff] transition-all book-spine z-10 group`}
                              onClick={onOpenReservationModal}
                            >
                              {/* Bouncing "📌 HERE" Location Pin Marker (Image 5 exact design) */}
                              {showHereTag && (
                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#dae2fd] text-[#0b1326] text-[10px] font-extrabold px-2.5 py-0.5 rounded shadow-lg whitespace-nowrap z-20 animate-bounce flex items-center gap-0.5 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-[5px] after:border-transparent after:border-t-[#dae2fd]">
                                  <span>📌 HERE</span>
                                </div>
                              )}

                              {/* Realistic Book Spine visual ribbons */}
                              <div className="w-full h-1.5 bg-white/30" />
                              <div className="text-[9px] font-mono font-bold text-[#0d0096] rotate-90 whitespace-nowrap">
                                {selectedBook.bookId}
                              </div>
                              <div className="w-full h-1.5 bg-white/30" />

                              {/* Hover Tooltip */}
                              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#0b1326] border border-[#8083ff] text-[#dae2fd] rounded-lg px-2.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30 text-xs shadow-xl font-medium">
                                Col {colNum} • {selectedBook.title}
                              </div>
                            </div>
                          );
                        }

                        // Inactive / Other Book Slots (Muted Slate with book spines)
                        // Distinct variation in height & opacity to mimic authentic physical bookshelves
                        const heightVariants = ['h-16', 'h-20', 'h-18', 'h-22', 'h-14'];
                        const spineHeight = heightVariants[(rowNum * 7 + colNum * 3) % heightVariants.length];
                        const isOccupiedByOther = !!otherBook;

                        return (
                          <div
                            key={`slot-${rowNum}-${colNum}`}
                            className={`flex-1 min-w-[36px] max-w-[56px] ${spineHeight} ${
                              isOccupiedByOther
                                ? 'bg-[#222a3d] border border-[#464554] opacity-50'
                                : 'bg-[#171f33] border border-[#464554]/40 opacity-25'
                            } rounded-sm flex flex-col items-center justify-between py-1 book-spine transition-all hover:opacity-80 group relative`}
                          >
                            <div className="w-full h-0.5 bg-white/10" />
                            <div className="font-mono text-[8px] text-[#c7c4d7] rotate-90">
                              {colNum}
                            </div>
                            <div className="w-full h-0.5 bg-white/10" />

                            {/* Tooltip on non-target slot */}
                            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-[#0b1326] border border-[#464554] text-[#c7c4d7] rounded px-2 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 text-[10px]">
                              {isOccupiedByOther ? `R${rowNum}:C${colNum} - ${otherBook.title}` : `Row ${rowNum}, Col ${colNum} (Slot)`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Authentic Wood / Metal Shelf Texture Rail (Matching Image 5) */}
                  <div
                    className="w-full h-4 shelf-texture rounded-sm ml-10 shadow-md"
                    style={{ width: 'calc(100% - 2.5rem)' }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Floating Bottom Status Bar (Contextual to selected book - Image 5) */}
      <div
        id="floating-matrix-status-bar"
        className="fixed bottom-[74px] md:bottom-6 left-1/2 transform -translate-x-1/2 bg-[#171f33] border border-[#464554] rounded-full py-2 px-5 shadow-2xl flex items-center gap-2.5 z-40 max-w-[90vw] backdrop-blur-lg"
      >
        <span className="relative flex h-3 w-3">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              selectedBook.qty > 0 ? 'bg-[#4edea3]' : 'bg-[#ffb4ab]'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-3 w-3 ${
              selectedBook.qty > 0 ? 'bg-[#4edea3]' : 'bg-[#ffb4ab]'
            }`}
          />
        </span>
        <span className="text-xs md:text-sm font-semibold text-[#dae2fd] whitespace-nowrap">
          {selectedBook.qty > 0
            ? `${selectedBook.qty} copies available in this shelf slot`
            : 'Out of Stock on shelf'}
        </span>
        {selectedBook.reservedBy && (
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#3e2400] text-[#ffddb8] border border-[#ffb95f]/40">
            {isUserHolding ? 'Held by You' : '1 Active Hold'}
          </span>
        )}
      </div>
    </div>
  );
};
