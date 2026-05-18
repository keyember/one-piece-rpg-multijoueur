-- Migration 001 : vérification email
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Les comptes OAuth sont considérés vérifiés d'office
UPDATE users u
SET email_verified = TRUE
WHERE EXISTS (
  SELECT 1 FROM oauth_accounts o WHERE o.user_id = u.id
);
