'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { subscribeRankingByDifficulty, formatClearTime } from '@/lib/reservations';
import { Reservation } from '@/types';

export default function HomePage() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<number>(1);
  const [top3List, setTop3List] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeRankingByDifficulty(selectedDifficulty, 3, (data: Reservation[]) => {
      setTop3List(data.slice(0, 3));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [selectedDifficulty]);

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

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-12">
        {/* 1. ヒーローセクション */}
        <section className="text-center py-10 sm:py-16 space-y-6 relative overflow-hidden rounded-3xl bg-linear-to-b from-gray-900 via-gray-900/60 to-transparent border border-gray-800 p-6">
          <div className="inline-block px-4 py-1.5 rounded-full bg-red-950/80 border border-red-500/40 text-red-400 text-xs sm:text-sm font-semibold tracking-widest uppercase animate-pulse">
            ⚡ 2026 高専祭 アトラクション ⚡
          </div>
          <h1 className="text-3xl sm:text-6xl font-black tracking-tight bg-linear-to-r from-red-500 via-orange-400 to-yellow-300 bg-clip-text text-transparent leading-tight">
            レーザー脱出ゲーム
          </h1>
          <p className="text-gray-300 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed">
            張り巡らされたレーザー網を掻い潜り、最速で脱出ボタンを押せ！<br className="hidden sm:inline" />
            友達とタイムを競い合い、難易度別ランキングの頂点を目指せ。
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 max-w-md mx-auto">
            <Link
              href="/reserve"
              className="flex-1 py-4 px-6 bg-linear-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-bold rounded-xl shadow-lg shadow-red-950/50 transition duration-200 text-center text-base sm:text-lg"
            >
              🎟️ 今すぐ挑戦を予約する
            </Link>
            <Link
              href="/ranking"
              className="py-4 px-6 bg-gray-900 hover:bg-gray-800 text-gray-200 font-bold rounded-xl border border-gray-800 text-center transition duration-200 text-base"
            >
              🏆 全ランキングを見る
            </Link>
          </div>
        </section>

        {/* 2. コース（難易度）紹介 */}
        <section className="space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-center text-white flex items-center justify-center gap-2">
            <span>🎮</span> <span>選べる3つの難易度</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-900/90 border border-green-500/30 rounded-2xl p-6 space-y-3 hover:border-green-500/60 transition shadow-lg">
              <span className="text-green-400 text-xs font-mono font-bold tracking-widest uppercase block">EASY MODE</span>
              <h3 className="text-lg font-bold text-white">LEVEL 1：初級</h3>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                レーザー本数が少なく基本動作で突破可能。初めての方や小さなお子様におすすめ！
              </p>
            </div>
            <div className="bg-gray-900/90 border border-yellow-500/30 rounded-2xl p-6 space-y-3 hover:border-yellow-500/60 transition shadow-lg">
              <span className="text-yellow-400 text-xs font-mono font-bold tracking-widest uppercase block">NORMAL MODE</span>
              <h3 className="text-lg font-bold text-white">LEVEL 2：中級</h3>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                格子状レーザーを匍匐前進やジャンプでかわす標準コース。スピードと柔軟性が試される！
              </p>
            </div>
            <div className="bg-gray-900/90 border border-red-500/30 rounded-2xl p-6 space-y-3 hover:border-red-500/60 transition shadow-lg">
              <span className="text-red-400 text-xs font-mono font-bold tracking-widest uppercase block">HARD MODE</span>
              <h3 className="text-lg font-bold text-white">LEVEL 3：上級</h3>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                超極細レーザー網！わずかな接触も即失敗の最高難易度。歴代最速記録に挑め！
              </p>
            </div>
          </div>
        </section>

        {/* 3. 簡易版埋め込みランキング (TOP 3) */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span>🏆</span> <span>TOP 3 リアルタイム順位</span>
                <span className="inline-flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">上位3件のクリアタイムをリアルタイム反映中</p>
            </div>

            {/* 難易度切り替えタブ */}
            <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800">
              {[1, 2, 3].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedDifficulty(lvl)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    selectedDifficulty === lvl
                      ? 'bg-red-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Lv.{lvl}
                </button>
              ))}
            </div>
          </div>

          {/* ランキングリスト */}
          {loading ? (
            <div className="py-8 text-center text-gray-400 text-sm font-mono">ランキング読み込み中...</div>
          ) : top3List.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm bg-gray-950/50 rounded-xl border border-gray-800">
              まだ Lv.{selectedDifficulty} のクリア記録がありません。最初の達成者になろう！
            </div>
          ) : (
            <div className="space-y-3">
              {top3List.map((item, index) => {
                const medals = ['🥇 1st', '🥈 2nd', '🥉 3rd'];
                const badgeColors = [
                  'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
                  'bg-slate-300/20 text-slate-200 border-slate-300/50',
                  'bg-amber-600/20 text-amber-300 border-amber-600/50',
                ];

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3.5 bg-gray-950/80 border border-gray-800 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 text-xs font-black rounded-md border font-mono ${badgeColors[index]}`}>
                        {medals[index]}
                      </span>
                      <span className="font-semibold text-white text-sm sm:text-base">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-base sm:text-lg font-extrabold font-mono text-amber-400">
                        {formatClearTime(item.clear_time)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-2 text-center">
            <Link
              href="/ranking"
              className="inline-flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 font-semibold transition"
            >
              全順位・ランキングページへ移動 →
            </Link>
          </div>
        </section>
      </main>

      <footer className="py-6 text-center text-xs text-gray-500 border-t border-gray-900">
        © 2026 レーザー脱出ゲーム 開発チーム | 高専祭展示
      </footer>
    </div>
  );
}
