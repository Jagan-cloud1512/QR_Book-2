import React, { useState, useMemo } from 'react';
import { BookItem, BookStatus } from '../types';
import { formatTableName } from '../lib/shelfUtils';
import {
  Search,
  X,
  Clock,
  CheckCircle,
  ChevronRight,
  BookOpen,
  QrCode,
  AlertCircle,
  MapPin,
} from 'lucide-react';

interface SearchViewProps {
  books: BookItem[];
  tableName: string | null;
  onSelectBook: (book: BookItem) => void;
  onRescanClick: () => void;
  selectedBookId?: string | null;
  onTableSelected?: (tableName: string) => void;
}

type FilterStatus = 'All' | 'Available' | 'Reserved' | 'Out of Stock';

export const SearchView: React.FC<SearchViewProps> = ({
  books,
  tableName,
  onSelectBook,
  onRescanClick,
  selectedBookId,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('All');

  // Filtered books
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      // Status filter
      if (statusFilter !== 'All' && book.status !== statusFilter) {
        return false;
      }

      // Search query filter (title, bookId, author, isbn, section)
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const matchTitle = book.title.toLowerCase().includes(q);
      const matchId = book.bookId.toLowerCase().includes(q);
      const matchAuthor = (book.author || '').toLowerCase().includes(q);
      const matchIsbn = (book.isbn || '').toLowerCase().includes(q);
      const matchSection = (book.section || '').toLowerCase().includes(q);

      return matchTitle || matchId || matchAuthor || matchIsbn || matchSection;
    });
  }, [books, searchQuery, statusFilter]);

  const hasSearch = searchQuery.trim().length > 0;
  const isFiltering = statusFilter !== 'All';

  // GATE: If no shelf is connected, require scanning QR code first
  if (!tableName) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-12 max-w-md mx-auto space-y-5">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <div className="absolute inset-0 bg-[#8083ff]/15 rounded-full blur-2xl pointer-events-none" />
          <div className="w-24 h-24 bg-[#171f33] border-2 border-[#8083ff]/40 rounded-3xl flex items-center justify-center shadow-xl">
            <QrCode className="w-12 h-12 text-[#8083ff]" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-[#dae2fd] tracking-tight">
            Scan a Shelf QR Code First
          </h2>
          <p className="text-xs sm:text-sm text-[#c7c4d7] leading-relaxed">
            To view catalog inventory and find book locations, scan the QR code located on any physical shelf or bookcase stack in the library.
          </p>
        </div>

        <button
          id="btn-gate-scan-qr"
          onClick={onRescanClick}
          className="bg-[#8083ff] hover:bg-[#c0c1ff] text-[#0d0096] font-extrabold px-6 py-3.5 rounded-2xl text-sm shadow-xl flex items-center gap-2 transition-transform active:scale-95"
        >
          <QrCode className="w-4 h-4" />
          <span>Scan Physical Shelf QR</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col w-full max-w-3xl mx-auto px-4 pt-2 pb-24 md:pb-8 gap-5 overflow-y-auto">
      {/* Header Controls Section */}
      <section className="flex flex-col gap-3">
        {/* Connected Shelf Header Indicator */}
        <div className="flex items-center justify-between bg-[#171f33] border border-[#464554] px-4 py-2 rounded-2xl">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse" />
            <span className="text-xs font-mono text-[#dae2fd]">
              Active Stack: <strong className="text-[#c0c1ff]">{formatTableName(tableName)}</strong>
            </span>
          </div>
          <button
            onClick={onRescanClick}
            className="text-[11px] font-bold text-[#8083ff] hover:text-[#c0c1ff] flex items-center gap-1"
          >
            <QrCode className="w-3 h-3" />
            <span>Switch Shelf</span>
          </button>
        </div>

        {/* Search Control */}
        <div
          id="search-input-container"
          className="bg-[#171f33] rounded-2xl border border-[#464554] p-1 shadow-sm focus-within:border-[#8083ff] focus-within:ring-2 focus-within:ring-[#8083ff]/30 transition-all flex items-center gap-2 relative z-10 group"
        >
          <Search className="w-5 h-5 text-[#c7c4d7] pl-3 shrink-0 group-focus-within:text-[#c0c1ff] transition-colors" />
          <input
            id="book-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, author, or Book ID (e.g. LIB-1001)..."
            spellCheck={false}
            autoComplete="off"
            className="w-full bg-transparent border-none text-[#dae2fd] placeholder:text-[#c7c4d7] focus:ring-0 text-sm md:text-base h-11 outline-none font-medium"
          />
          {searchQuery && (
            <button
              id="btn-clear-search"
              aria-label="Clear Search"
              onClick={() => setSearchQuery('')}
              className="pr-3 text-[#c7c4d7] hover:text-[#dae2fd] transition-colors flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar relative z-0">
          {(['All', 'Available', 'Reserved', 'Out of Stock'] as FilterStatus[]).map((status) => {
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                id={`filter-${status.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setStatusFilter(status)}
                className={`whitespace-nowrap font-bold text-xs px-4 py-2 rounded-full border transition-all flex-shrink-0 active:scale-95 ${
                  isActive
                    ? 'bg-[#8083ff] text-[#0d0096] border-transparent shadow-md'
                    : 'bg-[#222a3d] text-[#c7c4d7] border-[#464554] hover:bg-[#2d3449] hover:text-[#dae2fd]'
                }`}
              >
                {status}
                {status !== 'All' && (
                  <span className="ml-1.5 opacity-80 text-[10px]">
                    ({books.filter((b) => b.status === status).length})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* When shelf is empty in Firestore */}
      {books.length === 0 && (
        <section className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#171f33] border border-[#464554] rounded-3xl my-4 space-y-3">
          <BookOpen className="w-10 h-10 text-[#8083ff] opacity-60" />
          <h3 className="text-base font-bold text-[#dae2fd]">No Books Found on this Shelf</h3>
          <p className="text-xs text-[#c7c4d7] max-w-sm">
            The collection <code className="font-mono text-[#c0c1ff]">{tableName}</code> is currently empty in Firestore.
          </p>
          <button
            onClick={onRescanClick}
            className="bg-[#222a3d] hover:bg-[#2d3449] text-[#dae2fd] border border-[#464554] font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Scan Another Shelf</span>
          </button>
        </section>
      )}

      {/* Search Empty State */}
      {books.length > 0 && !hasSearch && !isFiltering && (
        <section
          id="search-empty-state-canvas"
          className="flex-1 flex flex-col items-center justify-center text-center mt-4 relative min-h-[220px]"
        >
          <div className="w-16 h-16 bg-[#171f33] border border-[#464554] rounded-2xl flex items-center justify-center shadow-lg mb-3">
            <Search className="w-8 h-8 text-[#8083ff]" />
          </div>

          <h2 className="text-base sm:text-lg font-bold text-[#dae2fd] mb-1 max-w-sm leading-tight">
            Search or select any title below
          </h2>
          <p className="text-xs text-[#c7c4d7] max-w-xs mb-4">
            {books.length} titles currently indexed on this shelf.
          </p>
        </section>
      )}

      {/* Filter / Search Results List */}
      {filteredBooks.length > 0 ? (
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-mono uppercase tracking-wider text-[#c7c4d7]">
              {hasSearch || isFiltering ? `Results (${filteredBooks.length})` : `All Books on Shelf (${books.length})`}
            </span>
          </div>

          <div className="space-y-2.5">
            {filteredBooks.map((book) => {
              const isSelected = selectedBookId === book.bookId;
              const isAvailable = book.status === 'Available';
              const isReserved = book.status === 'Reserved';

              return (
                <div
                  key={book.bookId}
                  id={`book-card-${book.bookId}`}
                  onClick={() => onSelectBook(book)}
                  className={`bg-[#171f33] border rounded-2xl p-4 shadow-md hover:border-[#8083ff] transition-all cursor-pointer group flex flex-col sm:flex-row justify-between sm:items-center gap-3 ${
                    isSelected ? 'border-[#8083ff] ring-2 ring-[#8083ff]/30' : 'border-[#464554]'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-14 rounded-xl bg-[#0b1326] border border-[#464554] flex flex-col items-center justify-center shrink-0 group-hover:border-[#8083ff] transition-colors">
                      <span className="text-[10px] font-mono font-bold text-[#c0c1ff]">
                        R{book.row}
                      </span>
                      <span className="text-[9px] font-mono text-[#c7c4d7]">
                        C{book.col}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-[#8083ff]">
                          {book.bookId}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isAvailable
                              ? 'bg-[#002113] text-[#4edea3] border-[#4edea3]/30'
                              : isReserved
                              ? 'bg-[#3e2400] text-[#ffb95f] border-[#ffb95f]/30'
                              : 'bg-[#370001] text-[#ffb4ab] border-[#ffb4ab]/30'
                          }`}
                        >
                          {book.status}
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-[#dae2fd] group-hover:text-[#c0c1ff] transition-colors mt-0.5">
                        {book.title}
                      </h3>
                      <p className="text-xs text-[#c7c4d7]">
                        {book.author} • {book.section}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#464554]/40">
                    <div className="text-[11px] font-mono text-[#c7c4d7]">
                      <span>Qty: <strong className="text-[#dae2fd]">{book.qty}</strong></span>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bold text-[#8083ff] group-hover:text-[#c0c1ff]">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Locate on Shelf</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        books.length > 0 && (
          <div className="bg-[#171f33] border border-[#464554] rounded-2xl p-8 text-center text-[#c7c4d7] space-y-2">
            <AlertCircle className="w-8 h-8 text-[#8083ff] mx-auto opacity-75" />
            <h4 className="text-sm font-bold text-[#dae2fd]">No Matching Books Found</h4>
            <p className="text-xs max-w-xs mx-auto">
              No titles match &quot;{searchQuery}&quot; under the selected filter.
            </p>
          </div>
        )
      )}
    </div>
  );
};
