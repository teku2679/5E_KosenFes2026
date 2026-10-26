export interface Reservation {
  id?: string;
  name: string;
  reservation_date: string; // YYYY-MM-DD
  reservation_time: string; // HH:MM
  status: 'reserved' | 'playing' | 'cleared';
  checkin_code: string; // 6桁の英数字
  user_uid: string;
  clear_time?: number; // 秒数（例: 105.5）
  difficulty_level?: number; // 1: 簡単, 2: 標準, 3: 難
  created_at?: any;
  checked_in_at?: any;
  cleared_at?: any;
}

export interface OperationalSettings {
  startHour: number;
  endHour: number;
  maintenanceSlots: string[];
}
