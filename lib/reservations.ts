import { db, auth } from './firebase';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  serverTimestamp,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { Reservation } from '@/types';

// 展示・営業時間設定の型定義
export interface OperationalSettings {
  startHour: number;
  endHour: number;
  maintenanceSlots: string[];
}

export const DEFAULT_SETTINGS: OperationalSettings = {
  startHour: 10,
  endHour: 17,
  maintenanceSlots: ["10:55", "11:55", "12:55", "13:55", "14:55", "15:55", "16:55"],
};

export const AVAILABLE_DATES = ["2026-11-07", "2026-11-08"]; // 開催日

// --- 1. 設定情報の取得・更新 ---

// Firestoreから営業時間・メンテナンス設定を取得
export async function getOperationalSettings(): Promise<OperationalSettings> {
  try {
    const docRef = doc(db, 'settings', 'operational');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as OperationalSettings;
    }
  } catch (err) {
    console.error('設定データの取得失敗:', err);
  }
  return DEFAULT_SETTINGS;
}

// 営業時間・メンテナンス設定の保存
export async function updateOperationalSettings(newSettings: OperationalSettings): Promise<void> {
  const docRef = doc(db, 'settings', 'operational');
  await setDoc(docRef, newSettings);
}

// 指定した開始・終了時間から5分刻みの時間スロットを生成
export function generateTimeSlots(startHour: number, endHour: number): string[] {
  const slots: string[] = [];
  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += 5) {
      if (h === endHour && m > 0) break;
      const hourStr = String(h).padStart(2, '0');
      const minuteStr = String(m).padStart(2, '0');
      slots.push(`${hourStr}:${minuteStr}`);
    }
  }
  return slots;
}

// 6桁コード生成
function generateCheckinCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// 匿名認証の準備
export async function ensureAnonymousAuth(): Promise<string> {
  if (auth.currentUser) return auth.currentUser.uid;
  const credential = await signInAnonymously(auth);
  return credential.user.uid;
}

// 予約済み時間枠を取得
export async function getBookedSlotsForDate(date: string): Promise<string[]> {
  const q = query(
    collection(db, 'reservations'),
    where('reservation_date', '==', date)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data().reservation_time as string);
}

// ユーザーのアクティブな予約を取得
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

// 新規予約の作成（トランザクション保護）
export async function createReservation(
  date: string,
  time: string,
  name: string
): Promise<string> {
  const uid = await ensureAnonymousAuth();
  const settings = await getOperationalSettings();

  const activeRes = await getActiveReservation(uid);
  if (activeRes) throw new Error('RESERVATION_LIMIT_EXCEEDED');

  if (settings.maintenanceSlots.includes(time)) {
    throw new Error('MAINTENANCE_SLOT');
  }

  const newCheckinCode = generateCheckinCode();
  const reservationsRef = collection(db, 'reservations');

  await runTransaction(db, async (transaction) => {
    const q = query(
      reservationsRef,
      where('reservation_date', '==', date),
      where('reservation_time', '==', time)
    );
    const existingSnap = await getDocs(q);
    if (!existingSnap.empty) throw new Error('BOOKING_CONFLICT');

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

// 予約キャンセル
export async function cancelReservation(reservationId: string): Promise<void> {
  await deleteDoc(doc(db, 'reservations', reservationId));
}

// --- 2. 管理者向け機能 ---

// 全予約の取得（メモリソートにより複合インデックスエラーを回避）
export async function getAllReservations(): Promise<Reservation[]> {
  const snapshot = await getDocs(collection(db, 'reservations'));
  const list = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as Reservation[];

  return list.sort((a, b) => {
    const dateDiff = a.reservation_date.localeCompare(b.reservation_date);
    if (dateDiff !== 0) return dateDiff;
    return a.reservation_time.localeCompare(b.reservation_time);
  });
}

// チェックイン処理 (コード照合)
export async function checkInWithCode(code: string): Promise<Reservation> {
  const cleanCode = code.trim().toUpperCase();
  const q = query(
    collection(db, 'reservations'),
    where('checkin_code', '==', cleanCode)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) throw new Error('NOT_FOUND');

  const docSnap = snapshot.docs[0];
  const data = docSnap.data();

  if (data.status === 'playing') throw new Error('ALREADY_PLAYING');
  if (data.status === 'cleared') throw new Error('ALREADY_CLEARED');

  await updateDoc(docSnap.ref, {
    status: 'playing',
    checked_in_at: serverTimestamp(),
  });

  return { id: docSnap.id, ...data, status: 'playing' } as Reservation;
}

// ゲーム終了・クリアタイム＆難易度の記録
export async function recordClearResult(
  reservationId: string,
  clearTimeSeconds: number,
  difficultyLevel: number
): Promise<void> {
  const docRef = doc(db, 'reservations', reservationId);
  await updateDoc(docRef, {
    status: 'cleared',
    clear_time: clearTimeSeconds,
    difficulty_level: difficultyLevel,
    cleared_at: serverTimestamp(),
  });
}

// --- 3. ランキング機能 ---

// 秒数を mm:ss.SS 形式に変換
export function formatClearTime(totalSeconds?: number): string {
  if (totalSeconds === undefined || totalSeconds === null || isNaN(totalSeconds) || totalSeconds < 0) {
    return '--:--.--';
  }
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  const millis = Math.round((totalSeconds - Math.floor(totalSeconds)) * 100);

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(mins)}:${pad(secs)}.${pad(millis)}`;
}

// 難易度別ランキングのリアルタイム購読 (オンサイト表示用)
export function subscribeRankingByDifficulty(
  difficultyLevel: number,
  limitCount: number = 10,
  callback: (rankings: Reservation[]) => void
) {
  const q = query(
    collection(db, 'reservations'),
    where('status', '==', 'cleared'),
    where('difficulty_level', '==', difficultyLevel)
  );

  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as Reservation[];

    // メモリ内でクリアタイムの昇順ソートを実施 (インデックスエラー回避)
    list.sort((a, b) => (a.clear_time ?? Infinity) - (b.clear_time ?? Infinity));

    callback(list.slice(0, limitCount));
  }, (err) => {
    console.error(`難易度${difficultyLevel}のランキング読み込みエラー:`, err);
  });
}
