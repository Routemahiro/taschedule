import * as vscode from 'vscode';
import { logger } from '../utils/logger';
import { ExtensionConfig } from '../types';

export class ConfigManager {
    private static instance: ConfigManager;
    private config: ExtensionConfig;

    private constructor() {
        this.config = this.loadConfig();
    }

    public static getInstance(): ConfigManager {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    }

    private loadConfig(): ExtensionConfig {
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
    }

    public getConfig(): ExtensionConfig {
        return this.config;
    }

    public async updateConfig(): Promise<void> {
        logger.info('CONFIG', 'Updating configuration');
        this.config = this.loadConfig();
    }
} 