'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { subscribeRankingByDifficulty, formatClearTime } from '@/lib/reservations';
import { Reservation } from '@/types';

const DIFFICULTY_CONFIG = [
  { level: 1, name: 'レベル 1', subtitle: '初級 (イージー)', color: 'from-green-600 to-emerald-800' },
  { level: 2, name: 'レベル 2', subtitle: '中級 (ノーマル)', color: 'from-amber-600 to-orange-800' },
  { level: 3, name: 'レベル 3', subtitle: '上級 (ハード)', color: 'from-red-600 to-rose-900' },
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

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return {
          icon: '🥇',
          bg: 'bg-amber-950/60 border-amber-500/60',
          badgeBg: 'bg-amber-500 text-black',
        };
      case 1:
        return {
          icon: '🥈',
          bg: 'bg-slate-900 border-slate-500/50',
          badgeBg: 'bg-slate-300 text-black',
        };
      case 2:
        return {
          icon: '🥉',
          bg: 'bg-amber-950/30 border-amber-700/50',
          badgeBg: 'bg-amber-700 text-white',
        };
      default:
        return {
          icon: `#${index + 1}`,
          bg: 'bg-gray-950/80 border-gray-800',
          badgeBg: 'bg-gray-800 text-gray-300',
        };
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* 共通ナビゲーションヘッダー */}
      <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-black text-lg sm:text-xl tracking-wider bg-gradient-to-r from-red-500 via-orange-400 to-yellow-300 bg-clip-text text-transparent">
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

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-block px-3 py-1 bg-red-950/80 border border-red-500/40 text-red-400 rounded-full text-xs font-mono tracking-widest uppercase">
            ⚡ リアルタイムタイムアタック ⚡
          </div>
          <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-red-500 via-orange-400 to-yellow-300 bg-clip-text text-transparent">
            脱出タイムランキング
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">最速で脱出ボタンを押したトップエージェントの記録</p>
        </div>

        {/* 難易度切り替えタブ */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-gray-900 border border-gray-800 rounded-2xl">
          {DIFFICULTY_CONFIG.map((conf) => {
            const isSelected = selectedLevel === conf.level;
            return (
              <button
                key={conf.level}
                onClick={() => setSelectedLevel(conf.level)}
                className={`py-3 px-2 rounded-xl font-bold transition-all text-center flex flex-col items-center justify-center ${
                  isSelected
                    ? `bg-gradient-to-r ${conf.color} text-white shadow-lg scale-[1.02]`
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <span className="text-xs sm:text-base">{conf.name}</span>
                <span className="text-[10px] sm:text-xs opacity-80 font-normal">{conf.subtitle}</span>
              </button>
            );
          })}
        </div>

        {/* ランキングコンテンツ */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-800">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span>🏆</span>
              <span>{DIFFICULTY_CONFIG.find((c) => c.level === selectedLevel)?.name} ランキング</span>
            </h2>
            <span className="px-2.5 py-1 text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full animate-pulse">
              ● LIVE
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-400 font-mono text-sm">ランキング読み込み中...</div>
          ) : rankings[selectedLevel]?.length === 0 ? (
            <div className="py-12 text-center space-y-2 text-gray-500">
              <p className="text-3xl">⏳</p>
              <p className="text-sm font-semibold text-gray-300">まだこの難易度の脱出クリア者はいません。</p>
              <p className="text-xs text-gray-500">最初のランクイン達成者になろう！</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {rankings[selectedLevel].map((item, index) => {
                const badge = getRankBadge(index);
                return (
                  <div
                    key={item.id || index}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${badge.bg}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black text-xs sm:text-sm shrink-0 ${badge.badgeBg}`}>
                        {badge.icon}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-sm sm:text-base truncate text-white">{item.name || '挑戦者'}</p>
                        <p className="text-[10px] text-gray-400 font-mono">
                          {item.reservation_date} {item.reservation_time}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-semibold text-gray-400 block">CLEAR TIME</span>
                      <span className="font-mono font-extrabold text-base sm:text-xl text-amber-400">
                        {formatClearTime(item.clear_time)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="text-center pt-2">
          <Link
            href="/reserve"
            className="inline-block px-8 py-3.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-bold rounded-xl shadow-lg transition duration-200"
          >
            🎟️ 挑戦を予約する
          </Link>
        </div>
      </main>
    </div>
  );
}
