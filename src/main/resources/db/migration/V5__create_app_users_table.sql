CREATE TABLE IF NOT EXISTS app_users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP,
    full_name VARCHAR(255),
    company_name VARCHAR(255)
);
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS profile_image_url TEXT DEFAULT 'https://www.gravatar.com/avatar/?d=mp';
