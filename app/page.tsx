'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function Home() {
  const [status, setStatus] = useState<string>('');

  const handleTestConnection = async () => {
    try {
      setStatus('送信中...');
      // Firestore の 'test' コレクションにサンプルデータを書き込み
      const docRef = await addDoc(collection(db, 'test'), {
        message: 'Firebase接続成功！',
        created_at: new Date(),
      });
      setStatus(`✅ 接続成功！ 作成されたID: ${docRef.id}`);
    } catch (error) {
      console.error(error);
      setStatus(`❌ エラーが発生しました: ${error}`);
    }
  };

  return (
    <main className="min-h-screen p-8 flex flex-col items-center justify-center bg-gray-50 text-gray-800">
      <h1 className="text-2xl font-bold mb-6">レーザー脱出ゲーム - 接続テスト</h1>
      <button
        onClick={handleTestConnection}
        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition"
      >
        Firestoreにテストデータを送信
      </button>
      {status && <p className="mt-6 font-mono text-sm bg-white p-4 rounded border shadow-sm">{status}</p>}
    </main>
  );
}