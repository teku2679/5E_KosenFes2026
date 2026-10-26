'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AVAILABLE_DATES,
  generateTimeSlots,
  ensureAnonymousAuth,
  getActiveReservation,
  getBookedSlotsForDate,
  createReservation,
  cancelReservation,
  getOperationalSettings,
  DEFAULT_SETTINGS,
} from '@/lib/reservations';
import { Reservation, OperationalSettings } from '@/types';

export default function ReservePage() {
  const [selectedDate, setSelectedDate] = useState<string>(AVAILABLE_DATES[0] ?? '');
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [activeReservation, setActiveReservation] = useState<Reservation | null>(null);
  const [settings, setSettings] = useState<OperationalSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      setMessage('');
      const currentSettings = await getOperationalSettings();
      setSettings(currentSettings);

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

  const allSlots = generateTimeSlots(settings.startHour, settings.endHour);

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
        alert('この枠は直前に他のユーザーに予約されました。');
        await loadData();
      } else if (err.message === 'MAINTENANCE_SLOT') {
        alert('選択された枠はメンテナンス時間です。');
        await loadData();
      } else {
        alert('予約中にエラーが発生しました。');
      }
      setMessage('');
    } finally {
      setSubmitting(false);
    }
  };

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
    return <div className="min-h-screen bg-gray-950 text-gray-300 flex items-center justify-center font-mono">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* 共通ナビゲーションヘッダー */}
      <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-black text-lg sm:text-xl tracking-wider bg-linear-to-r from-red-500 via-orange-400 to-yellow-300 bg-clip-text text-transparent">
            <span>⚡</span>
            <span>レーザー脱出</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold">
            <Link href="/" className="px-2.5 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition">
              トップ
            </Link>
            <Link href="/reserve" className="px-2.5 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition">
              🎟️ 予約
            </Link>
            <Link href="/ranking" className="px-2.5 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition">
              🏆 順位
            </Link>
            <Link href="/admin" className="px-2.5 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition border border-gray-800">
              ⚙️ 管理
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">🎟️ 挑戦予約システム</h1>
          <p className="text-xs sm:text-sm text-gray-400">希望の時間枠を選択して事前予約してください（1人1枠まで）</p>
        </div>

        {activeReservation ? (
          /* アクティブな予約カード */
          <div className="bg-gray-900 border border-blue-500/40 rounded-2xl p-6 shadow-2xl space-y-6 text-center">
            <h2 className="text-lg font-bold text-blue-400">現在のアクティブな予約</h2>
            
            <div className="space-y-3 text-left max-w-md mx-auto bg-gray-950 p-4 rounded-xl border border-gray-800 text-sm">
              <p className="flex justify-between">
                <span className="text-gray-400">代表者（チーム名）:</span>
                <span className="font-bold text-white">{activeReservation.name}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-400">予約日時:</span>
                <span className="font-mono font-bold text-white">{activeReservation.reservation_date} {activeReservation.reservation_time}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-400">ステータス:</span>
                <span className="font-bold text-emerald-400">
                  {activeReservation.status === 'reserved' ? '来場前' : 'プレイ中'}
                </span>
              </p>

              {/* チェックインコード案内 */}
              <div className="bg-amber-950/60 border border-amber-500/50 p-4 rounded-xl mt-4 text-center space-y-1">
                <p className="text-xs text-amber-300 font-semibold">受付用チェックインコード</p>
                <p className="text-3xl font-mono font-black tracking-widest text-amber-400 my-1">
                  {activeReservation.checkin_code}
                </p>
                <p className="text-[11px] text-amber-200/80">※受付スタッフにこのコードを提示してください。</p>
              </div>
            </div>

            {activeReservation.status === 'reserved' && (
              <button
                onClick={() => activeReservation.id && handleCancel(activeReservation.id)}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition"
              >
                予約をキャンセルする
              </button>
            )}
          </div>
        ) : (
          /* 新規予約フォーム */
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-6">
            {/* 1. 日付選択 */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-200">① 開催日を選択</label>
              <div className="grid grid-cols-2 gap-3">
                {AVAILABLE_DATES.map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setSelectedDate(d);
                      setSelectedTime(null);
                    }}
                    className={`py-3 rounded-xl font-bold text-sm transition border ${
                      selectedDate === d
                        ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-950'
                        : 'bg-gray-950 text-gray-300 border-gray-800 hover:border-gray-700 hover:text-white'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. 時間枠選択 */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-200">② 希望時間枠を選択（5分刻み）</label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-64 overflow-y-auto p-3 bg-gray-950 rounded-xl border border-gray-800">
                {allSlots.map((time) => {
                  const isMaintenance = settings.maintenanceSlots.includes(time);
                  const isBooked = bookedSlots.includes(time);
                  const isSelected = selectedTime === time;

                  let style = 'bg-gray-900 text-gray-300 border-gray-800 hover:border-red-500 hover:text-white';
                  let statusText = '〇';

                  if (isMaintenance) {
                    style = 'bg-gray-950 text-gray-600 border-transparent cursor-not-allowed';
                    statusText = '休止';
                  } else if (isBooked) {
                    style = 'bg-red-950/40 text-red-500/60 border-transparent cursor-not-allowed';
                    statusText = '満席';
                  } else if (isSelected) {
                    style = 'bg-red-600 text-white border-red-500 font-bold shadow';
                  }

                  return (
                    <button
                      key={time}
                      disabled={isMaintenance || isBooked}
                      onClick={() => setSelectedTime(time)}
                      className={`py-2 px-1 text-xs rounded-lg border transition flex flex-col items-center justify-center font-mono ${style}`}
                    >
                      <span>{time}</span>
                      <span className="text-[10px] opacity-75">{statusText}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. チーム名フォーム */}
            <form onSubmit={handleReserve} className="space-y-4 pt-2 border-t border-gray-800">
              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-200">③ 代表者名（またはチーム名）</label>
                <input
                  type="text"
                  required
                  placeholder="例: チーム高専 / 高専太郎"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-gray-950 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="text-xs text-gray-400 bg-gray-950 p-3 rounded-xl border border-gray-800 flex justify-between items-center">
                <span>選択中:</span>
                <b className="text-red-400 text-sm font-mono">{selectedDate} {selectedTime || '未選択'}</b>
              </div>

              <button
                type="submit"
                disabled={!selectedTime || !name.trim() || submitting}
                className="w-full py-3.5 bg-linear-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-600 text-white font-bold rounded-xl shadow-lg transition duration-200 text-base"
              >
                {submitting ? '処理中...' : '予約を確定する'}
              </button>
            </form>

            {message && (
              <p className="p-4 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-center font-bold text-emerald-300 text-sm">
                {message}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
