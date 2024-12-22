import * as assert from 'assert';
import * as vscode from 'vscode';
import { GoogleAuthManager } from '../../auth/googleAuth';
import * as path from 'path';

suite('GoogleAuthManager Test Suite', () => {
    let context: vscode.ExtensionContext;

    suiteSetup(() => {
        // テスト用のモックコンテキストを作成
        const mockSecretStorage = new class implements vscode.SecretStorage {
            private storage = new Map<string, string>();
            private _onDidChange = new vscode.EventEmitter<vscode.SecretStorageChangeEvent>();
            readonly onDidChange = this._onDidChange.event;

            async get(key: string): Promise<string | undefined> {
                return this.storage.get(key);
            }

            async store(key: string, value: string): Promise<void> {
                this.storage.set(key, value);
                this._onDidChange.fire({ key });
            }

            async delete(key: string): Promise<void> {
                this.storage.delete(key);
                this._onDidChange.fire({ key });
            }
        };

        context = {
            subscriptions: [],
            extensionPath: '',
            storagePath: '',
            logPath: '',
            globalState: {
                get: () => undefined,
                update: () => Promise.resolve(),
                setKeysForSync: () => {},
            } as any,
            workspaceState: {
                get: () => undefined,
                update: () => Promise.resolve(),
                setKeysForSync: () => {},
            } as any,
            secrets: mockSecretStorage,
            extensionUri: vscode.Uri.file(''),
            environmentVariableCollection: {} as any,
            extensionMode: vscode.ExtensionMode.Test,
            globalStorageUri: vscode.Uri.file(''),
            logUri: vscode.Uri.file(''),
            storageUri: vscode.Uri.file(''),
            asAbsolutePath: (relativePath: string) => path.join(__dirname, '../../../', relativePath),
            globalStoragePath: '',
            extension: {
                id: 'test-extension',
                extensionUri: vscode.Uri.file(''),
                extensionPath: '',
                isActive: true,
                packageJSON: {},
                exports: undefined,
                activate: () => Promise.resolve(),
                extensionKind: vscode.ExtensionKind.Workspace
            },
            languageModelAccessInformation: {} as any
        };
    });

    test('getInstance should return singleton instance', () => {
        const instance1 = GoogleAuthManager.getInstance(context);
        const instance2 = GoogleAuthManager.getInstance(context);
        assert.strictEqual(instance1, instance2);
    });

    test('initialize should fail without credentials', async function() {
        this.timeout(10000); // タイムアウトを10秒に延長
        const auth = GoogleAuthManager.getInstance(context);
        
        await assert.rejects(
            async () => {
                await auth.initialize();
            },
            (error: any) => {
                assert.strictEqual(error.code, 'AUTH_FAILED');
                return true;
            }
        );
    });
}); 