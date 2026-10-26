'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { subscribeRankingByDifficulty, formatClearTime } from '@/lib/reservations';
import { Reservation } from '@/types';

export default function HomePage() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<number>(1);
  const [top3List, setTop3List] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 難易度別TOP3のリアルタイム購読
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeRankingByDifficulty(
      selectedDifficulty,
      3,
      (data: Reservation[]) => {
        setTop3List(data.slice(0, 3));
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [selectedDifficulty]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
      {/* 1. ヒーローセクション */}
      <section className="relative py-20 px-4 text-center max-w-4xl mx-auto flex flex-col items-center justify-center">
        <div className="inline-block px-4 py-1 mb-4 rounded-full bg-red-900/60 border border-red-500/50 text-red-300 text-sm font-semibold tracking-wide uppercase animate-pulse">
          ⚡ 2026 高専祭 アトラクション ⚡
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-orange-400 to-yellow-300">
          レーザー脱出ゲーム
        </h1>
        <p className="text-gray-300 text-lg sm:text-xl max-w-2xl mb-8 leading-relaxed">
          張り巡らされたレーザーセンサーを掻い潜り、最速で脱出ボタンを押せ！<br className="hidden sm:inline" />
          友達とクリアタイムを競い合い、難易度別ランキングで頂点を目指そう。
        </p>

        {/* 予約・ランキングボタン */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <Link
            href="/reserve"
            className="flex-1 py-4 px-8 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-bold rounded-xl shadow-lg shadow-red-900/40 transform hover:-translate-y-0.5 transition duration-200 text-center text-lg"
          >
            🎟️ 今すぐ予約する
          </Link>
          <Link
            href="/ranking"
            className="py-4 px-6 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold rounded-xl border border-gray-700 text-center transition duration-200"
          >
            🏆 全順位を見る
          </Link>
        </div>
      </section>

      {/* 2. ゲーム難易度・ルール紹介 */}
      <section className="py-12 px-4 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8 border-b border-gray-800 pb-4">
          🎮 選べる3つの難易度
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800/80 border border-green-500/30 rounded-2xl p-6 shadow-md hover:border-green-500/60 transition">
            <div className="text-green-400 text-xs font-bold uppercase tracking-wider mb-2">EASY MODE</div>
            <h3 className="text-xl font-bold mb-2 text-white">LEVEL 1：初級</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              レーザー本数が少なく、基本動作でクリア可能。脱出ゲームが初めての方や小さなお子様におすすめ！
            </p>
          </div>
          <div className="bg-gray-800/80 border border-yellow-500/30 rounded-2xl p-6 shadow-md hover:border-yellow-500/60 transition">
            <div className="text-yellow-400 text-xs font-bold uppercase tracking-wider mb-2">NORMAL MODE</div>
            <h3 className="text-xl font-bold mb-2 text-white">LEVEL 2：中級</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              格子状に配置されたレーザーを匍匐前進やジャンプでかわす標準コース。スピードと柔軟性が試される！
            </p>
          </div>
          <div className="bg-gray-800/80 border border-red-500/30 rounded-2xl p-6 shadow-md hover:border-red-500/60 transition">
            <div className="text-red-400 text-xs font-bold uppercase tracking-wider mb-2">HARD MODE</div>
            <h3 className="text-xl font-bold mb-2 text-white">LEVEL 3：上級</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              超極細のレーザー網！わずかな接触も許されない最高難易度コース。歴代最速タイムに挑戦せよ！
            </p>
          </div>
        </div>
      </section>

      {/* 3. 簡易版ランキング埋め込みセクション */}
      <section className="py-12 px-4 max-w-4xl mx-auto">
        <div className="bg-gray-800/90 border border-gray-700 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                🏆 TOP 3 リアルタイム順位
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">最新の最速タイムトップ3を即座に反映しています</p>
            </div>

            {/* 難易度切り替えタブ */}
            <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-700">
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

          {/* ランキング表示コンテンツ */}
          {loading ? (
            <div className="py-10 text-center text-gray-400 text-sm">読み込み中...</div>
          ) : top3List.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm bg-gray-900/50 rounded-xl border border-gray-800">
              まだ Lv.{selectedDifficulty} のクリア記録がありません。あなたが最初の達成者になろう！
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
                    className="flex items-center justify-between p-3.5 bg-gray-900/70 border border-gray-700/60 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2.5 py-1 text-xs font-extrabold rounded-md border font-mono ${badgeColors[index]}`}
                      >
                        {medals[index]}
                      </span>
                      <span className="font-semibold text-white text-base">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-extrabold font-mono text-amber-400">
                        {formatClearTime(item.clear_time)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/ranking"
              className="inline-flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 font-semibold transition"
            >
              全体のランキングを見る（全位・過去ログ） →
            </Link>
          </div>
        </div>
      </section>

      {/* 4. フッター・関係者リンク */}
      <footer className="py-8 px-4 text-center text-gray-500 text-xs border-t border-gray-800 mt-12">
        <p className="mb-2">© 2026 レーザー脱出ゲーム 開発チーム | 高専祭展示</p>
        <Link href="/admin" className="text-gray-600 hover:text-gray-400 underline">
          関係者・スタッフログイン（管理画面）
        </Link>
      </footer>
    </div>
  );
}
