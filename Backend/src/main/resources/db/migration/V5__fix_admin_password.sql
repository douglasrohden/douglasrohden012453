-- Ensure the seeded admin user can log in with password 'admin'
-- Some earlier setups may have a mismatched hash.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

UPDATE usuarios
SET password_hash = crypt('admin', gen_salt('bf')),
    updated_at = NOW()
WHERE username = 'admin';
