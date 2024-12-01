import * as vscode from 'vscode';
import { GoogleAuthManager } from './auth/googleAuth';
import { CalendarManager } from './calendar/calendarManager';
import { YamlManager } from './file/yamlManager';
import { ConfigManager } from './config/configManager';
import { StatusBarManager } from './ui/statusBar';
import { logger } from './utils/logger';

let updateInterval: NodeJS.Timeout | undefined;

export async function activate(context: vscode.ExtensionContext) {
	logger.info('MAIN', 'Starting Taschedule extension...');

	try {
		// 各マネージャーの初期化
		const auth = GoogleAuthManager.getInstance(context);
		const calendar = CalendarManager.getInstance();
		const yaml = YamlManager.getInstance();
		const config = ConfigManager.getInstance();
		const statusBar = StatusBarManager.getInstance();

		// ステータスバーの初期設定
		statusBar.updateStatus('Initializing...');

		// 認証の初期化
		await auth.initialize();
		
		// コマンドの登録
		const commands = [
			vscode.commands.registerCommand('taschedule.refresh', async () => {
				try {
					statusBar.updateStatus('Refreshing calendars...');
					await refreshCalendars(calendar, yaml, config);
					statusBar.updateStatus('Calendars updated');
				} catch (error: any) {
					logger.error('COMMAND', `Refresh failed: ${error.message}`);
					statusBar.updateStatus('Update failed', true);
					vscode.window.showErrorMessage('Failed to refresh calendars');
				}
			}),

			vscode.commands.registerCommand('taschedule.configure', async () => {
				try {
					await vscode.commands.executeCommand('workbench.action.openSettings', 'taschedule');
				} catch (error: any) {
					logger.error('COMMAND', `Configure failed: ${error.message}`);
					vscode.window.showErrorMessage('Failed to open settings');
				}
			}),

			vscode.commands.registerCommand('taschedule.showLogs', () => {
				logger.show();
			})
		];

		// コマンドをサブスクリプションに追加
		context.subscriptions.push(...commands);

		// 定期更新の開始
		startAutoUpdate(calendar, yaml, config, statusBar);

		logger.info('MAIN', 'Extension activation completed');
		statusBar.updateStatus('Ready');

	} catch (error: any) {
		logger.error('MAIN', `Activation failed: ${error.message}`);
		vscode.window.showErrorMessage('Failed to activate Taschedule extension');
		throw error;
	}
}

export function deactivate() {
	logger.info('MAIN', 'Deactivating extension...');
	if (updateInterval) {
		clearInterval(updateInterval);
	}
}

async function refreshCalendars(
	calendar: CalendarManager,
	yaml: YamlManager,
	config: ConfigManager
): Promise<void> {
	const { calendars } = config.getConfig();
	
	for (const calendarConfig of calendars) {
		try {
			const events = await calendar.fetchEvents(calendarConfig.id);
			await yaml.saveEvents(calendarConfig.id, events);
			logger.info('REFRESH', `Updated calendar: ${calendarConfig.name}`);
		} catch (error: any) {
			logger.error('REFRESH', `Failed to update calendar ${calendarConfig.name}: ${error.message}`);
			throw error; // 上位で処理するためにエラーを再スロー
		}
	}
}

function startAutoUpdate(
	calendar: CalendarManager,
	yaml: YamlManager,
	config: ConfigManager,
	statusBar: StatusBarManager
): void {
	const { updateInterval: interval } = config.getConfig();
	if (updateInterval) {
		clearInterval(updateInterval);
	}

	updateInterval = setInterval(async () => {
		try {
			statusBar.updateStatus('Updating...');
			await refreshCalendars(calendar, yaml, config);
			statusBar.updateStatus('Ready');
		} catch (error) {
			statusBar.updateStatus('Update failed', true);
		}
	}, interval * 60 * 1000); // 分をミリ秒に変換
}
