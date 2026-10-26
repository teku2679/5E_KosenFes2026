'use client';

import { useState, useEffect } from 'react';
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

  // ログインフォーム用
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // 管理機能用ステート
  const [activeTab, setActiveTab] = useState<'checkin' | 'reservations' | 'settings'>('checkin');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [settings, setSettings] = useState<OperationalSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);

  // チェックイン用
  const [checkinCode, setCheckinCode] = useState('');
  const [checkinMessage, setCheckinMessage] = useState('');

  // クリアタイム入力モーダル用
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [clearTimeInput, setClearTimeInput] = useState('');
  const [difficulty, setDifficulty] = useState<number>(1);

  // メンテナンス枠追加用
  const [newMaintenanceSlot, setNewMaintenanceSlot] = useState('');

  // 認証状態の監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        loadAdminData();
      }
    });
    return () => unsubscribe();
  }, []);

  // データ一括読み込み
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

  // ログイン処理
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setLoginError('メールアドレスまたはパスワードが正しくありません。');
    }
  };

  // ログアウト処理
  const handleLogout = async () => {
    await signOut(auth);
  };

  // チェックイン実行
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

  // クリアタイム記録実行
  const handleSaveClearTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRes || !selectedRes.id) return;

    // mm:ss.ss または 秒数 のパース
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

  // 予約削除
  const handleDelete = async (id: string) => {
    if (!confirm('この予約を削除しますか？')) return;
    try {
      await cancelReservation(id);
      await loadAdminData();
    } catch (err) {
      alert('削除に失敗しました。');
    }
  };

  // 営業時間・設定の保存
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateOperationalSettings(settings);
      alert('✅ 展示・メンテナンス時間の設定を更新しました！');
      await loadAdminData();
    } catch (err) {
      alert('設定の保存に失敗しました。');
    }
  };

  // メンテナンス枠の追加
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

  // メンテナンス枠の削除
  const handleRemoveMaintenanceSlot = (slot: string) => {
    const updated = settings.maintenanceSlots.filter((s) => s !== slot);
    setSettings({ ...settings, maintenanceSlots: updated });
  };

  if (authLoading) return <div className="p-8 text-center">認証確認中...</div>;

  // ログイン前の画面
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
          <h1 className="text-xl font-bold text-center mb-6 text-gray-800">レーザー脱出ゲーム 関係者管理画面</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">メールアドレス</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">パスワード</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
            <button type="submit" className="w-full py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700">
              ログイン
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ログイン後のメイン管理画面
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 text-gray-800">
      <div className="flex justify-between items-center mb-6 pb-4 border-b">
        <h1 className="text-xl sm:text-2xl font-bold">🛠️ レーザー脱出ゲーム 管理システム</h1>
        <button onClick={handleLogout} className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600">
          ログアウト
        </button>
      </div>

      {/* タブナビゲーション */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('checkin')}
          className={`py-2 px-4 font-bold border-b-2 transition ${
            activeTab === 'checkin' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
          }`}
        >
          🎟️ チェックイン照合
        </button>
        <button
          onClick={() => setActiveTab('reservations')}
          className={`py-2 px-4 font-bold border-b-2 transition ${
            activeTab === 'reservations' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
          }`}
        >
          📅 予約一覧・タイム登録
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`py-2 px-4 font-bold border-b-2 transition ${
            activeTab === 'settings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
          }`}
        >
          ⚙️ 時間・メンテナンス設定
        </button>
      </div>

      {/* タブ1: チェックイン照合 */}
      {activeTab === 'checkin' && (
        <div className="bg-white p-6 rounded-xl border shadow-sm max-w-lg mx-auto">
          <h2 className="text-lg font-bold mb-4">受付チェックイン</h2>
          <form onSubmit={handleCheckIn} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">6桁のチェックインコード</label>
              <input
                type="text"
                maxLength={6}
                required
                placeholder="例: A7B9C3"
                value={checkinCode}
                onChange={(e) => setCheckinCode(e.target.value)}
                className="w-full text-center text-2xl font-mono p-3 border rounded uppercase tracking-widest focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button type="submit" className="w-full py-3 bg-green-600 text-white font-bold rounded hover:bg-green-700">
              チェックイン実行
            </button>
          </form>
          {checkinMessage && <p className="mt-4 p-3 bg-gray-50 rounded text-center font-bold">{checkinMessage}</p>}
        </div>
      )}

      {/* タブ2: 予約一覧 & クリアタイム登録 */}
      {activeTab === 'reservations' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">全予約リスト ({reservations.length}件)</h2>
            <button onClick={loadAdminData} className="text-sm px-3 py-1 bg-gray-100 border rounded hover:bg-gray-200">
              再読み込み
            </button>
          </div>

          <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="p-3">日時</th>
                  <th className="p-3">代表者名</th>
                  <th className="p-3">コード</th>
                  <th className="p-3">状態</th>
                  <th className="p-3">結果</th>
                  <th className="p-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reservations.map((r) => (
                  <tr key={r.id}>
                    <td className="p-3 font-mono">{r.reservation_date} {r.reservation_time}</td>
                    <td className="p-3 font-semibold">{r.name}</td>
                    <td className="p-3 font-mono font-bold text-blue-600">{r.checkin_code}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs rounded font-bold ${
                        r.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                        r.status === 'playing' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {r.status === 'reserved' ? '来場前' : r.status === 'playing' ? 'プレイ中' : '終了'}
                      </span>
                    </td>
                    <td className="p-3">
                      {r.status === 'cleared' ? (
                        <span className="text-xs">
                          <b>Lv.{r.difficulty_level ?? 1}</b> ({r.clear_time}秒)
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
                          className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                        >
                          タイム登録
                        </button>
                      )}
                      <button
                        onClick={() => r.id && handleDelete(r.id)}
                        className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
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

      {/* タブ3: 営業時間・メンテナンス時間の設定 */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-xl border shadow-sm space-y-6 max-w-xl mx-auto">
          <h2 className="text-lg font-bold border-b pb-2">展示・営業時間設定</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">開始時間 (時)</label>
              <input
                type="number"
                min={0}
                max={23}
                value={settings.startHour}
                onChange={(e) => setSettings({ ...settings, startHour: parseInt(e.target.value, 10) || 0 })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">終了時間 (時)</label>
              <input
                type="number"
                min={0}
                max={23}
                value={settings.endHour}
                onChange={(e) => setSettings({ ...settings, endHour: parseInt(e.target.value, 10) || 0 })}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">メンテナンス時間枠（予約不可）</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="例: 12:55"
                value={newMaintenanceSlot}
                onChange={(e) => setNewMaintenanceSlot(e.target.value)}
                className="flex-1 p-2 border rounded text-sm"
              />
              <button
                type="button"
                onClick={handleAddMaintenanceSlot}
                className="px-4 py-2 bg-gray-800 text-white text-sm font-bold rounded hover:bg-gray-900"
              >
                追加
              </button>
            </div>

            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded border">
              {settings.maintenanceSlots.map((slot) => (
                <span key={slot} className="inline-flex items-center gap-1 bg-white border px-3 py-1 rounded text-sm font-mono shadow-sm">
                  🛠️ {slot}
                  <button
                    type="button"
                    onClick={() => handleRemoveMaintenanceSlot(slot)}
                    className="text-red-500 font-bold ml-1 hover:text-red-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">
            設定を保存する
          </button>
        </form>
      )}

      {/* クリアタイム記録モーダル */}
      {selectedRes && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl max-w-md w-full shadow-lg">
            <h3 className="text-lg font-bold mb-2">クリアタイム＆難易度登録</h3>
            <p className="text-sm text-gray-600 mb-4">
              予約者: <b>{selectedRes.name}</b> ({selectedRes.reservation_time})
            </p>
            <form onSubmit={handleSaveClearTime} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">難易度レベル</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(parseInt(e.target.value, 10))}
                  className="w-full p-2 border rounded"
                >
                  <option value={1}>レベル 1 (簡単)</option>
                  <option value={2}>レベル 2 (標準)</option>
                  <option value={3}>レベル 3 (難)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">クリアタイム (mm:ss.ss または 秒数)</label>
                <input
                  type="text"
                  required
                  placeholder="例: 01:45.50"
                  value={clearTimeInput}
                  onChange={(e) => setClearTimeInput(e.target.value)}
                  className="w-full p-2 border rounded font-mono"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRes(null)}
                  className="flex-1 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  キャンセル
                </button>
                <button type="submit" className="flex-1 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700">
                  記録保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
