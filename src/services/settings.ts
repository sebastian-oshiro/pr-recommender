export interface UserSettings {
  owner: string;
  repo: string;
  syncInterval: string;
  minScore: number;
  notifyNew: boolean;
  notifyWeekly: boolean;
}

interface SettingsResponse {
  settings?: UserSettings;
  error?: string;
}

export const defaultSettings: UserSettings = {
  owner: '',
  repo: '',
  syncInterval: 'daily',
  minScore: 75,
  notifyNew: true,
  notifyWeekly: true,
};

export async function loadSettings(): Promise<UserSettings> {
  const response = await fetch('/api/settings');
  const payload = await response.json() as SettingsResponse;

  if (!response.ok || !payload.settings) {
    throw new Error(payload.error || '設定の読み込みに失敗しました');
  }

  return payload.settings;
}

export async function saveSettings(settings: UserSettings): Promise<UserSettings> {
  const response = await fetch('/api/settings', {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ settings }),
  });
  const payload = await response.json() as SettingsResponse;

  if (!response.ok || !payload.settings) {
    throw new Error(payload.error || '設定の保存に失敗しました');
  }

  return payload.settings;
}
