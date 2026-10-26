'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getAllReservations,
  checkInWithCode,
  recordClearResult,
  cancelReservation,
  getOperationalSettings,
  updateOperationalSettings,
  DEFAULT_SETTINGS,
} from '@/lib/reservations';
import { Reservation, OperationalSettings } from '@/types';

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<'checkin' | 'reservations' | 'settings'>('checkin');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [settings, setSettings] = useState<OperationalSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);

  const [checkinCode, setCheckinCode] = useState('');
  const [checkinMessage, setCheckinMessage] = useState('');

  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [clearTimeInput, setClearTimeInput] = useState('');
  const [difficulty, setDifficulty] = useState<number>(1);

  const [newMaintenanceSlot, setNewMaintenanceSlot] = useState('');

  // 認証状態の監視（※ 匿名ユーザーは管理者として認めない）
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && !currentUser.isAnonymous) {
        setUser(currentUser);
        loadAdminData();
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [resData, settingsData] = await Promise.all([
        getAllReservations(),
        getOperationalSettings(),
      ]);
      setReservations(resData);
      setSettings(settingsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setLoginError('メールアドレスまたはパスワードが正しくありません。');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkinCode.trim()) return;
    try {
      setCheckinMessage('照合中...');
      const res = await checkInWithCode(checkinCode);
      setCheckinMessage(`✅ チェックイン完了: ${res.name} 様 (${res.reservation_date} ${res.reservation_time})`);
      setCheckinCode('');
      await loadAdminData();
    } catch (err: any) {
      if (err.message === 'NOT_FOUND') setCheckinMessage('❌ 一致する予約が見つかりません。');
      else if (err.message === 'ALREADY_PLAYING') setCheckinMessage('⚠️ 既にチェックイン済み（プレイ中）です。');
      else if (err.message === 'ALREADY_CLEARED') setCheckinMessage('⚠️ 既にゲーム終了済みの予約です。');
      else setCheckinMessage('❌ エラーが発生しました。');
    }
  };

  const handleSaveClearTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRes || !selectedRes.id) return;

    let seconds = NaN;
    const parts = clearTimeInput.split(':');
    if (parts.length === 2) {
      seconds = parseInt(parts[0], 10) * 60 + parseFloat(parts[1]);
    } else {
      seconds = parseFloat(clearTimeInput);
    }

    if (isNaN(seconds) || seconds <= 0) {
      alert('有効なタイムを入力してください（例: 01:45.50 または 105.5）');
      return;
    }

    try {
      await recordClearResult(selectedRes.id, Math.round(seconds * 100) / 100, difficulty);
      alert('クリアタイムと難易度を記録しました！');
      setSelectedRes(null);
      setClearTimeInput('');
      await loadAdminData();
    } catch (err) {
      alert('記録に失敗しました。');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この予約を削除しますか？')) return;
    try {
      await cancelReservation(id);
      await loadAdminData();
    } catch (err) {
      alert('削除に失敗しました。');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateOperationalSettings(settings);
      alert('✅ 時間・メンテナンス設定を更新しました！');
      await loadAdminData();
    } catch (err) {
      alert('設定の保存に失敗しました。');
    }
  };

  const handleAddMaintenanceSlot = () => {
    if (!newMaintenanceSlot.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      alert('時刻は HH:MM 形式で入力してください（例: 12:55）');
      return;
    }
    if (settings.maintenanceSlots.includes(newMaintenanceSlot)) {
      alert('既に登録されています。');
      return;
    }
    const updated = [...settings.maintenanceSlots, newMaintenanceSlot].sort();
    setSettings({ ...settings, maintenanceSlots: updated });
    setNewMaintenanceSlot('');
  };

  const handleRemoveMaintenanceSlot = (slot: string) => {
    const updated = settings.maintenanceSlots.filter((s) => s !== slot);
    setSettings({ ...settings, maintenanceSlots: updated });
  };

  if (authLoading) return <div className="min-h-screen bg-gray-950 text-gray-300 flex items-center justify-center font-mono">認証確認中...</div>;

  // ログイン前画面
  if (!user) {
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

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md space-y-6">
            <div className="text-center space-y-1">
              <h1 className="text-xl font-bold text-white">⚙️ 関係者ログイン</h1>
              <p className="text-xs text-gray-400">管理者用のアカウントでログインしてください</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-300">メールアドレス</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-300">パスワード</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {loginError && <p className="text-red-400 text-xs font-semibold text-center">{loginError}</p>}

              <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition">
                ログイン
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // ログイン後管理画面
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

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-6">
        <div className="flex justify-between items-center border-b border-gray-800 pb-4">
          <h1 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
            <span>🛠️</span> <span>脱出ゲーム 管理システム</span>
          </h1>
          <button onClick={handleLogout} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-lg border border-gray-700">
            ログアウト
          </button>
        </div>

        {/* タブナビゲーション */}
        <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-800">
          <button
            onClick={() => setActiveTab('checkin')}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition ${
              activeTab === 'checkin' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            🎟️ チェックイン
          </button>
          <button
            onClick={() => setActiveTab('reservations')}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition ${
              activeTab === 'reservations' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            📅 予約・記録
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition ${
              activeTab === 'settings' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            ⚙️ 時間設定
          </button>
        </div>

        {/* タブ1: チェックイン */}
        {activeTab === 'checkin' && (
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl max-w-md mx-auto space-y-4">
            <h2 className="text-base font-bold text-white text-center">受付チェックイン</h2>
            <form onSubmit={handleCheckIn} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-400 text-center">6桁のチェックインコード</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="例: A7B9C3"
                  value={checkinCode}
                  onChange={(e) => setCheckinCode(e.target.value)}
                  className="w-full text-center text-3xl font-mono font-black tracking-widest p-3 bg-gray-950 border border-gray-800 rounded-xl text-amber-400 uppercase focus:outline-none focus:border-amber-500"
                />
              </div>
              <button type="submit" className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition">
                チェックイン実行
              </button>
            </form>
            {checkinMessage && (
              <p className="p-3 bg-gray-950 border border-gray-800 rounded-xl text-center font-bold text-sm text-gray-200">
                {checkinMessage}
              </p>
            )}
          </div>
        )}

        {/* タブ2: 予約一覧 & タイム記録 */}
        {activeTab === 'reservations' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-white">全予約リスト ({reservations.length}件)</h2>
              <button onClick={loadAdminData} className="text-xs px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-gray-300 hover:bg-gray-800">
                再読み込み
              </button>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-xl overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-gray-950 border-b border-gray-800 text-gray-400 font-mono">
                  <tr>
                    <th className="p-3">日時</th>
                    <th className="p-3">代表者</th>
                    <th className="p-3">コード</th>
                    <th className="p-3">状態</th>
                    <th className="p-3">結果</th>
                    <th className="p-3">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {reservations.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-800/40">
                      <td className="p-3 font-mono text-gray-300">{r.reservation_date} {r.reservation_time}</td>
                      <td className="p-3 font-semibold text-white">{r.name}</td>
                      <td className="p-3 font-mono font-bold text-amber-400">{r.checkin_code}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 text-[10px] rounded font-bold ${
                          r.status === 'reserved' ? 'bg-yellow-950 text-yellow-300 border border-yellow-800' :
                          r.status === 'playing' ? 'bg-blue-950 text-blue-300 border border-blue-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {r.status === 'reserved' ? '来場前' : r.status === 'playing' ? 'プレイ中' : '終了'}
                        </span>
                      </td>
                      <td className="p-3 text-xs">
                        {r.status === 'cleared' ? (
                          <span>
                            <b className="text-amber-400">Lv.{r.difficulty_level ?? 1}</b> ({r.clear_time}秒)
                          </span>
                        ) : '-'}
                      </td>
                      <td className="p-3 space-x-2">
                        {r.status !== 'cleared' && (
                          <button
                            onClick={() => {
                              setSelectedRes(r);
                              setClearTimeInput('');
                              setDifficulty(1);
                            }}
                            className="px-2 py-1 bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold rounded"
                          >
                            タイム登録
                          </button>
                        )}
                        <button
                          onClick={() => r.id && handleDelete(r.id)}
                          className="px-2 py-1 bg-red-600/80 hover:bg-red-500 text-white text-[10px] font-bold rounded"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* タブ3: 設定 */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl space-y-6 max-w-lg mx-auto">
            <h2 className="text-base font-bold text-white border-b border-gray-800 pb-2">営業時間・メンテナンス設定</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-300">開始時間 (時)</label>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={settings.startHour}
                  onChange={(e) => setSettings({ ...settings, startHour: parseInt(e.target.value, 10) || 0 })}
                  className="w-full p-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-300">終了時間 (時)</label>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={settings.endHour}
                  onChange={(e) => setSettings({ ...settings, endHour: parseInt(e.target.value, 10) || 0 })}
                  className="w-full p-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-300">休止枠（予約不可時間）</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="例: 12:55"
                  value={newMaintenanceSlot}
                  onChange={(e) => setNewMaintenanceSlot(e.target.value)}
                  className="flex-1 p-2 bg-gray-950 border border-gray-800 rounded-xl text-xs font-mono text-white"
                />
                <button
                  type="button"
                  onClick={handleAddMaintenanceSlot}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded-xl border border-gray-700"
                >
                  追加
                </button>
              </div>

              <div className="flex flex-wrap gap-2 p-3 bg-gray-950 rounded-xl border border-gray-800">
                {settings.maintenanceSlots.map((slot) => (
                  <span key={slot} className="inline-flex items-center gap-1.5 bg-gray-900 border border-gray-800 px-2.5 py-1 rounded-lg text-xs font-mono text-gray-200">
                    🛠️ {slot}
                    <button
                      type="button"
                      onClick={() => handleRemoveMaintenanceSlot(slot)}
                      className="text-red-400 font-bold ml-1 hover:text-red-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition">
              設定を保存する
            </button>
          </form>
        )}

        {/* タイム登録モーダル */}
        {selectedRes && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-white">クリアタイム＆難易度記録</h3>
              <p className="text-xs text-gray-400">
                挑戦者: <b className="text-white">{selectedRes.name}</b> ({selectedRes.reservation_time})
              </p>
              <form onSubmit={handleSaveClearTime} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-300">クリアコース (難易度)</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(parseInt(e.target.value, 10))}
                    className="w-full p-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white text-sm"
                  >
                    <option value={1}>レベル 1 (初級)</option>
                    <option value={2}>レベル 2 (中級)</option>
                    <option value={3}>レベル 3 (上級)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-300">クリアタイム (mm:ss.ss または 秒数)</label>
                  <input
                    type="text"
                    required
                    placeholder="例: 01:45.50"
                    value={clearTimeInput}
                    onChange={(e) => setClearTimeInput(e.target.value)}
                    className="w-full p-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white font-mono text-sm"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRes(null)}
                    className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-xl font-bold"
                  >
                    キャンセル
                  </button>
                  <button type="submit" className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-xl">
                    記録保存
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
