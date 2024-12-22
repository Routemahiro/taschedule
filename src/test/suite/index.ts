import * as path from 'path';
import Mocha from 'mocha';
import { glob } from 'glob';

export function run(): Promise<void> {
    // テストファイルのパターン
    const testsRoot = path.resolve(__dirname, '.');
    const pattern = '**/*.test.js';

    return new Promise((resolve, reject) => {
        // Mochaインスタンスの作成
        const mocha = new Mocha({
            ui: 'tdd',
            color: true,
            timeout: 10000  // タイムアウトを10秒に設定
        });

        glob(pattern, { cwd: testsRoot }).then(files => {
            // テストファイルの追加
            files.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)));

            try {
                // テストの実行
                mocha.run((failures: number) => {
                    if (failures > 0) {
                        reject(new Error(`${failures} tests failed.`));
                    } else {
                        resolve();
                    }
                });
            } catch (err) {
                reject(err);
            }
        }).catch(err => reject(err));
    });
} 