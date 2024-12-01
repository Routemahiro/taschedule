import * as assert from 'assert';
import * as vscode from 'vscode';
import { GoogleAuthManager } from '../../auth/googleAuth';
import { ErrorCode } from '../../types';
import * as path from 'path';

suite('GoogleAuthManager Test Suite', () => {
    let context: vscode.ExtensionContext;

    suiteSetup(() => {
        // テスト用のモックコンテキストを作成
        const mockSecretStorage = new class implements vscode.SecretStorage {
            private storage = new Map<string, string>();
            
            async get(key: string): Promise<string | undefined> {
                return this.storage.get(key);
            }
            
            async delete(key: string): Promise<void> {
                this.storage.delete(key);
            }
            
            async store(key: string, value: string): Promise<void> {
                this.storage.set(key, value);
            }
            
            onDidChange = new vscode.EventEmitter<vscode.SecretStorageChangeEvent>().event;
        };

        // Mementoの完全実装
        const createMemento = (): vscode.Memento & { setKeysForSync(keys: readonly string[]): void } => ({
            get: (key: string) => undefined,
            update: async () => undefined,
            keys: () => [],
            setKeysForSync: (keys: readonly string[]) => { /* 実装不要 */ }
        });

        // EnvironmentVariableCollectionの完全実装
        const mockEnvCollection = new class implements vscode.EnvironmentVariableCollection {
            [Symbol.iterator](): Iterator<[variable: string, mutator: vscode.EnvironmentVariableMutator]> {
                return [][Symbol.iterator]();
            }
            persistent = true;
            description = undefined;
            replace(variable: string, value: string): void { }
            append(variable: string, value: string): void { }
            prepend(variable: string, value: string): void { }
            get(variable: string): vscode.EnvironmentVariableMutator | undefined { return undefined; }
            forEach(callback: (variable: string, mutator: vscode.EnvironmentVariableMutator, collection: vscode.EnvironmentVariableCollection) => any, thisArg?: any): void { }
            delete(variable: string): void { }
            clear(): void { }
            getScoped(scope: vscode.EnvironmentVariableScope): vscode.EnvironmentVariableCollection {
                return this;
            }
        };

        const mockContext: vscode.ExtensionContext = {
            subscriptions: [],
            extensionPath: '/test/path',
            extensionUri: vscode.Uri.file('/test/path'),
            globalState: createMemento(),
            workspaceState: createMemento(),
            secrets: mockSecretStorage,
            storageUri: vscode.Uri.file('/test/storage'),
            globalStorageUri: vscode.Uri.file('/test/global-storage'),
            logUri: vscode.Uri.file('/test/log'),
            extensionMode: vscode.ExtensionMode.Test,
            storagePath: '/test/storage',
            globalStoragePath: '/test/global-storage',
            logPath: '/test/log',
            asAbsolutePath: (relativePath: string) => path.join('/test/path', relativePath),
            environmentVariableCollection: mockEnvCollection,
            extension: {
                id: 'test-extension',
                extensionUri: vscode.Uri.file('/test/path'),
                extensionPath: '/test/path',
                isActive: true,
                packageJSON: {},
                exports: undefined,
                activate: () => Promise.resolve(),
                extensionKind: vscode.ExtensionKind.Workspace
            },
            languageModelAccessInformation: {} as any
        };

        context = mockContext;
    });

    test('getInstance should return singleton instance', () => {
        const instance1 = GoogleAuthManager.getInstance(context);
        const instance2 = GoogleAuthManager.getInstance(context);
        assert.strictEqual(instance1, instance2);
    });

    test('initialize should fail without credentials', async () => {
        const auth = GoogleAuthManager.getInstance(context);
        try {
            await auth.initialize();
            assert.fail('Should throw error');
        } catch (error: any) {
            assert.strictEqual(error.code, ErrorCode.AUTH_FAILED);
            assert.strictEqual(error.message, 'Google credentials not found');
        }
    });

    // TODO: Add more test cases for successful initialization and token refresh
}); 