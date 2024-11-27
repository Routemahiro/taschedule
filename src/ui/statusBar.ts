import * as vscode from 'vscode';
import { logger } from '../utils/logger';

export class StatusBarManager {
    private static instance: StatusBarManager;
    private statusBarItem: vscode.StatusBarItem;

    private constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        this.statusBarItem.command = 'taschedule.showCommands';
        this.statusBarItem.show();
    }

    public static getInstance(): StatusBarManager {
        if (!StatusBarManager.instance) {
            StatusBarManager.instance = new StatusBarManager();
        }
        return StatusBarManager.instance;
    }

    public updateStatus(message: string, isError: boolean = false): void {
        this.statusBarItem.text = `$(calendar) ${message}`;
        this.statusBarItem.backgroundColor = isError ? new vscode.ThemeColor('statusBarItem.errorBackground') : undefined;
        logger.info('UI', `Status bar updated: ${message}`);
    }

    public dispose(): void {
        this.statusBarItem.dispose();
    }
} 