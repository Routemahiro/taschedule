import { logger } from '../utils/logger';
import { CalendarEvent } from '../types';

export class YamlManager {
    private static instance: YamlManager;

    private constructor() {}

    public static getInstance(): YamlManager {
        if (!YamlManager.instance) {
            YamlManager.instance = new YamlManager();
        }
        return YamlManager.instance;
    }

    // TODO: YAML処理の実装
    public async saveEvents(calendarId: string, events: CalendarEvent[]): Promise<void> {
        logger.info('FILE', `Saving events for calendar: ${calendarId}`);
    }
} 