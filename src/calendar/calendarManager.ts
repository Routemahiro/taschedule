import { logger } from '../utils/logger';
import { ICalendarEvent, ICalendarConfig, ErrorCode, createError } from '../types';
import { GoogleAuthManager } from '../auth/googleAuth';
import { google, calendar_v3 } from 'googleapis';
import * as vscode from 'vscode';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export class CalendarManager {
    private static instance: CalendarManager;
    private calendars: ICalendarConfig[];
    private retryCount: number = 0;
    private readonly MAX_RETRIES = 3;

    private constructor() {
        this.calendars = [];
    }

    public static getInstance(): CalendarManager {
        if (!CalendarManager.instance) {
            CalendarManager.instance = new CalendarManager();
        }
        return CalendarManager.instance;
    }

    public async fetchEvents(calendarId: string): Promise<ICalendarEvent[]> {
        try {
            logger.info('CALENDAR', `Fetching events for calendar: ${calendarId}`);
            
            const auth = GoogleAuthManager.getInstance(await this.getExtensionContext());
            const client = await auth.getAuthenticatedClient();
            const calendar = google.calendar({ version: 'v3', auth: client });

            const config = await this.getConfig();
            const now = dayjs().tz(config.timezone);
            const timeMin = now.subtract(config.pastMonths, 'month').startOf('month').toISOString();
            const timeMax = now.add(config.futureMonths, 'month').endOf('month').toISOString();

            const response = await calendar.events.list({
                calendarId,
                timeMin,
                timeMax,
                singleEvents: true,
                orderBy: 'startTime'
            });

            if (!response.data.items) {
                return [];
            }

            return response.data.items.map((event: calendar_v3.Schema$Event) => ({
                title: event.summary || '',
                start: event.start?.dateTime || event.start?.date || '',
                end: event.end?.dateTime || event.end?.date || '',
                location: event.location,
                description: event.description
            }));

        } catch (error: any) {
            if (error.code === 401) {
                // トークンが無効な場合は再認証を試みる
                try {
                    const auth = GoogleAuthManager.getInstance(await this.getExtensionContext());
                    await auth.refreshToken();
                    return this.fetchEvents(calendarId);
                } catch (refreshError) {
                    throw createError(
                        ErrorCode.AUTH_FAILED,
                        'Failed to refresh authentication',
                        refreshError,
                        true
                    );
                }
            }

            if (this.retryCount < this.MAX_RETRIES) {
                this.retryCount++;
                logger.info('CALENDAR', `Retrying fetch (${this.retryCount}/${this.MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, 1000 * this.retryCount));
                return this.fetchEvents(calendarId);
            }

            throw createError(
                ErrorCode.API_ERROR,
                `Failed to fetch events for calendar: ${calendarId}`,
                error,
                this.retryCount < this.MAX_RETRIES
            );
        }
    }

    private async getExtensionContext(): Promise<vscode.ExtensionContext> {
        const extension = vscode.extensions.getExtension('taschedule');
        if (!extension) {
            throw createError(
                ErrorCode.CONFIG_ERROR,
                'Extension context not found',
                null,
                false
            );
        }
        return extension.activate();
    }

    private async getConfig(): Promise<any> {
        const config = vscode.workspace.getConfiguration('taschedule');
        return {
            timezone: config.get('timezone', 'Asia/Tokyo'),
            pastMonths: config.get('pastMonths', 3),
            futureMonths: config.get('futureMonths', 3)
        };
    }
} 