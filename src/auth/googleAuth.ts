import * as vscode from 'vscode';
import { logger } from '../utils/logger';
import { ErrorCode, createError } from '../types';

export class GoogleAuthManager {
    private static instance: GoogleAuthManager;
    private context: vscode.ExtensionContext;
    private retryCount: number = 0;
    private readonly MAX_RETRIES = 3;

    private constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public static getInstance(context: vscode.ExtensionContext): GoogleAuthManager {
        if (!GoogleAuthManager.instance) {
            GoogleAuthManager.instance = new GoogleAuthManager(context);
        }
        return GoogleAuthManager.instance;
    }

    public async initialize(): Promise<void> {
        try {
            logger.info('AUTH', 'Initializing Google Auth Manager');
            await this.validateCredentials();
            this.retryCount = 0;  // 成功したらリトライカウントをリセット
        } catch (error) {
            if (this.retryCount < this.MAX_RETRIES) {
                this.retryCount++;
                logger.info('AUTH', `Retrying initialization (${this.retryCount}/${this.MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, 1000 * this.retryCount));
                return this.initialize();
            }
            
            const extensionError = createError(
                ErrorCode.AUTH_FAILED,
                'Failed to initialize Google Auth Manager',
                error,
                this.retryCount < this.MAX_RETRIES
            );
            
            logger.error('AUTH', `Authentication failed: ${extensionError.message}`);
            throw extensionError;
        }
    }

    private async validateCredentials(): Promise<void> {
        const credentials = this.context.secrets.get('google-credentials');
        if (!credentials) {
            throw createError(
                ErrorCode.AUTH_FAILED,
                'Google credentials not found',
                null,
                false
            );
        }
        // TODO: 実際の認証処理を実装
    }

    public async refreshToken(): Promise<void> {
        try {
            logger.info('AUTH', 'Refreshing access token');
            // TODO: トークンリフレッシュの実装
        } catch (error) {
            throw createError(
                ErrorCode.AUTH_FAILED,
                'Failed to refresh token',
                error,
                true
            );
        }
    }
} 