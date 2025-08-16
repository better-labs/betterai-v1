-- Rotate passwords and output via SELECT (works in consoles that hide NOTICEs)
-- Requires: privilege to ALTER ROLE; pgcrypto extension for randomness
-- Run against a **direct** (non-pooler) endpoint.

BEGIN;

-- Ensure pgcrypto is available for gen_random_bytes()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Temp table to capture outputs (auto-drops at end of session/transaction)
DROP TABLE IF EXISTS tmp_rotated_passwords;
CREATE TEMP TABLE tmp_rotated_passwords (
  role_name    text,
  new_password text
) ON COMMIT DROP;

DO $$
DECLARE
  new_admin_pwd text;
  new_app_pwd   text;
BEGIN
  -- Make sure new passwords are stored with SCRAM
  PERFORM set_config('password_encryption','scram-sha-256', true);

  -- Generate and set betterai_admin password
  new_admin_pwd := encode(gen_random_bytes(48), 'base64');
  EXECUTE format('ALTER ROLE %I WITH LOGIN PASSWORD %L', 'betterai_admin', new_admin_pwd);
  INSERT INTO tmp_rotated_passwords(role_name, new_password)
  VALUES ('betterai_admin', new_admin_pwd);

  -- Generate and set betterai_app password
  new_app_pwd := encode(gen_random_bytes(48), 'base64');
  EXECUTE format('ALTER ROLE %I WITH LOGIN PASSWORD %L', 'betterai_app', new_app_pwd);
  INSERT INTO tmp_rotated_passwords(role_name, new_password)
  VALUES ('betterai_app', new_app_pwd);

  -- Optional: no expiry (uncomment if desired)
  -- EXECUTE format('ALTER ROLE %I VALID UNTIL %L', 'betterai_admin', 'infinity');
  -- EXECUTE format('ALTER ROLE %I VALID UNTIL %L', 'betterai_app',   'infinity');
END
$$;

-- << Output you can copy into your secret store >>
SELECT role_name, new_password
FROM tmp_rotated_passwords
ORDER BY role_name;

COMMIT;
