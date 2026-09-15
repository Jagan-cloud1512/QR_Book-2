import React, { useState, useEffect } from 'react';
import { NavTab, BookItem, ShelfMatrixMeta } from './types';
import { TopAppBar } from './components/TopAppBar';
import { BottomNavBar } from './components/BottomNavBar';
import { QRScannerView } from './components/QRScannerView';
import { SearchView } from './components/SearchView';
import { LibraryView } from './components/LibraryView';
import { AccountView } from './components/AccountView';
import { ShelfMatrixCanvas } from './components/ShelfMatrixCanvas';
import { ReservationModal } from './components/ReservationModal';
import { AuthView } from './components/AuthView';
import { subscribeToShelfInventory, checkAndExpireReservations } from './lib/firestoreService';
import { initAuth } from './lib/firebase';
import { getStoredSession, UserAccount, clearSession } from './lib/authService';
import { DEFAULT_SHELF_MATRIX } from './lib/shelfUtils';

export function App() {
  // Clear persistent storage on initial app boot so fresh start is guaranteed
  useEffect(() => {
    try {
      localStorage.removeItem('shelf_active_collection');
      localStorage.removeItem('librislink_auth_session');
      sessionStorage.removeItem('shelf_active_collection');
      sessionStorage.removeItem('librislink_auth_session');
    } catch (e) {
      console.warn('Storage reset note:', e);
    }
  }, []);

  // Navigation: always start at 'scan' on launch
  const [currentTab, setCurrentTab] = useState<NavTab>('scan');

  // Shelf Table/Collection: strictly null by default (disconnected state on every restart)
  const [tableName, setTableName] = useState<string | null>(null);

  // State for books and shelf layout
  const [books, setBooks] = useState<BookItem[]>([]);
  const [matrixMeta, setMatrixMeta] = useState<ShelfMatrixMeta>(DEFAULT_SHELF_MATRIX);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Selected book for locating on shelf matrix
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);

  // Modals state
  const [reservationModalBook, setReservationModalBook] = useState<BookItem | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Patron Auth Session state: strictly null on restart (requires sign in)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  // Initialize Firebase Auth
  useEffect(() => {
    initAuth();

    const handleAuthChange = (e: any) => {
      setCurrentUser(e.detail?.user || null);
    };
    window.addEventListener('librislink_auth_changed', handleAuthChange);
    return () => window.removeEventListener('librislink_auth_changed', handleAuthChange);
  }, []);

  // Real-time listener on active shelf collection
  useEffect(() => {
    if (!tableName) {
      setBooks([]);
      setMatrixMeta(DEFAULT_SHELF_MATRIX);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeToShelfInventory(
      tableName,
      (updatedBooks, updatedMatrix) => {
        setBooks(updatedBooks);
        setMatrixMeta(updatedMatrix);
        setIsLoading(false);

        // Keep selectedBook and reservation modal synced with latest Firestore data
        setSelectedBook((prev) => {
          if (!prev) return null;
          return updatedBooks.find((b) => b.bookId === prev.bookId) || prev;
        });

        setReservationModalBook((prev) => {
          if (!prev) return null;
          return updatedBooks.find((b) => b.bookId === prev.bookId) || prev;
        });

        // Trigger immediate expiration check upon receiving new snapshot
        checkAndExpireReservations(tableName, updatedBooks);
      },
      (err) => {
        console.warn('Inventory subscribe error:', err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tableName]);

  // Background timer engine: runs every 1 second to auto-expire holds and advance queues
  // Works whether user is logged in, logged out, on any screen, or inside/outside modal
  useEffect(() => {
    if (!tableName || books.length === 0) return;

    const timerInterval = setInterval(() => {
      checkAndExpireReservations(tableName, books);
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [tableName, books]);

  // If no shelf is connected, automatically redirect to scan tab
  useEffect(() => {
    if (!tableName && (currentTab === 'search' || currentTab === 'library')) {
      setCurrentTab('scan');
    }
  }, [tableName, currentTab]);

  // Handle QR code shelf selection
  const handleTableSelected = (newTable: string) => {
    const clean = newTable.trim();
    if (!clean) return;
    setTableName(clean);
    setSelectedBook(null);
  };

  // Disconnect from current shelf
  const handleDisconnectShelf = () => {
    setTableName(null);
    setSelectedBook(null);
    setBooks([]);
    setCurrentTab('scan');
  };

  const handleSelectBook = (book: BookItem) => {
    setSelectedBook(book);
  };

  const handleClearSelectedBook = () => {
    setSelectedBook(null);
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
  };

  const handleAuthSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
  };

  // Compute patron hold count for bottom nav badge
  const activeHoldCount = currentUser
    ? books.filter((b) => b.reservedBy === currentUser.username).length
    : 0;

  return (
    <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] flex flex-col font-sans select-none antialiased">
      {/* Top Header Bar */}
      <TopAppBar
        currentTab={currentTab}
        onTabChange={(tab) => {
          if (!tableName && (tab === 'search' || tab === 'library')) {
            setCurrentTab('scan');
            return;
          }
          setCurrentTab(tab);
          if (tab === 'scan') setSelectedBook(null);
        }}
        tableName={tableName}
        onRescanClick={() => {
          setCurrentTab('scan');
          setSelectedBook(null);
        }}
        onDisconnectShelf={handleDisconnectShelf}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col w-full max-w-5xl mx-auto overflow-hidden">
        {(!tableName || currentTab === 'scan') && (
          <QRScannerView
            currentTableName={tableName}
            onTableSelected={(table) => {
              handleTableSelected(table);
            }}
            onNavigateToSearch={() => {
              setCurrentTab('search');
            }}
          />
        )}

        {tableName && currentTab === 'search' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* If a book is selected to locate, show the Shelf Matrix Canvas */}
            {selectedBook ? (
              <ShelfMatrixCanvas
                selectedBook={selectedBook}
                shelfMatrix={matrixMeta}
                allBooksOnShelf={books}
                currentUser={currentUser}
                onBackToSearch={handleClearSelectedBook}
                onOpenReservationModal={() => setReservationModalBook(selectedBook)}
              />
            ) : (
              <SearchView
                books={books}
                tableName={tableName}
                onSelectBook={handleSelectBook}
                onRescanClick={() => setCurrentTab('scan')}
                selectedBookId={selectedBook?.bookId}
                onTableSelected={handleTableSelected}
              />
            )}
          </div>
        )}

        {tableName && currentTab === 'library' && (
          <LibraryView
            books={books}
            tableName={tableName}
            currentUser={currentUser}
            onSelectBook={(book) => {
              setSelectedBook(book);
              setCurrentTab('search');
            }}
            onOpenReservationModal={(book) => setReservationModalBook(book)}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onRescanClick={() => setCurrentTab('scan')}
          />
        )}

        {currentTab === 'account' && (
          <AccountView
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onLogout={handleLogout}
            tableName={tableName}
            onRescanClick={() => setCurrentTab('scan')}
            onDisconnectShelf={handleDisconnectShelf}
            books={books}
          />
        )}
      </main>

      {/* 5-Minute Hold / Waitlist Reservation Modal */}
      {reservationModalBook && (
        <ReservationModal
          book={reservationModalBook}
          tableName={tableName || 'books'}
          currentUser={currentUser}
          isOpen={true}
          onClose={() => setReservationModalBook(null)}
          onOpenAuth={() => {
            setReservationModalBook(null);
            setIsAuthModalOpen(true);
          }}
        />
      )}

      {/* Patron Auth Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <AuthView
            onAuthSuccess={handleAuthSuccess}
            onCancel={() => setIsAuthModalOpen(false)}
          />
        </div>
      )}

      {/* Mobile Bottom Nav Bar */}
      <BottomNavBar
        currentTab={currentTab}
        onTabChange={(tab) => {
          if (!tableName && (tab === 'search' || tab === 'library')) {
            setCurrentTab('scan');
            return;
          }
          setCurrentTab(tab);
          if (tab === 'scan') setSelectedBook(null);
        }}
        activeHoldCount={activeHoldCount}
        tableName={tableName}
      />
    </div>
  );
}

export default App;
