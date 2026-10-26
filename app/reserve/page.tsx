'use client';

import { useState, useEffect } from 'react';
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

  const allSlots = generateTimeSlots(settings.startHour, settings.endHour);

  // 初期データ読み込み
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
    return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">読み込み中...</div>;
  }

  return (
    <div className="page-container-narrow">
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">レーザー脱出ゲーム 予約システム</h1>

      {/* アクティブな予約カード */}
      {activeReservation ? (
        <div className="card text-center">
          <h2 className="text-xl font-semibold mb-4 text-blue-600">現在のアクティブな予約</h2>
          <div className="card-inner text-left max-w-md mx-auto space-y-3">
            <p><b>代表者（チーム名）:</b> {activeReservation.name}</p>
            <p><b>予約日時:</b> {activeReservation.reservation_date} {activeReservation.reservation_time}</p>
            <p>
              <b>ステータス:</b>{' '}
              <span className={activeReservation.status === 'reserved' ? 'badge-reserved' : 'badge-playing'}>
                {activeReservation.status === 'reserved' ? '来場前' : 'プレイ中'}
              </span>
            </p>
            <div className="card-highlight">
              <p className="text-sm font-semibold text-yellow-800">チェックインコード:</p>
              <p className="text-3xl font-mono font-extrabold text-center tracking-widest text-gray-900 my-1">
                {activeReservation.checkin_code}
              </p>
              <p className="text-xs text-yellow-700 text-center">※受付でこのコードをご提示ください。</p>
            </div>
          </div>
          {activeReservation.status === 'reserved' && (
            <button
              onClick={() => activeReservation.id && handleCancel(activeReservation.id)}
              className="btn-danger mt-6"
            >
              予約をキャンセルする
            </button>
          )}
        </div>
      ) : (
        /* 新規予約フォーム */
        <div className="space-y-6">
          {/* 1. 日付選択 */}
          <div>
            <label className="form-label">① 開催日を選択してください</label>
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
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* 2. 時間スロット選択 */}
          <div>
            <label className="form-label">② 予約希望時間を選択してください（5分刻み）</label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-60 overflow-y-auto p-3 bg-gray-50 rounded-xl border border-gray-200">
              {allSlots.map((time) => {
                const isMaintenance = settings.maintenanceSlots.includes(time);
                const isBooked = bookedSlots.includes(time);
                const isSelected = selectedTime === time;

                let styleClass = 'slot-btn-available';
                let label = time;

                if (isMaintenance) {
                  styleClass = 'slot-btn-maintenance';
                  label = '休止';
                } else if (isBooked) {
                  styleClass = 'slot-btn-booked';
                  label = '満席';
                } else if (isSelected) {
                  styleClass = 'slot-btn-selected';
                }

                return (
                  <button
                    key={time}
                    disabled={isMaintenance || isBooked}
                    onClick={() => setSelectedTime(time)}
                    className={`slot-btn ${styleClass}`}
                  >
                    <span>{time}</span>
                    <span className="text-[10px] opacity-75">{label === time ? '〇' : label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. 代表者名入力 */}
          <form onSubmit={handleReserve} className="card space-y-4">
            <div>
              <label className="form-label">③ 代表者名（またはチーム名）</label>
              <input
                type="text"
                required
                placeholder="例: チーム高専 / 高専太郎"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-text"
              />
            </div>

            <div className="text-sm mb-4 text-red-600">
              <b className="text-red-600">個人情報は入力しないでください</b>
            </div>

            <div className="text-sm text-gray-600">
              選択日時: <b className="text-blue-600">{selectedDate} {selectedTime || '未選択'}</b>
            </div>

            <button
              type="submit"
              disabled={!selectedTime || !name.trim() || submitting}
              className="btn-primary"
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
