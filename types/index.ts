// 1. 予約データの型定義
export type Reservation = {
  id?: string;
  name: string;                   // 予約者名（例: "山田太郎"）
  reservation_date: string;       // 予約日（例: "2026-10-25"）
  reservation_time: string;       // 予約時間（例: "10:05"）
  status: 'reserved' | 'playing' | 'cleared' | 'cancelled'; // ステータス
  checkin_code: string;           // 6桁のチェックインコード（例: "123456"）
  created_at?: Date | string;     // 作成日時
};

// 2. クリアタイム・ランキングの型定義
export type RankingItem = {
  id?: string;
  team_name: string;              // チーム名
  clear_time: string;             // クリアタイム文字列（例: "02:15.30"）
  clear_time_ms: number;          // ソート用ミリ秒（例: 135300）
  difficulty_level: 1 | 2 | 3;    // 難易度（レベル1〜3）
  created_at?: Date | string;     // 登録日時
};