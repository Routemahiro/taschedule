import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
    try {
        // テストファイルのディレクトリ
        const extensionDevelopmentPath = path.resolve(__dirname, '../../');
        const extensionTestsPath = path.resolve(__dirname, './suite/index');
        const testWorkspace = path.resolve(extensionDevelopmentPath, '.vscode-test/test-workspace');

        // テストの実行
        await runTests({
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs: [
                testWorkspace,
                '--disable-extensions',
                '--disable-gpu'
            ],
            extensionTestsEnv: {
                MOCHA_TIMEOUT: '10000',
                NODE_ENV: 'test'
            }
        });
    } catch (err) {
        console.error('Failed to run tests:', err);
        process.exit(1);
    }
}

main(); 