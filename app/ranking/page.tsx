'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { subscribeRankingByDifficulty, formatClearTime } from '@/lib/reservations';
import { Reservation } from '@/types';

const DIFFICULTY_CONFIG = [
  { level: 1, name: 'レベル 1', subtitle: '初級 (イージー)', color: 'from-green-500 to-emerald-700', badge: 'bg-green-100 text-green-800' },
  { level: 2, name: 'レベル 2', subtitle: '中級 (ノーマル)', color: 'from-blue-500 to-indigo-700', badge: 'bg-blue-100 text-blue-800' },
  { level: 3, name: 'レベル 3', subtitle: '上級 (ハード)', color: 'from-purple-600 to-red-700', badge: 'bg-purple-100 text-purple-800' },
];

export default function RankingPage() {
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [rankings, setRankings] = useState<{ [key: number]: Reservation[] }>({
    1: [],
    2: [],
    3: [],
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    // 各難易度のリアルタイムランキングを購読
    const unsub1 = subscribeRankingByDifficulty(1, 10, (data) => {
      setRankings((prev) => ({ ...prev, 1: data }));
      setLoading(false);
    });
    const unsub2 = subscribeRankingByDifficulty(2, 10, (data) => {
      setRankings((prev) => ({ ...prev, 2: data }));
    });
    const unsub3 = subscribeRankingByDifficulty(3, 10, (data) => {
      setRankings((prev) => ({ ...prev, 3: data }));
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, []);

  // 順位ごとのメダル・スタイリング設定
  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return {
          icon: '🥇',
          label: '1st',
          bg: 'bg-amber-100 border-amber-300 text-amber-900',
          badgeBg: 'bg-amber-500 text-white',
        };
      case 1:
        return {
          icon: '🥈',
          label: '2nd',
          bg: 'bg-slate-100 border-slate-300 text-slate-800',
          badgeBg: 'bg-slate-400 text-white',
        };
      case 2:
        return {
          icon: '🥉',
          label: '3rd',
          bg: 'bg-orange-100 border-orange-300 text-orange-900',
          badgeBg: 'bg-amber-700 text-white',
        };
      default:
        return {
          icon: `#${index + 1}`,
          label: `${index + 1}th`,
          bg: 'bg-white border-gray-200 text-gray-800',
          badgeBg: 'bg-gray-200 text-gray-700',
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* ヘッダー */}
        <div className="text-center space-y-3">
          <div className="inline-block px-3 py-1 bg-red-950/80 border border-red-500/40 text-red-400 rounded-full text-xs font-mono tracking-widest uppercase">
            ⚡ リアルタイムタイムアタック ⚡
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-red-500 via-amber-400 to-yellow-300 bg-clip-text text-transparent">
            脱出タイムランキング
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
            レーザー防衛システムを突破し、機密文書を奪還したトップエージェントたちの記録です。
          </p>
        </div>

        {/* 難易度切り替えタブ */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 p-1.5 bg-slate-900 border border-slate-800 rounded-xl">
          {DIFFICULTY_CONFIG.map((conf) => {
            const isSelected = selectedLevel === conf.level;
            return (
              <button
                key={conf.level}
                onClick={() => setSelectedLevel(conf.level)}
                className={`py-3 px-2 sm:px-4 rounded-lg font-bold transition-all text-center flex flex-col items-center justify-center ${
                  isSelected
                    ? `bg-gradient-to-r ${conf.color} text-white shadow-lg shadow-indigo-950/50 scale-[1.02]`
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span className="text-sm sm:text-lg">{conf.name}</span>
                <span className="text-[10px] sm:text-xs opacity-80">{conf.subtitle}</span>
              </button>
            );
          })}
        </div>

        {/* ランキングコンテンツ */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <span>🏆</span>
                <span>{DIFFICULTY_CONFIG.find((c) => c.level === selectedLevel)?.name} ランキング</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Top 10 クリアタイム</p>
            </div>
            <span className="px-2.5 py-1 text-xs font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full animate-pulse">
              ● LIVE
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 font-mono">ランキングを読み込み中...</div>
          ) : rankings[selectedLevel]?.length === 0 ? (
            <div className="py-16 text-center space-y-2 text-slate-500">
              <p className="text-4xl">⏳</p>
              <p className="text-base font-semibold">まだこの難易度の脱出クリア者はいません。</p>
              <p className="text-xs text-slate-600">あなたが最初のランクインエージェントになろう！</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rankings[selectedLevel].map((item, index) => {
                const badge = getRankBadge(index);
                return (
                  <div
                    key={item.id || index}
                    className={`flex items-center justify-between p-3 sm:p-4 rounded-xl border transition-all hover:translate-x-1 ${badge.bg}`}
                  >
                    {/* 順位 & プレイヤー名 */}
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-black text-sm sm:text-base shadow-sm shrink-0 ${badge.badgeBg}`}>
                        {badge.icon}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-sm sm:text-lg truncate">{item.name || '名無しエージェント'}</p>
                        <p className="text-[11px] opacity-75 font-mono">
                          {item.reservation_date} {item.reservation_time} プレイ
                        </p>
                      </div>
                    </div>

                    {/* クリアタイム */}
                    <div className="text-right shrink-0">
                      <span className="text-xs font-semibold opacity-70 block">CLEAR TIME</span>
                      <span className="font-mono font-extrabold text-base sm:text-2xl tracking-wider text-amber-500">
                        {formatClearTime(item.clear_time)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 導線ボタン */}
        <div className="flex justify-center gap-4 pt-4">
          <Link
            href="/reserve"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition transform hover:-translate-y-0.5"
          >
            🗓️ 挑戦を予約する
          </Link>
        </div>

      </div>
    </div>
  );
}
