'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { subscribeRankingByDifficulty, formatScore } from '@/lib/reservations';
import { Reservation } from '@/types';

export default function HomePage() {
  const [difficulty, setDifficulty] = useState<number>(1);
  const [topRankings, setTopRankings] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [scrollY, setScrollY] = useState<number>(0);

  // パララックス用スクロール位置のリアルタイム監視
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 難易度別TOP3のリアルタイム購読
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeRankingByDifficulty(difficulty, 3, (data) => {
      setTopRankings(data.slice(0, 3));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [difficulty]);

  return (
    <div className="relative min-h-screen bg-gray-950 text-gray-100 selection:bg-red-500 selection:text-white overflow-hidden">
      
      {/* =========================================================================
         多重スクロール（パララックス）背景レイヤー群
         ========================================================================= */}

      {/* レイヤー 1: 深層 - サイバーグリッド & アンビエントオーラ (スクロール速度: 0.15x) */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-40 transition-transform duration-75 ease-out"
        style={{
          transform: `translate3d(0, ${scrollY * 0.05}px, 0)`,
          willChange: 'transform',
        }}
      >
        {/* 背景サイバーグリッド */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-linear(to right, rgba(239, 68, 68, 0.07) 3px, transparent 3px),
              linear-linear(to bottom, rgba(239, 68, 68, 0.07) 3px, transparent 3px)
            `,
            backgroundSize: '25px 25px',
          }}
        />
        {/* 大きな赤・オレンジの背景オーラ */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-red-800/15 rounded-full blur-3xl" />
      </div>

      {/* レイヤー 2: 中層 - 斜め・縦方向レーザービーム線 (スクロール速度: 0.35x) */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-60 transition-transform duration-75 ease-out"
        style={{
          transform: `translate3d(0, ${scrollY * 0.1}px, 0)`,
          willChange: 'transform',
        }}
      >
        {/* 斜めレーザー光線 1 */}
        <div
          className="absolute top-24 -left-20 w-[140%] h-0.5 bg-linear-to-r from-transparent via-red-500 to-transparent -rotate-12 shadow-[0_0_12px_#ef4444]"
        />
        {/* 斜めレーザー光線 2 */}
        <div
          className="absolute top-120 -right-20 w-[140%] h-0.5 bg-linear-to-r from-transparent via-orange-500 to-transparent rotate-6 shadow-[0_0_15px_#f97316]"
        />
        {/* 縦方向のレーザーセンサー光線 */}
        <div
          className="absolute top-96 left-1/4 w-px h-96 bg-linear-to-b from-transparent via-red-500/50 to-transparent shadow-[0_0_8px_#ef4444]"
        />
        <div
          className="absolute top-175 right-1/4 w-px h-80 bg-linear-to-b from-transparent via-amber-500/50 to-transparent shadow-[0_0_8px_#f59e0b]"
        />
      </div>

      {/* レイヤー 3: 前景層 - 光のスパーク・浮遊粒子 (スクロール速度: 0.55x) */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-80 transition-transform duration-75 ease-out"
        style={{
          transform: `translate3d(0, ${scrollY * 0.3}px, 0)`,
          willChange: 'transform',
        }}
      >
        {/* 浮遊する光の粒子（スパーク） */}
        <div className="absolute top-40 left-12 w-2 h-2 bg-red-400 rounded-full blur-[1px] animate-pulse" />
        <div className="absolute top-80 right-20 w-3 h-3 bg-amber-400 rounded-full blur-[1px] shadow-[0_0_10px_#f59e0b] animate-pulse" />
        <div className="absolute top-162.5 left-1/3 w-2 h-2 bg-orange-500 rounded-full blur-[1px] animate-pulse" />
        <div className="absolute top-212.5 right-1/3 w-2.5 h-2.5 bg-red-500 rounded-full blur-[1px] shadow-[0_0_8px_#ef4444] animate-pulse" />
      </div>

      {/* =========================================================================
         メインコンテンツ層 (z-10 で背景の前面に表示)
         ========================================================================= */}

      {/* 共通ナビゲーションバー */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-extrabold text-lg tracking-wider text-transparent bg-clip-text bg-linear-to-r from-red-500 via-orange-400 to-yellow-300">
            ⚡ ボタンラッシュ
          </Link>
          <nav className="flex items-center gap-1 sm:gap-3 text-xs sm:text-sm font-semibold">
            <Link href="/" className="px-2.5 py-1.5 rounded-lg bg-gray-800 text-white border border-gray-700">
              トップ
            </Link>
            <Link href="/reserve" className="px-2.5 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition">
              🎟️ 予約
            </Link>
            <Link href="/ranking" className="px-2.5 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition">
              🏆 順位
            </Link>
            <Link href="/admin" className="px-2.5 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition">
              ⚙️ 管理
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        {/* 1. ヒーローセクション */}
        <section className="relative py-16 sm:py-20 px-4 text-center max-w-4xl mx-auto flex flex-col items-center justify-center">
          <div className="inline-block px-4 py-1 mb-4 rounded-full bg-red-950/80 border border-red-500/50 text-red-300 text-xs sm:text-sm font-semibold tracking-wide uppercase animate-pulse">
            ⚡ 2026 高専祭 アトラクション ⚡
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-linear-to-r from-red-500 via-orange-400 to-yellow-300">
            ボタンラッシュ
          </h1>
          <p className="text-gray-300 text-base sm:text-lg max-w-2xl mb-8 leading-relaxed">
            各所に設置されたボタンをできるだけ早く押せ！<br className="hidden sm:inline" />
            ライバルとスコアを競い合い、ランキングで頂点を目指そう。
          </p>

          {/* 予約・ランキングボタン */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <Link
              href="/reserve"
              className="flex-1 py-4 px-8 bg-linear-to-tl from-red-700 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-bold rounded-xl shadow-lg shadow-red-900/10 transform hover:translate-y-0.5 transition duration-200 text-center text-lg"
            >
              今すぐ予約する
            </Link>
            <Link
              href="/ranking"
              className="py-4 px-6 bg-gray-900/90 hover:bg-gray-800 text-gray-200 font-bold rounded-xl border border-gray-700 text-center transition duration-200 backdrop-blur-sm transform hover:translate-y-1"
            >
              🏆 全順位を見る
            </Link>
          </div>
        </section>

        {/* 2. ゲーム難易度・ルール紹介 */}
        <section className="py-10 px-4 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8 border-b border-gray-800 pb-4 text-white">
            🎮 選べる3つの難易度
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-900/80 backdrop-blur-sm border border-green-500/30 rounded-2xl p-6 shadow-md hover:border-green-500/60 transition transform hover:translate-y-1">
              <div className="text-green-400 text-xs font-bold uppercase tracking-wider mb-2">EASY MODE</div>
              <h3 className="text-xl font-bold mb-2 text-white">LEVEL 1：初級</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                ボタンを押せる時間が長く、ゆったりと遊べます。<br />
                脱出ゲームが初めての方や小さなお子様におすすめ！
              </p>
            </div>
            <div className="bg-gray-900/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-6 shadow-md hover:border-yellow-500/60 transition transform hover:translate-y-1">
              <div className="text-yellow-400 text-xs font-bold uppercase tracking-wider mb-2">NORMAL MODE</div>
              <h3 className="text-xl font-bold mb-2 text-white">LEVEL 2：中級</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                ボタンが光る間隔が短くなります。反射神経と瞬発力が試される！
              </p>
            </div>
            <div className="bg-gray-900/80 backdrop-blur-sm border border-red-500/30 rounded-2xl p-6 shadow-md hover:border-red-500/60 transition transform hover:translate-y-1">
              <div className="text-red-400 text-xs font-bold uppercase tracking-wider mb-2">HARD MODE</div>
              <h3 className="text-xl font-bold mb-2 text-white">LEVEL 3：上級</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                ボタンが光る間隔がとても短くなり、より高いパフォーマンスが求められます。<br />
                歴代最速タイムに挑戦せよ！
              </p>
            </div>
          </div>
        </section>

        {/* 3. 簡易版ランキング埋め込みセクション */}
        <section className="py-10 px-4 max-w-4xl mx-auto">
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                  🏆 TOP 3 リアルタイム順位
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">最新の最速タイムトップ3を即座に反映しています</p>
              </div>

              {/* 難易度切り替えタブ */}
              <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800">
                {[1, 2, 3].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setDifficulty(lvl)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                      difficulty === lvl
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
            ) : topRankings.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm bg-gray-950/60 rounded-xl border border-gray-800">
                まだ Lv.{difficulty} のクリア記録がありません。あなたが最初のチャレンジャーになろう！
              </div>
            ) : (
              <div className="space-y-3">
                {topRankings.map((item, index) => {
                  const medals = ['🥇 1st', '🥈 2nd', '🥉 3rd'];
                  const badgeColors = [
                    'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
                    'bg-slate-300/20 text-slate-200 border-slate-300/50',
                    'bg-amber-600/20 text-amber-300 border-amber-600/50',
                  ];

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3.5 bg-gray-950/70 border border-gray-800 rounded-xl"
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
                          {formatScore(item.score)}
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
              className="p-3 inline-flex gap-1.5 bg-gray-800/90 hover:bg-gray-700 text-red-400 hover:text-red-300 font-semibold rounded-xl border border-gray-700 text-center transition duration-200 backdrop-blur-sm transform hover:translate-y-1"
            >
                全体のランキングを見る（全順位・ログ） →
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* フッター */}
      <footer className="relative z-10 py-8 px-4 text-center text-gray-500 text-xs border-t border-gray-800 mt-12">
        <p className="mb-2">© 2026 ボタンラッシュ 開発チーム | 高専祭展示</p>
        <Link href="/admin" className="text-gray-500 hover:text-gray-300 underline">
          関係者・スタッフログイン（管理画面）
        </Link>
      </footer>
    </div>
  );
}
