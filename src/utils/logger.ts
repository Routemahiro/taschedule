import * as vscode from 'vscode';

class Logger {
    private static instance: Logger;
    private outputChannel: vscode.OutputChannel;

    private constructor() {
        this.outputChannel = vscode.window.createOutputChannel('Taschedule');
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private formatMessage(level: string, category: string, message: string): string {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level}] [${category}] ${message}`;
    }

    public info(category: string, message: string): void {
        const formattedMessage = this.formatMessage('INFO', category, message);
        this.outputChannel.appendLine(formattedMessage);
    }

    public error(category: string, message: string): void {
        const formattedMessage = this.formatMessage('ERROR', category, message);
        this.outputChannel.appendLine(formattedMessage);
    }

    public debug(category: string, message: string): void {
        if (process.env.VSCODE_DEBUG_MODE) {
            const formattedMessage = this.formatMessage('DEBUG', category, message);
            this.outputChannel.appendLine(formattedMessage);
        }
    }

    public show(): void {
        this.outputChannel.show();
    }
}

export const logger = Logger.getInstance(); 