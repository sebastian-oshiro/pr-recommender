import { supabase, ANON_USER_ID } from '../lib/supabase';

export interface UserSettings {
  githubUsername: string;
  githubToken: string;
  syncInterval: string;
  minScore: number;
  notifyNew: boolean;
  notifyWeekly: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  githubUsername: '',
  githubToken: '',
  syncInterval: 'daily',
  minScore: 75,
  notifyNew: true,
  notifyWeekly: true,
};

export async function loadSettings(): Promise<UserSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', ANON_USER_ID)
    .maybeSingle();

  if (error || !data) return DEFAULT_SETTINGS;

  return {
    githubUsername: data.github_username ?? '',
    githubToken: data.github_token ?? '',
    syncInterval: data.sync_interval ?? 'daily',
    minScore: data.min_score ?? 75,
    notifyNew: data.notify_new ?? true,
    notifyWeekly: data.notify_weekly ?? true,
  };
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  const row = {
    user_id: ANON_USER_ID,
    github_username: settings.githubUsername,
    github_token: settings.githubToken,
    sync_interval: settings.syncInterval,
    min_score: settings.minScore,
    notify_new: settings.notifyNew,
    notify_weekly: settings.notifyWeekly,
    updated_at: new Date().toISOString(),
  };

  await supabase
    .from('user_settings')
    .upsert(row, { onConflict: 'user_id' });
}
