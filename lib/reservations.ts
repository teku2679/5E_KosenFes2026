import { db, auth } from './firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { Reservation } from '@/types';

// 営業時間・メンテナンス設定
export const OPERATIONAL_START_HOUR = 10;
export const OPERATIONAL_END_HOUR = 17;
export const SLOT_INTERVAL_MINUTES = 5;
export const MAINTENANCE_SLOTS = ["10:55", "11:55", "12:55", "13:55", "14:55", "15:55", "16:55"];
export const AVAILABLE_DATES = ["2026-11-07", "2026-11-08"]; // 今年の開催日

// 5分刻みの全時間スロット生成 (メンテナンス含む)
export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = OPERATIONAL_START_HOUR; h <= OPERATIONAL_END_HOUR; h++) {
    for (let m = 0; m < 60; m += SLOT_INTERVAL_MINUTES) {
      if (h === OPERATIONAL_END_HOUR && m > 0) break;
      const hourStr = String(h).padStart(2, '0');
      const minuteStr = String(m).padStart(2, '0');
      slots.push(`${hourStr}:${minuteStr}`);
    }
  }
  return slots;
}

// 6桁のチェックインコード生成
function generateCheckinCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// 匿名認証の準備
export async function ensureAnonymousAuth(): Promise<string> {
  if (auth.currentUser) return auth.currentUser.uid;
  const credential = await signInAnonymously(auth);
  return credential.user.uid;
}

// 指定日の予約済み枠一覧を取得
export async function getBookedSlotsForDate(date: string): Promise<string[]> {
  const q = query(
    collection(db, 'reservations'),
    where('reservation_date', '==', date)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data().reservation_time as string);
}

// ユーザーのアクティブな予約（1件のみ許可）を取得
export async function getActiveReservation(uid: string): Promise<Reservation | null> {
  const q = query(
    collection(db, 'reservations'),
    where('user_uid', '==', uid),
    where('status', 'in', ['reserved', 'playing'])
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as Reservation;
}

// 新規予約の追加（トランザクションによる排他制御）
export async function createReservation(
  date: string,
  time: string,
  name: string
): Promise<string> {
  const uid = await ensureAnonymousAuth();

  // 1. アクティブな予約の有無チェック
  const activeRes = await getActiveReservation(uid);
  if (activeRes) {
    throw new Error('RESERVATION_LIMIT_EXCEEDED');
  }

  // 2. メンテナンス時間チェック
  if (MAINTENANCE_SLOTS.includes(time)) {
    throw new Error('MAINTENANCE_SLOT');
  }

  // 3. トランザクション処理で重複予約を確実に防止
  const newCheckinCode = generateCheckinCode();
  const reservationsRef = collection(db, 'reservations');

  await runTransaction(db, async (transaction) => {
    const q = query(
      reservationsRef,
      where('reservation_date', '==', date),
      where('reservation_time', '==', time)
    );
    const existingSnap = await getDocs(q);

    if (!existingSnap.empty) {
      throw new Error('BOOKING_CONFLICT');
    }

    const newDocRef = doc(reservationsRef);
    transaction.set(newDocRef, {
      name,
      reservation_date: date,
      reservation_time: time,
      status: 'reserved',
      checkin_code: newCheckinCode,
      user_uid: uid,
      created_at: serverTimestamp(),
    });
  });

  return newCheckinCode;
}

// 予約のキャンセル
export async function cancelReservation(reservationId: string): Promise<void> {
  await deleteDoc(doc(db, 'reservations', reservationId));
}