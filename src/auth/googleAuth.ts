import * as vscode from 'vscode';
import { logger } from '../utils/logger';
import { ErrorCode, createError } from '../types';
import { google } from 'googleapis';
import { OAuth2Client, Credentials } from 'google-auth-library';

interface GoogleCredentials {
    client_id: string;
    client_secret: string;
    redirect_uris: string[];
}

export class GoogleAuthManager {
    private static instance: GoogleAuthManager;
    private context: vscode.ExtensionContext;
    private oauth2Client: OAuth2Client | null = null;
    private retryCount: number = 0;
    private readonly MAX_RETRIES = 3;
    private readonly SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
    private readonly CREDENTIALS_KEY = 'google-credentials';
    private readonly TOKEN_KEY = 'google-token';

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
            const credentials = await this.getCredentials();
            if (!credentials) {
                await this.promptForCredentials();
                return;
            }

            this.oauth2Client = new google.auth.OAuth2(
                credentials.client_id,
                credentials.client_secret,
                credentials.redirect_uris[0]
            );

            const token = await this.context.secrets.get(this.TOKEN_KEY);
            if (!token) {
                await this.authenticate();
                return;
            }

            this.oauth2Client.setCredentials(JSON.parse(token));
            this.retryCount = 0;

        } catch (error) {
            if (this.retryCount < this.MAX_RETRIES) {
                this.retryCount++;
                logger.info('AUTH', `Retrying initialization (${this.retryCount}/${this.MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, 1000 * this.retryCount));
                return this.initialize();
            }
            
            throw createError(
                ErrorCode.AUTH_FAILED,
                'Failed to initialize Google Auth Manager',
                error,
                this.retryCount < this.MAX_RETRIES
            );
        }
    }

    private async getCredentials(): Promise<GoogleCredentials | null> {
        const credentialsJson = await this.context.secrets.get(this.CREDENTIALS_KEY);
        return credentialsJson ? JSON.parse(credentialsJson) : null;
    }

    private async promptForCredentials(): Promise<void> {
        const result = await vscode.window.showInformationMessage(
            'Google Calendar credentials not found. Would you like to set them up now?',
            'Yes', 'No'
        );

        if (result === 'Yes') {
            const credentialsJson = await vscode.window.showInputBox({
                prompt: 'Please enter your Google OAuth credentials JSON',
                password: true,
                validateInput: (value) => {
                    try {
                        const parsed = JSON.parse(value);
                        if (!parsed.client_id || !parsed.client_secret || !parsed.redirect_uris) {
                            return 'Invalid credentials format';
                        }
                        return null;
                    } catch {
                        return 'Please enter valid JSON';
                    }
                }
            });

            if (credentialsJson) {
                await this.context.secrets.store(this.CREDENTIALS_KEY, credentialsJson);
                await this.initialize();
            }
        }
    }

    private async authenticate(): Promise<void> {
        if (!this.oauth2Client) {
            throw createError(
                ErrorCode.AUTH_FAILED,
                'OAuth2 client not initialized',
                null,
                false
            );
        }

        const authUrl = this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: this.SCOPES
        });

        await vscode.env.openExternal(vscode.Uri.parse(authUrl));
        
        const code = await vscode.window.showInputBox({
            prompt: 'Please enter the authorization code from the browser'
        });

        if (!code) {
            throw createError(
                ErrorCode.AUTH_FAILED,
                'No authorization code provided',
                null,
                false
            );
        }

        try {
            const { tokens } = await this.oauth2Client.getToken(code);
            this.oauth2Client.setCredentials(tokens);
            await this.context.secrets.store(this.TOKEN_KEY, JSON.stringify(tokens));
        } catch (error) {
            throw createError(
                ErrorCode.AUTH_FAILED,
                'Failed to get access token',
                error,
                true
            );
        }
    }

    public async getAuthenticatedClient(): Promise<OAuth2Client> {
        if (!this.oauth2Client) {
            throw createError(
                ErrorCode.AUTH_FAILED,
                'OAuth2 client not initialized',
                null,
                false
            );
        }
        return this.oauth2Client;
    }

    public async refreshToken(): Promise<void> {
        try {
            if (!this.oauth2Client) {
                throw new Error('OAuth2 client not initialized');
            }

            logger.info('AUTH', 'Refreshing access token');
            const refreshToken = this.oauth2Client.credentials.refresh_token;
            if (!refreshToken) {
                await this.authenticate();
                return;
            }

            const { credentials } = await this.oauth2Client.refreshAccessToken();
            this.oauth2Client.setCredentials(credentials);
            await this.context.secrets.store(this.TOKEN_KEY, JSON.stringify(credentials));
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