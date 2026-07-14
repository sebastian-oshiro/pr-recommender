/*
  # user_settings: anthropic_api_key → gemini_api_key にリネーム

  - `anthropic_api_key` カラムを `gemini_api_key` にリネームします
  - 既存データは保持されます
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'anthropic_api_key'
  ) THEN
    ALTER TABLE user_settings RENAME COLUMN anthropic_api_key TO gemini_api_key;
  END IF;
END $$;
