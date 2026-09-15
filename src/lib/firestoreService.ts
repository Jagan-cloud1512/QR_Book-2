import {
  collection,
  doc,
  onSnapshot,
  runTransaction,
  setDoc,
  getDocs,
  limit,
  query,
  Firestore,
  Unsubscribe,
} from 'firebase/firestore';
import { getActiveDb, namedDb, defaultDb, portalDb, namedDatabaseId, DbTargetType } from './firebase';
import { BookItem, ShelfMatrixMeta } from '../types';
import { DEFAULT_SHELF_MATRIX } from './shelfUtils';

const MATRIX_DOC_IDS = ['_shelf_matrix', 'matrix', 'shelf_matrix', 'metadata', 'config'];

/**
 * Resolves collection reference supporting single-level or nested subcollection paths.
 */
export function getCollectionRef(database: Firestore, path: string) {
  const clean = path.replace(/^\/+|\/+$/g, '');
  const segments = clean.split('/').filter(Boolean);
  if (segments.length === 0) {
    return collection(database, 'books');
  }
  if (segments.length === 1) {
    return collection(database, segments[0]);
  }
  return collection(database, segments[0], ...segments.slice(1));
}

/**
 * Resolves document reference supporting single-level or nested subcollection paths.
 */
export function getDocumentRef(database: Firestore, collectionPath: string, docId: string) {
  const clean = collectionPath.replace(/^\/+|\/+$/g, '');
  const segments = clean.split('/').filter(Boolean);
  if (segments.length === 0) {
    return doc(database, 'books', docId);
  }
  if (segments.length === 1) {
    return doc(database, segments[0], docId);
  }
  return doc(database, segments[0], ...segments.slice(1), docId);
}

/**
 * Universal book document parser to adapt to different field naming conventions
 * from Admin Web Portals (e.g. title/bookTitle, row/shelfRow, col/column, qty/quantity/copies).
 */
export function parseBookDoc(id: string, data: any): BookItem {
  // Title
  const title =
    data.title || data.bookTitle || data.name || data.book_title || data.bookName || id || 'Untitled Book';

  // Author
  const author =
    data.author || data.writer || data.bookAuthor || data.authorName || data.authors || 'Unknown Author';

  // ISBN / Code
  const isbn = data.isbn || data.code || data.callNumber || data.id || '';

  // Row (number, e.g. 1, 2, 3...)
  let row = 1;
  const rawRow =
    data.row ?? data.shelfRow ?? data.shelf_row ?? data.rowNumber ?? data.rowNum ?? data.r ?? data.shelf;
  if (typeof rawRow === 'number' && !isNaN(rawRow) && rawRow > 0) {
    row = rawRow;
  } else if (typeof rawRow === 'string') {
    const parsed = parseInt(rawRow.replace(/\D/g, ''), 10);
    if (!isNaN(parsed) && parsed > 0) row = parsed;
  }

  // Column (e.g. "1-3", "4", "2-5", "1")
  let col = '1';
  const rawCol =
    data.col ?? data.shelfCol ?? data.shelf_col ?? data.column ?? data.colNumber ?? data.colNum ?? data.c ?? data.slot ?? data.position;
  if (typeof rawCol === 'number') {
    col = String(rawCol);
  } else if (typeof rawCol === 'string' && rawCol.trim()) {
    col = rawCol.trim();
  }

  // Quantity / Copies
  let qty = 1;
  const rawQty =
    data.qty ?? data.quantity ?? data.copies ?? data.stock ?? data.availableQty ?? data.availableCopies ?? data.totalCopies ?? data.count;
  if (typeof rawQty === 'number' && !isNaN(rawQty)) {
    qty = rawQty;
  } else if (typeof rawQty === 'string') {
    const parsed = parseInt(rawQty, 10);
    if (!isNaN(parsed)) qty = parsed;
  } else if (data.status === 'Out of Stock') {
    qty = 0;
  }

  // Section / Category
  const section =
    data.section || data.category || data.genre || data.subject || data.shelfSection || data.shelfName || 'General Stacks';

  // Status
  let status: BookItem['status'] = 'Available';
  if (data.status === 'Reserved' || data.status === 'Out of Stock' || data.status === 'Available') {
    status = data.status;
  } else if (qty <= 0) {
    status = 'Out of Stock';
  } else if (data.reservedBy && data.reservedBy !== 'None') {
    status = 'Reserved';
  }

  // Reserved by
  const reservedBy = data.reservedBy && data.reservedBy !== 'None' ? data.reservedBy : null;

  // Queue
  const queue = Array.isArray(data.queue) ? data.queue : [];

  // Floor / Location
  const floor = data.floor || data.location || data.shelfLocation || '2nd Floor, North Wing';

  // Description
  const description = data.description || data.summary || data.synopsis || '';

  return {
    bookId: id,
    title,
    author,
    isbn,
    row,
    col,
    qty,
    section,
    status,
    reservedBy,
    holdExpiresAt: data.holdExpiresAt || null,
    queue,
    updatedAt: data.updatedAt || new Date().toISOString(),
    floor,
    description,
  };
}

export interface CollectionProbeResult {
  target: DbTargetType;
  dbLabel: string;
  collectionName: string;
  count: number;
  sampleTitles: string[];
  error?: string;
}

/**
 * Probes candidate collection names across Web Portal DB (qr-book-e34d4), Named DB and Default DB
 */
export async function probeCandidateCollections(
  candidateNames: string[] = ['user_admin_demo', 'user_admin', 'books', 'inventory', 'library', 'shelf_inventory', 'items']
): Promise<CollectionProbeResult[]> {
  const targets: { target: DbTargetType; db: Firestore | null; label: string }[] = [
    { target: 'portal', db: portalDb, label: 'Web Portal DB (qr-book-e34d4)' },
    { target: 'named', db: namedDb, label: `Studio Named DB (${namedDatabaseId || 'ai-studio-...'})` },
    { target: 'default', db: defaultDb, label: 'Studio Default (default) DB' },
  ];

  const results: CollectionProbeResult[] = [];

  for (const t of targets) {
    if (!t.db) continue;
    for (const name of candidateNames) {
      try {
        const colRef = getCollectionRef(t.db, name);
        const q = query(colRef, limit(6));
        const snap = await getDocs(q);
        const sampleTitles: string[] = [];
        snap.forEach((d) => {
          if (!MATRIX_DOC_IDS.includes(d.id)) {
            const data = d.data();
            sampleTitles.push(data.title || data.name || data.bookTitle || d.id);
          }
        });
        results.push({
          target: t.target,
          dbLabel: t.label,
          collectionName: name,
          count: snap.size,
          sampleTitles,
        });
      } catch (err: any) {
        results.push({
          target: t.target,
          dbLabel: t.label,
          collectionName: name,
          count: 0,
          sampleTitles: [],
          error: err.message,
        });
      }
    }
  }

  return results;
}

/**
 * Real-time subscription to books and matrix metadata in a shelf collection
 */
export function subscribeToShelfInventory(
  tableName: string,
  onUpdate: (books: BookItem[], matrix: ShelfMatrixMeta) => void,
  onError?: (err: any) => void
): Unsubscribe {
  if (!tableName || tableName.trim() === '') {
    onUpdate([], DEFAULT_SHELF_MATRIX);
    return () => {};
  }

  const activeDb = getActiveDb();
  const colRef = getCollectionRef(activeDb, tableName);

  const unsubscribe = onSnapshot(
    colRef,
    (snapshot) => {
      const parsedBooks: BookItem[] = [];
      let detectedMatrix: ShelfMatrixMeta = {
        ...DEFAULT_SHELF_MATRIX,
        tableName,
      };

      let maxRow = 1;
      let maxCol = 1;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const id = docSnap.id;

        // Check if this document is shelf layout metadata
        if (MATRIX_DOC_IDS.includes(id) || data.isMatrixConfig === true) {
          detectedMatrix = {
            rows: data.rows || data.rowCount || data.shelfRows || DEFAULT_SHELF_MATRIX.rows,
            cols: data.cols || data.colCount || data.shelfCols || DEFAULT_SHELF_MATRIX.cols,
            sectionName: data.sectionName || data.name || data.title || tableName,
            tableName,
            updatedAt: data.updatedAt || new Date().toISOString(),
          };
          return;
        }

        // Standard book item document
        const parsed = parseBookDoc(id, data);
        parsedBooks.push(parsed);

        // Keep track of maximum dimensions from books
        if (parsed.row > maxRow) maxRow = parsed.row;
        const colNums = typeof parsed.col === 'string'
          ? parsed.col.split(/[,-]/).map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n))
          : [Number(parsed.col)];
        for (const c of colNums) {
          if (c > maxCol) maxCol = c;
        }
      });

      // Adjust matrix dimensions if not explicitly set
      if (!detectedMatrix.rows || detectedMatrix.rows < maxRow) {
        detectedMatrix.rows = Math.max(5, maxRow);
      }
      if (!detectedMatrix.cols || detectedMatrix.cols < maxCol) {
        detectedMatrix.cols = Math.max(10, maxCol);
      }

      // Sort books by Row then Col
      parsedBooks.sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row;
        return a.col.localeCompare(b.col, undefined, { numeric: true });
      });

      onUpdate(parsedBooks, detectedMatrix);
    },
    (err) => {
      console.warn(`Error in onSnapshot for shelf collection "${tableName}":`, err);
      if (onError) onError(err);
    }
  );

  return unsubscribe;
}

/**
 * Places a 5-Minute Hold Reservation on a book using atomic transaction
 */
export async function reserveBookTransaction(
  tableName: string,
  bookId: string,
  patronUsername: string
): Promise<{ success: boolean; message: string }> {
  const activeDb = getActiveDb();
  const bookRef = getDocumentRef(activeDb, tableName, bookId);

  try {
    const result = await runTransaction(activeDb, async (transaction) => {
      const bookSnap = await transaction.get(bookRef);
      if (!bookSnap.exists()) {
        throw new Error(`Book "${bookId}" was not found in shelf collection "${tableName}".`);
      }

      const data = bookSnap.data();
      const currentReservedBy = data.reservedBy;
      const currentStatus = data.status || 'Available';
      const currentHoldExpiresAt = data.holdExpiresAt || 0;
      const now = Date.now();

      // Check if another patron currently holds an active lock
      if (
        currentReservedBy &&
        currentReservedBy !== 'None' &&
        currentReservedBy !== patronUsername &&
        currentHoldExpiresAt > now
      ) {
        return {
          success: false,
          message: `Book is currently held by patron "${currentReservedBy}". You can join the waiting queue.`,
        };
      }

      // Calculate 5 minutes expiry timestamp
      const fiveMinutesFromNow = now + 5 * 60 * 1000;

      // Clean up user from queue if they were waiting
      const currentQueue: string[] = Array.isArray(data.queue) ? data.queue : [];
      const updatedQueue = currentQueue.filter((u) => u !== patronUsername);

      transaction.update(bookRef, {
        status: 'Reserved',
        reservedBy: patronUsername,
        holdExpiresAt: fiveMinutesFromNow,
        queue: updatedQueue,
        updatedAt: new Date().toISOString(),
      });

      return {
        success: true,
        message: `5-minute hold secured for "${data.title || bookId}". Head to Row ${data.row || 1}, Col ${data.col || 1} to retrieve it!`,
      };
    });

    return result;
  } catch (err: any) {
    console.error('reserveBookTransaction failed:', err);
    return {
      success: false,
      message: err.message || 'Failed to place reservation.',
    };
  }
}

/**
 * Cancels or Expires a Reservation, automatically advancing the waitlist queue if present
 */
export async function cancelOrExpireReservationTransaction(
  tableName: string,
  bookId: string
): Promise<{ success: boolean; message: string }> {
  const activeDb = getActiveDb();
  const bookRef = getDocumentRef(activeDb, tableName, bookId);

  try {
    const result = await runTransaction(activeDb, async (transaction) => {
      const bookSnap = await transaction.get(bookRef);
      if (!bookSnap.exists()) {
        throw new Error(`Book "${bookId}" was not found.`);
      }

      const data = bookSnap.data();
      const currentQueue: string[] = Array.isArray(data.queue) ? data.queue : [];

      if (currentQueue.length > 0) {
        // Advance queue to next waiting patron with fresh 5-min timer
        const nextPatron = currentQueue[0];
        const remainingQueue = currentQueue.slice(1);
        const fiveMinutes = Date.now() + 5 * 60 * 1000;

        transaction.update(bookRef, {
          status: 'Reserved',
          reservedBy: nextPatron,
          holdExpiresAt: fiveMinutes,
          queue: remainingQueue,
          updatedAt: new Date().toISOString(),
        });

        return {
          success: true,
          message: `Hold released and automatically assigned to next patron in line: "${nextPatron}".`,
        };
      } else {
        // No one in queue -> restore to Available
        transaction.update(bookRef, {
          status: 'Available',
          reservedBy: null,
          holdExpiresAt: null,
          queue: [],
          updatedAt: new Date().toISOString(),
        });

        return {
          success: true,
          message: 'Reservation cancelled. Book is now Available for all patrons.',
        };
      }
    });

    return result;
  } catch (err: any) {
    console.error('cancelOrExpireReservationTransaction failed:', err);
    return {
      success: false,
      message: err.message || 'Failed to cancel reservation.',
    };
  }
}

// Track currently pending expiration transaction promises to avoid spamming
const inFlightExpirations = new Set<string>();

/**
 * Automatically checks and expires overdue reservations in Firestore,
 * promoting the next patron in queue if available.
 * Runs in the background regardless of user login state or current active screen.
 */
export async function checkAndExpireReservations(tableName: string, books: BookItem[]) {
  if (!tableName || !Array.isArray(books) || books.length === 0) return;
  const now = Date.now();

  for (const book of books) {
    // Only check books that are Reserved with an expired hold timestamp
    if (
      book.status === 'Reserved' &&
      book.holdExpiresAt &&
      book.holdExpiresAt <= now
    ) {
      const lockKey = `${tableName}:${book.bookId}:${book.holdExpiresAt}`;
      if (inFlightExpirations.has(lockKey)) continue;

      inFlightExpirations.add(lockKey);
      try {
        console.log(`[Timer Engine] Hold for book "${book.title || book.bookId}" expired. Running auto-advance transaction...`);
        const res = await cancelOrExpireReservationTransaction(tableName, book.bookId);
        console.log(`[Timer Engine] Expiration result:`, res.message);
      } catch (err) {
        console.warn(`[Timer Engine] Auto-expire error for book ${book.bookId}:`, err);
      } finally {
        setTimeout(() => inFlightExpirations.delete(lockKey), 3000);
      }
    }
  }
}

/**
 * Adds a patron to the waiting queue for a book
 */
export async function joinWaitlistTransaction(
  tableName: string,
  bookId: string,
  patronUsername: string
): Promise<{ success: boolean; message: string }> {
  const activeDb = getActiveDb();
  const bookRef = getDocumentRef(activeDb, tableName, bookId);

  try {
    const result = await runTransaction(activeDb, async (transaction) => {
      const bookSnap = await transaction.get(bookRef);
      if (!bookSnap.exists()) {
        throw new Error(`Book "${bookId}" not found.`);
      }

      const data = bookSnap.data();
      const currentQueue: string[] = Array.isArray(data.queue) ? data.queue : [];

      if (currentQueue.includes(patronUsername)) {
        return {
          success: true,
          message: `You are already in queue (position #${currentQueue.indexOf(patronUsername) + 1}).`,
        };
      }

      const updatedQueue = [...currentQueue, patronUsername];
      transaction.update(bookRef, {
        queue: updatedQueue,
        updatedAt: new Date().toISOString(),
      });

      return {
        success: true,
        message: `Joined waitlist at position #${updatedQueue.length}!`,
      };
    });

    return result;
  } catch (err: any) {
    console.error('joinWaitlistTransaction failed:', err);
    return {
      success: false,
      message: err.message || 'Failed to join waitlist.',
    };
  }
}

/**
 * Removes a patron from the waitlist
 */
export async function leaveWaitlistTransaction(
  tableName: string,
  bookId: string,
  patronUsername: string
): Promise<{ success: boolean; message: string }> {
  const activeDb = getActiveDb();
  const bookRef = getDocumentRef(activeDb, tableName, bookId);

  try {
    const result = await runTransaction(activeDb, async (transaction) => {
      const bookSnap = await transaction.get(bookRef);
      if (!bookSnap.exists()) {
        throw new Error(`Book "${bookId}" not found.`);
      }

      const data = bookSnap.data();
      const currentQueue: string[] = Array.isArray(data.queue) ? data.queue : [];
      const updatedQueue = currentQueue.filter((u) => u !== patronUsername);

      transaction.update(bookRef, {
        queue: updatedQueue,
        updatedAt: new Date().toISOString(),
      });

      return {
        success: true,
        message: 'Successfully removed from waitlist.',
      };
    });

    return result;
  } catch (err: any) {
    console.error('leaveWaitlistTransaction failed:', err);
    return {
      success: false,
      message: err.message || 'Failed to leave waitlist.',
    };
  }
}
