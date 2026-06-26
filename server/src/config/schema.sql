-- ═══════════════════════════════════════════════════════════════════════════
--                         ZimHub Database Schema
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username        VARCHAR(30) UNIQUE NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  role            VARCHAR(20) NOT NULL DEFAULT 'student'
                  CHECK (role IN ('student', 'admin')),
  is_suspended    BOOLEAN NOT NULL DEFAULT false,
  is_verified     BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PROFILES ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name       VARCHAR(100) NOT NULL,
  bio             TEXT,
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── USER SESSIONS (Refresh Tokens) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token   TEXT UNIQUE NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── OTP CODES (Registration, Password Reset, Account Deletion) ───────────────
CREATE TABLE IF NOT EXISTS otp_codes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           VARCHAR(255) NOT NULL,
  code            VARCHAR(6)   NOT NULL,
  purpose         VARCHAR(30)  NOT NULL CHECK (purpose IN (
                    'register', 'password_reset', 'account_deletion'
                  )),
  attempts        INTEGER      NOT NULL DEFAULT 0,
  is_used         BOOLEAN      NOT NULL DEFAULT false,
  expires_at      TIMESTAMPTZ  NOT NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── POSTS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_type       VARCHAR(10) NOT NULL
                  CHECK (post_type IN ('video', 'image', 'text', 'link')),
  caption         TEXT,
  is_deleted      BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── POST VIDEOS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_videos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id         UUID UNIQUE NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  video_url       TEXT NOT NULL,
  thumbnail_url   TEXT,
  duration        INTEGER,
  file_size       BIGINT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── POST IMAGES (Multiple images per post for carousels) ─────────────────────
CREATE TABLE IF NOT EXISTS post_images (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id         UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  image_url       TEXT NOT NULL,
  file_size       BIGINT,
  display_order   INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── POST TEXT POSTS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_text_posts (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id           UUID UNIQUE NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content           TEXT NOT NULL,
  background_style  VARCHAR(50) DEFAULT 'default',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── POST LINKS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_links (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id         UUID UNIQUE NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  title           VARCHAR(255),
  description     TEXT,
  url             TEXT NOT NULL,
  og_image        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── LIKES ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS likes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id         UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- ─── COMMENTS (with reply threading) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id           UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content           TEXT NOT NULL,
  is_deleted        BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── NOTICES ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL,
  description     TEXT NOT NULL,
  poster_url      TEXT,
  phone_number    VARCHAR(20),
  whatsapp_number VARCHAR(20),
  email_address   VARCHAR(255),
  status          VARCHAR(10) NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'closed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            VARCHAR(30) NOT NULL,
  title           VARCHAR(255) NOT NULL,
  message         TEXT NOT NULL,
  is_read         BOOLEAN NOT NULL DEFAULT false,
  reference_id    UUID,
  reference_type  VARCHAR(20),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ANNOUNCEMENTS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL,
  content         TEXT NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- INDEXES — Performance Optimization
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email             ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username          ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role              ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email_lower       ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_username_lower    ON users(LOWER(username));

-- Case-insensitive uniqueness (prevents Tendai_m vs tendai_m duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique_ci
  ON users(LOWER(email));
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique_ci
  ON users(LOWER(username));

-- ─── Sessions ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sessions_user_id        ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token  ON user_sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at     ON user_sessions(expires_at);

-- ─── OTP ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_otp_email_purpose       ON otp_codes(email, purpose);
CREATE INDEX IF NOT EXISTS idx_otp_expires             ON otp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_cleanup             ON otp_codes(expires_at, is_used);

-- ─── Profiles ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_user_id        ON profiles(user_id);

-- ─── Posts ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_posts_user_id           ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_post_type         ON posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_created_at        ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_is_deleted        ON posts(is_deleted);

-- Composite for feed queries (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_posts_feed
  ON posts(is_deleted, created_at DESC)
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_posts_user_active
  ON posts(user_id, is_deleted, created_at DESC)
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_posts_type_active
  ON posts(post_type, is_deleted, created_at DESC)
  WHERE is_deleted = false;

-- ─── Post Images (multi-image carousels) ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_post_images_post_id     ON post_images(post_id);
CREATE INDEX IF NOT EXISTS idx_post_images_order
  ON post_images(post_id, display_order);

-- ─── Likes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_likes_post_id           ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id           ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_post         ON likes(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_count        ON likes(post_id);

-- ─── Comments ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_comments_post_id        ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id        ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent         ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_active
  ON comments(post_id, is_deleted, created_at DESC)
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_comments_parent_active
  ON comments(parent_comment_id, is_deleted)
  WHERE is_deleted = false;

-- ─── Notices ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notices_user_id         ON notices(user_id);
CREATE INDEX IF NOT EXISTS idx_notices_status          ON notices(status);
CREATE INDEX IF NOT EXISTS idx_notices_created_at      ON notices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notices_status_date
  ON notices(status, created_at DESC);

-- ─── Notifications ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notifications_user_id   ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read   ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, is_read, created_at DESC);

-- ─── Search (GIN indexes for full-text search) ───────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_search
  ON users USING gin(to_tsvector('english', username));

CREATE INDEX IF NOT EXISTS idx_profiles_search
  ON profiles USING gin(to_tsvector('english', full_name));

CREATE INDEX IF NOT EXISTS idx_posts_caption_search
  ON posts USING gin(to_tsvector('english', COALESCE(caption, '')));

CREATE INDEX IF NOT EXISTS idx_notices_search
  ON notices USING gin(to_tsvector('english', title || ' ' || description));

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGERS — Auto-update timestamps
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_posts_updated_at ON posts;
CREATE TRIGGER trigger_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_comments_updated_at ON comments;
CREATE TRIGGER trigger_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_notices_updated_at ON notices;
CREATE TRIGGER trigger_notices_updated_at
  BEFORE UPDATE ON notices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_announcements_updated_at ON announcements;
CREATE TRIGGER trigger_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- DONE
-- ═══════════════════════════════════════════════════════════════════════════
ANALYZE;