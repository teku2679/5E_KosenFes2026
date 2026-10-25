'use client';

import { useState, useEffect } from 'react';
import {
  AVAILABLE_DATES,
  generateTimeSlots,
  MAINTENANCE_SLOTS,
  ensureAnonymousAuth,
  getActiveReservation,
  getBookedSlotsForDate,
  createReservation,
  cancelReservation,
} from '@/lib/reservations';
import { Reservation } from '@/types';

export default function ReservePage() {
  const [selectedDate, setSelectedDate] = useState<string>(AVAILABLE_DATES[0] ?? '');
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [activeReservation, setActiveReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  const allSlots = generateTimeSlots();

  // 初期化とデータの読み込み
  const loadData = async () => {
    try {
      setLoading(true);
      setMessage('');
      const uid = await ensureAnonymousAuth();
      const active = await getActiveReservation(uid);
      setActiveReservation(active);

      if (!active) {
        const booked = await getBookedSlotsForDate(selectedDate);
        setBookedSlots(booked);
      }
    } catch (err) {
      console.error(err);
      setMessage('データの読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  // 予約処理
  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTime || !name.trim()) return;

    try {
      setSubmitting(true);
      setMessage('予約処理中...');
      const code = await createReservation(selectedDate, selectedTime, name.trim());
      setMessage(`✅ 予約完了！ チェックインコード: ${code}`);
      setSelectedTime(null);
      setName('');
      await loadData();
    } catch (err: any) {
      if (err.message === 'RESERVATION_LIMIT_EXCEEDED') {
        alert('既に有効な予約があります。複数の予約はできません。');
      } else if (err.message === 'BOOKING_CONFLICT') {
        alert('申し訳ありません。この枠は直前に他のユーザーに予約されました。');
        await loadData();
      } else {
        alert('予約中にエラーが発生しました。');
      }
      setMessage('');
    } finally {
      setSubmitting(false);
    }
  };

  // キャンセル処理
  const handleCancel = async (id: string) => {
    if (!confirm('本当に予約をキャンセルしますか？')) return;
    try {
      setLoading(true);
      await cancelReservation(id);
      setMessage('');
      alert('予約をキャンセルしました。');
      await loadData();
    } catch (err) {
      alert('キャンセルの実行に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 text-gray-800">
      <h1 className="text-2xl font-bold text-center mb-6">レーザー脱出ゲーム 予約システム</h1>

      {/* 既に予約がある場合 */}
      {activeReservation ? (
        <div className="bg-white border border-blue-200 rounded-xl p-6 shadow-md text-center">
          <h2 className="text-xl font-semibold mb-4 text-blue-600">現在のアクティブな予約</h2>
          <div className="space-y-3 text-left max-w-md mx-auto bg-gray-50 p-4 rounded-lg">
            <p><b>代表者名:</b> {activeReservation.name}</p>
            <p><b>予約日時:</b> {activeReservation.reservation_date} {activeReservation.reservation_time}</p>
            <p><b>ステータス:</b> <span className="font-bold text-green-600">{activeReservation.status === 'reserved' ? '来場前' : 'プレイ中'}</span></p>
            <div className="bg-yellow-100 border-l-4 border-yellow-500 p-3 mt-2">
              <p className="text-sm text-yellow-800"><b>チェックインコード:</b></p>
              <p className="text-3xl font-mono font-extrabold text-center tracking-widest text-gray-900 my-1">
                {activeReservation.checkin_code}
              </p>
              <p className="text-xs text-yellow-700 text-center">※受付でこのコードを提示してください。スクリーンショットを保存してください。</p>
            </div>
          </div>
          {activeReservation.status === 'reserved' && (
            <button
              onClick={() => activeReservation.id && handleCancel(activeReservation.id)}
              className="mt-6 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
            >
              予約をキャンセルする
            </button>
          )}
        </div>
      ) : (
        /* 新規予約フォーム */
        <div>
          {/* 1. 日付選択 */}
          <div className="mb-6">
            <label className="block font-semibold mb-2">① 開催日を選択してください</label>
            <div className="flex gap-3">
              {AVAILABLE_DATES.map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setSelectedDate(d);
                    setSelectedTime(null);
                  }}
                  className={`flex-1 py-3 rounded-lg font-bold transition border ${
                    selectedDate === d
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* 2. 時間スロット選択 */}
          <div className="mb-6">
            <label className="block font-semibold mb-2">② 予約希望時間を選択してください（5分刻み）</label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-60 overflow-y-auto p-2 bg-gray-50 rounded-lg border">
              {allSlots.map((time) => {
                const isMaintenance = MAINTENANCE_SLOTS.includes(time);
                const isBooked = bookedSlots.includes(time);
                const isSelected = selectedTime === time;

                let btnStyle = 'bg-white text-gray-800 border-gray-300 hover:border-blue-500';
                let label = time;

                if (isMaintenance) {
                  btnStyle = 'bg-gray-200 text-gray-400 border-transparent cursor-not-allowed';
                  label = '休止';
                } else if (isBooked) {
                  btnStyle = 'bg-red-100 text-red-400 border-transparent cursor-not-allowed';
                  label = '満席';
                } else if (isSelected) {
                  btnStyle = 'bg-blue-600 text-white border-blue-600 font-bold';
                }

                return (
                  <button
                    key={time}
                    disabled={isMaintenance || isBooked}
                    onClick={() => setSelectedTime(time)}
                    className={`py-2 px-1 text-xs rounded border transition flex flex-col items-center justify-center ${btnStyle}`}
                  >
                    <span>{time}</span>
                    <span className="text-[10px] opacity-75">{label === time ? '〇' : label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. 代表者名と確定ボタン */}
          <form onSubmit={handleReserve} className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="mb-4">
              <label className="block font-semibold mb-1">③ 代表者のお名前</label>
              <input
                type="text"
                required
                placeholder="例: 高専太郎"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="text-sm mb-4 text-red-600">
              <b className="text-red-600">個人情報は入力しないでください</b>
            </div>

            <div className="text-sm mb-4 text-gray-600">
              選択中: <b className="text-blue-600">{selectedDate} {selectedTime || '未選択'}</b>
            </div>

            <button
              type="submit"
              disabled={!selectedTime || !name.trim() || submitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold rounded-lg transition"
            >
              {submitting ? '処理中...' : '予約を確定する'}
            </button>
          </form>

          {message && <p className="mt-4 text-center font-semibold text-blue-600">{message}</p>}
        </div>
      )}
    </div>
  );
}