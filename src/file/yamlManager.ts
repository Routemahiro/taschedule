import { logger } from '../utils/logger';
import { ICalendarEvent, ErrorCode, createError } from '../types';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

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
            const dirPath = path.join('googlecalendar', calendarId);
            const filePath = path.join(dirPath, `${new Date().toISOString().split('T')[0]}.yml`);

            // ディレクトリが存在しない場合は作成
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }

            const yamlContent = yaml.dump(events);
            fs.writeFileSync(filePath, yamlContent, 'utf8');
            
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
} 