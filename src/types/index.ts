// カレンダーイベントの型定義
export interface CalendarEvent {
    title: string;
    start: string;  // ISO 8601形式
    end: string;    // ISO 8601形式
    location?: string;
    description?: string;
}

// カレンダー設定の型定義
export interface CalendarConfig {
    id: string;
    name: string;
}

// 拡張機能の設定型定義
export interface ExtensionConfig {
    updateInterval: number;  // 分単位
    pastMonths: number;
    futureMonths: number;
    timezone: string;
    retryCount: number;
    retryInterval: number;
    calendars: CalendarConfig[];
}

// エラー型定義
export interface ExtensionError {
    code: string;
    message: string;
    details?: unknown;
} 