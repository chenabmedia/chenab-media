import { getAdminDb } from '@/lib/firebase/admin';

/**
 * Generates an incremental, human-readable ticket number (e.g. CHN-0001001)
 * atomically using a Firestore transaction to eliminate race conditions under concurrent requests.
 */
export async function getNextTicketNumber(): Promise<string> {
  const db = getAdminDb();
  if (!db) {
    // Fallback if db is somehow not connected yet
    const fallbackRandom = Math.floor(1000000 + Math.random() * 9000000);
    return `CHN-${fallbackRandom}`;
  }

  const counterRef = db.collection('system_counters').doc('tickets');

  try {
    const nextNumber = await db.runTransaction(async (tx) => {
      const snap = await tx.get(counterRef);
      let currentNumber = 1000; // Base starting number (e.g., CHN-0001001)
      if (snap.exists) {
        const data = snap.data();
        if (data && typeof data.lastNumber === 'number') {
          currentNumber = data.lastNumber;
        }
      }
      const incremented = currentNumber + 1;
      tx.set(
        counterRef,
        {
          lastNumber: incremented,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      return incremented;
    });

    const padded = String(nextNumber).padStart(7, '0');
    return `CHN-${padded}`;
  } catch (err) {
    console.error('[getNextTicketNumber] Transaction failed, using timestamp fallback:', err);
    const suffix = Date.now().toString().slice(-7);
    return `CHN-${suffix}`;
  }
}
