import { logger } from '../utils/logger';
import { ICalendarEvent, ErrorCode, createError } from '../types';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export class YamlManager {
    private static instance: YamlManager;
    private retryCount: number = 0;
    private readonly MAX_RETRIES = 3;

    private constructor() {}

    public static getInstance(): YamlManager {
        if (!YamlManager.instance) {
            YamlManager.instance = new YamlManager();
        }
        return YamlManager.instance;
    }

    public async saveEvents(calendarId: string, events: ICalendarEvent[]): Promise<void> {
        try {
            logger.info('FILE', `Saving events for calendar: ${calendarId}`);
            
            // ワークスペースのルートパスを取得
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                throw new Error('No workspace folder found');
            }
            const rootPath = workspaceFolders[0].uri.fsPath;

            // カレンダー用ディレクトリのパスを作成
            const dirPath = path.join(rootPath, 'googlecalendar', this.sanitizeFileName(calendarId));
            
            // 現在の日付でファイル名を生成（タイムゾーンを考慮）
            const config = vscode.workspace.getConfiguration('taschedule');
            const timezone = config.get('timezone', 'Asia/Tokyo');
            const today = dayjs().tz(timezone);
            const filePath = path.join(dirPath, `${today.format('YYYY-MM-DD')}.yml`);

            // メタデータを追加
            const yamlContent = {
                metadata: {
                    date: today.format('YYYY-MM-DD'),
                    timezone: timezone,
                    calendar_id: calendarId,
                    calendar_name: await this.getCalendarName(calendarId)
                },
                events: events
            };

            // ディレクトリが存在しない場合は作成
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }

            // YAMLファイルを保存
            fs.writeFileSync(filePath, yaml.dump(yamlContent, {
                indent: 2,
                lineWidth: -1  // 行の折り返しを無効化
            }), 'utf8');
            
            logger.info('FILE', `Successfully saved events to: ${filePath}`);

        } catch (error) {
            if (this.retryCount < this.MAX_RETRIES) {
                this.retryCount++;
                logger.info('FILE', `Retrying save (${this.retryCount}/${this.MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, 1000 * this.retryCount));
                return this.saveEvents(calendarId, events);
            }

            throw createError(
                ErrorCode.FILE_ERROR,
                `Failed to save events for calendar: ${calendarId}`,
                error,
                this.retryCount < this.MAX_RETRIES
            );
        }
    }

    private sanitizeFileName(fileName: string): string {
        // ファイル名に使用できない文字を置換
        return fileName.replace(/[<>:"/\\|?*]/g, '_');
    }

    private async getCalendarName(calendarId: string): Promise<string> {
        const config = vscode.workspace.getConfiguration('taschedule');
        const calendars = config.get<Array<{ id: string, name: string }>>('calendars', []);
        const calendar = calendars.find(c => c.id === calendarId);
        return calendar ? calendar.name : calendarId;
    }
} 