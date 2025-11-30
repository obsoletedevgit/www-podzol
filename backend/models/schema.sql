-- Owner/Profile table
CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    username TEXT NOT NULL,
    biography TEXT,
    profile_picture TEXT,
    pronouns TEXT,
    age INTEGER,
    location TEXT,
    privacy_mode TEXT CHECK(privacy_mode IN ('public', 'private')) 
      DEFAULT 'public',
    password_hash TEXT,
    admin_password_hash TEXT NOT NULL,
    is_setup_complete INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT CHECK(type IN ('status', 'longform', 'image', 'link')) 
      NOT NULL,
    title TEXT,
    content TEXT,
    images TEXT,
    link_url TEXT,
    link_title TEXT,
    link_description TEXT,
    is_published INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER DEFAULT 1,
    unsubscribe_token TEXT UNIQUE NOT NULL
);

-- Mail configuration
CREATE TABLE IF NOT EXISTS mail_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    smtp_host TEXT,
    smtp_port INTEGER,
    smtp_secure INTEGER DEFAULT 0,
    smtp_user TEXT,
    smtp_pass TEXT,
    from_email TEXT,
    from_name TEXT
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_approved INTEGER DEFAULT 1,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);