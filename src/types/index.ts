// カレンダーイベントの型定義
export interface ICalendarEvent {
    title: string;
    start: string;  // ISO 8601形式
    end: string;    // ISO 8601形式
    location?: string;
    description?: string;
}

// カレンダー設定の型定義
export interface ICalendarConfig {
    id: string;
    name: string;
}

// 拡張機能の設定型定義
export interface IExtensionConfig {
    updateInterval: number;  // 分単位
    pastMonths: number;
    futureMonths: number;
    timezone: string;
    retryCount: number;
    retryInterval: number;
    calendars: ICalendarConfig[];
}

// エラーコードの定義
export enum ErrorCode {
    AUTH_FAILED = 'AUTH_FAILED',
    API_ERROR = 'API_ERROR',
    NETWORK_ERROR = 'NETWORK_ERROR',
    FILE_ERROR = 'FILE_ERROR',
    CONFIG_ERROR = 'CONFIG_ERROR',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// エラー型定義
export interface IExtensionError extends Error {
    code: ErrorCode;
    details?: unknown;
    timestamp: string;
    retry?: boolean;
}

// エラー作成用ファクトリ関数
export function createError(
    code: ErrorCode,
    message: string,
    details?: unknown,
    retry: boolean = false
): IExtensionError {
    const error = new Error(message) as IExtensionError;
    error.code = code;
    error.details = details;
    error.timestamp = new Date().toISOString();
    error.retry = retry;
    return error;
} 