import { logger } from '../utils/logger';
import { CalendarEvent, CalendarConfig } from '../types';

export class CalendarManager {
    private static instance: CalendarManager;
    private calendars: CalendarConfig[];

    private constructor() {
        this.calendars = [];
    }

    public static getInstance(): CalendarManager {
        if (!CalendarManager.instance) {
            CalendarManager.instance = new CalendarManager();
        }
        return CalendarManager.instance;
    }

    // TODO: カレンダー処理の実装
    public async fetchEvents(calendarId: string): Promise<CalendarEvent[]> {
        logger.info('CALENDAR', `Fetching events for calendar: ${calendarId}`);
        return [];
    }
} 