import * as vscode from 'vscode';
import { logger } from '../utils/logger';
import { IExtensionConfig, ErrorCode, createError } from '../types';

export class ConfigManager {
    private static instance: ConfigManager;
    private config: IExtensionConfig;

    private constructor() {
        this.config = this.loadConfig();
    }

    public static getInstance(): ConfigManager {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    }

    private loadConfig(): IExtensionConfig {
        try {
            const config = vscode.workspace.getConfiguration('taschedule');
            return {
                updateInterval: config.get('updateInterval', 10),
                pastMonths: config.get('pastMonths', 3),
                futureMonths: config.get('futureMonths', 3),
                timezone: config.get('timezone', 'Asia/Tokyo'),
                retryCount: config.get('retryCount', 3),
                retryInterval: config.get('retryInterval', 1),
                calendars: config.get('calendars', [])
            };
        } catch (error) {
            throw createError(
                ErrorCode.CONFIG_ERROR,
                'Failed to load configuration',
                error,
                false
            );
        }
    }

    public getConfig(): IExtensionConfig {
        return this.config;
    }

    public async updateConfig(): Promise<void> {
        try {
            logger.info('CONFIG', 'Updating configuration');
            this.config = this.loadConfig();
        } catch (error) {
            throw createError(
                ErrorCode.CONFIG_ERROR,
                'Failed to update configuration',
                error,
                true
            );
        }
    }
} 