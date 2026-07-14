/*
  # Rename gemini_api_key to groq_api_key in user_settings

  ## Changes
  - Renames `gemini_api_key` column to `groq_api_key` in the `user_settings` table
  - Preserves existing data by copying values before dropping the old column

  ## Notes
  - Safe migration: uses IF EXISTS checks to avoid errors if already migrated
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'gemini_api_key'
  ) THEN
    ALTER TABLE user_settings RENAME COLUMN gemini_api_key TO groq_api_key;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'groq_api_key'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN groq_api_key text DEFAULT '';
  END IF;
END $$;
