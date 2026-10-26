'use client';

import { useState, useEffect } from 'react';
import { subscribeRankingByDifficulty, formatClearTime } from '@/lib/reservations';
import { Reservation } from '@/types';
import Link from 'next/link';

export default function RankingPage() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<number>(1);
  const [rankingList, setRankingList] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeRankingByDifficulty(selectedDifficulty, (data) => {
      setRankingList(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [selectedDifficulty]);

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">🏆 クリアタイムランキング</h1>
          <p className="text-xs text-gray-500 mt-1">リアルタイムで順位が更新されます</p>
        </div>
        <Link href="/" className="btn-secondary">
          トップに戻る
        </Link>
      </div>

      {/* 難易度切り替えタブ */}
      <div className="tab-bar justify-center">
        {[1, 2, 3].map((lvl) => (
          <button
            key={lvl}
            onClick={() => setSelectedDifficulty(lvl)}
            className={selectedDifficulty === lvl ? 'tab-btn-active' : 'tab-btn'}
          >
            Level {lvl} {lvl === 1 ? '初級' : lvl === 2 ? '中級' : '上級'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center font-bold text-gray-500">ランキング読み込み中...</div>
      ) : rankingList.length === 0 ? (
        <div className="card text-center text-gray-500 py-12">
          まだ Level {selectedDifficulty} のクリア記録がありません。最初の達成者になりましょう！
        </div>
      ) : (
        <div className="space-y-3">
          {rankingList.map((item, index) => {
            const rank = index + 1;
            let rankBadge = `${rank}位`;
            let rankStyle = 'bg-white border-gray-200';

            if (rank === 1) {
              rankBadge = '🥇 1位';
              rankStyle = 'bg-yellow-50 border-yellow-300 ring-2 ring-yellow-400/50';
            } else if (rank === 2) {
              rankBadge = '🥈 2位';
              rankStyle = 'bg-slate-50 border-slate-300';
            } else if (rank === 3) {
              rankBadge = '🥉 3位';
              rankStyle = 'bg-amber-50/60 border-amber-300';
            }

            return (
              <div
                key={item.id}
                className={`card flex items-center justify-between p-4 transition ${rankStyle}`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-lg font-black text-gray-700 w-16">{rankBadge}</span>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{item.name}</h3>
                    <p className="text-xs text-gray-500 font-mono">
                      {item.reservation_date} {item.reservation_time}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-mono font-extrabold text-blue-600">
                    {formatClearTime(item.clear_time)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
