-- ============================================================================
-- AESTHE — DIGITAL ART SHOWCASE PLATFORM
-- Full Database Schema & Rich Community Seed Data (Reset dari 0)
-- PostgreSQL 14+
-- ============================================================================
-- CARA MENJALANKAN DI PGADMIN 4:
--   1. Pilih database Aesthe di panel kiri pgAdmin 4.
--   2. Buka Query Tool (klik kanan database -> Query Tool).
--   3. Buka / paste seluruh isi file ini, lalu klik Execute (F5).
--   4. Refresh browser (atau logout & login ulang jika sesi cookie lama masih aktif).
--
-- AKUN DUMMY (SEMUA PASSWORD: password123):
--   - Admin              : admin@aesthe.art     (@admin_aesthe)
--   - Curator Approved 1 : curator@aesthe.art   (@elena_curator)
--   - Curator Approved 2 : bima@aesthe.art      (@bima_curates)
--   - Curator Pending 1  : pending@aesthe.art   (@dimas_curator)
--   - Curator Pending 2  : laras@aesthe.art     (@laras_curates)
--   - Curator Rejected   : rejected@aesthe.art  (@saka_curator)
--   - Member 1 (Utama)   : aria@aesthe.art      (@aria_visuals)
--   - Member 2           : kael@aesthe.art      (@kael_renders)
--   - Member 3           : nara@aesthe.art      (@nara_illust)
--   - Member 4           : raka@aesthe.art      (@raka_lens)
--   - Member 5           : sora@aesthe.art      (@sora_neon)
--   - Member 6           : maya@aesthe.art      (@maya_flora)
--   - Member 7           : davin@aesthe.art     (@davin_ui)
--   - Member 8           : chloe@aesthe.art     (@chloe_canvas)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. HAPUS SELURUH TABEL LAMA (RESET BERSIH DARI 0)
-- ============================================================================
DROP TABLE IF EXISTS direct_messages CASCADE;
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS challenge_submissions CASCADE;
DROP TABLE IF EXISTS challenges CASCADE;
DROP TABLE IF EXISTS comment_reports CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS collection_items CASCADE;
DROP TABLE IF EXISTS collections CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS artwork_reactions CASCADE;
DROP TABLE IF EXISTS artworks CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- 2. PEMBUATAN SKEMA 13 TABEL UTAMA AESTHE
-- ============================================================================

-- 2.1 Users (Admin, Curator, Member)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  display_name VARCHAR(100) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'Member' CHECK (role IN ('Member', 'Curator', 'Admin')),
  curator_status VARCHAR(20) NOT NULL DEFAULT 'Approved' CHECK (curator_status IN ('Pending', 'Approved', 'Rejected')),
  avatar_url TEXT,
  bio TEXT,
  external_link TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2.2 Categories
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2.3 Artworks
CREATE TABLE artworks (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2.4 Artwork Reactions (1 reaksi aktif per user per karya)
CREATE TABLE artwork_reactions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  artwork_id INT NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  reaction_type VARCHAR(30) NOT NULL DEFAULT 'love',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, artwork_id)
);

-- 2.5 Favorites
CREATE TABLE favorites (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  artwork_id INT NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, artwork_id)
);

-- 2.6 Collections / Moodboards (Folder koleksi kustom Member)
CREATE TABLE collections (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2.7 Collection Items (Relasi karya dalam Moodboard)
CREATE TABLE collection_items (
  id SERIAL PRIMARY KEY,
  collection_id INT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  artwork_id INT NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (collection_id, artwork_id)
);

-- 2.8 Comments
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  artwork_id INT NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2.9 Reports (Laporan moderasi karya oleh Member)
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  artwork_id INT NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  reporter_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Dismissed', 'Resolved')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (artwork_id, reporter_id)
);

-- 2.9b Comment Reports (Laporan moderasi komentar oleh Member)
CREATE TABLE comment_reports (
  id SERIAL PRIMARY KEY,
  comment_id INT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  reporter_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Dismissed', 'Resolved')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (comment_id, reporter_id)
);

-- 2.10 Challenges (Event kompetisi yang dibuat Curator Approved)
CREATE TABLE challenges (
  id SERIAL PRIMARY KEY,
  curator_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  rules TEXT,
  prize VARCHAR(150),
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP NOT NULL,
  banner_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2.11 Challenge Submissions (Maksimal 1 karya per Member per Challenge)
CREATE TABLE challenge_submissions (
  id SERIAL PRIMARY KEY,
  challenge_id INT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  artwork_id INT NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  member_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  winner_rank INT CHECK (winner_rank IS NULL OR winner_rank IN (1, 2, 3)),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (challenge_id, member_id)
);

-- 2.12 Follows (Relasi mengikuti antar Kreator)
CREATE TABLE follows (
  id SERIAL PRIMARY KEY,
  follower_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

-- 2.13 Direct Messages (Private Chat antar Pengguna)
CREATE TABLE direct_messages (
  id SERIAL PRIMARY KEY,
  sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 3. INDEX PERFORMA QUERY
-- ============================================================================
CREATE INDEX idx_artworks_user_id ON artworks(user_id);
CREATE INDEX idx_artworks_category_id ON artworks(category_id);
CREATE INDEX idx_artworks_created_at ON artworks(created_at DESC);
CREATE INDEX idx_reactions_artwork_id ON artwork_reactions(artwork_id);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_collection_items_collection_id ON collection_items(collection_id);
CREATE INDEX idx_comments_artwork_id ON comments(artwork_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_comment_reports_status ON comment_reports(status);
CREATE INDEX idx_challenges_dates ON challenges(start_date, end_date);
CREATE INDEX idx_submissions_challenge_id ON challenge_submissions(challenge_id);
CREATE UNIQUE INDEX idx_submissions_unique_winner_rank ON challenge_submissions(challenge_id, winner_rank) WHERE winner_rank IS NOT NULL;
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
CREATE INDEX idx_dm_sender_receiver ON direct_messages(sender_id, receiver_id);

-- ============================================================================
-- 4. DATA KOMUNITAS (SEED DATA)
-- Password hash bcryptjs (10 rounds) untuk semua akun: password123
-- ============================================================================

-- 4.1 Users (14 Pengguna: 1 Admin, 2 Curator Approved, 2 Curator Pending, 1 Curator Rejected, 8 Member)
INSERT INTO users (id, display_name, username, email, password_hash, role, curator_status, avatar_url, bio, external_link, created_at) VALUES
  (1, 'Admin Aesthe', 'admin_aesthe', 'admin@aesthe.art', '$2b$10$uquYDXVQoX6zMij4Kn8eHeZMbumNbAhUPLUVW9myof.60Cy2saqs.', 'Admin', 'Approved',
   'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&q=80',
   'Administrator resmi platform pameran seni digital Aesthe.',
   'https://aesthe.art', NOW() - INTERVAL '45 days'),

  (2, 'Elena Vance', 'elena_curator', 'curator@aesthe.art', '$2b$10$uquYDXVQoX6zMij4Kn8eHeZMbumNbAhUPLUVW9myof.60Cy2saqs.', 'Curator', 'Approved',
   'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80',
   'Kurator pameran visual digital, seni futuristik, dan penyelenggara kompetisi seni komunitas Aesthe.',
   'https://behance.net/elenavance', NOW() - INTERVAL '40 days'),

  (3, 'Dimas Pratama', 'dimas_curator', 'pending@aesthe.art', '$2b$10$uquYDXVQoX6zMij4Kn8eHeZMbumNbAhUPLUVW9myof.60Cy2saqs.', 'Curator', 'Pending',
   'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80',
   'Calon kurator komunitas ilustrasi kontemporer & desain poster nusantara.',
   'https://instagram.com/dimas.curator', NOW() - INTERVAL '2 days'),

  (4, 'Saka Wijaya', 'saka_curator', 'rejected@aesthe.art', '$2b$10$uquYDXVQoX6zMij4Kn8eHeZMbumNbAhUPLUVW9myof.60Cy2saqs.', 'Curator', 'Rejected',
   NULL,
   'Akun kurator contoh berstatus ditolak untuk pengujian halaman verifikasi.',
   NULL, NOW() - INTERVAL '5 days'),

  (5, 'Aria Kusuma', 'aria_visuals', 'aria@aesthe.art', '$2b$10$uquYDXVQoX6zMij4Kn8eHeZMbumNbAhUPLUVW9myof.60Cy2saqs.', 'Member', 'Approved',
   'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80',
   'Concept artist & digital painter yang mengeksplorasi pencahayaan neon retro, lanskap kosmik, dan dunia sci-fi.',
   'https://artstation.com/ariavisuals', NOW() - INTERVAL '35 days'),

  (6, 'Kaelen Voss', 'kael_renders', 'kael@aesthe.art', '$2b$10$uquYDXVQoX6zMij4Kn8eHeZMbumNbAhUPLUVW9myof.60Cy2saqs.', 'Member', 'Approved',
   'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80',
   '3D generalist & motion designer. Berfokus pada studi shader fluida, bentuk abstrak, dan pencahayaan neon.',
   'https://behance.net/kaelenvoss', NOW() - INTERVAL '33 days'),

  (7, 'Nara Senja', 'nara_illust', 'nara@aesthe.art', '$2b$10$uquYDXVQoX6zMij4Kn8eHeZMbumNbAhUPLUVW9myof.60Cy2saqs.', 'Member', 'Approved',
   'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&q=80',
   'Ilustrator dunia fantasi, langit berbintang, dan eksplorasi tekstur pigmen cair.',
   'https://instagram.com/narasenja.art', NOW() - INTERVAL '30 days'),

  (8, 'Raka Mahendra', 'raka_lens', 'raka@aesthe.art', '$2b$10$uquYDXVQoX6zMij4Kn8eHeZMbumNbAhUPLUVW9myof.60Cy2saqs.', 'Member', 'Approved',
   'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&q=80',
   'Fotografer arsitektur minimalis, geometri perkotaan, dan desainer prototipe aplikasi mobile.',
   'https://dribbble.com/rakamahendra', NOW() - INTERVAL '28 days'),

  (9, 'Sora Takahashi', 'sora_neon', 'sora@aesthe.art', '$2b$10$uquYDXVQoX6zMij4Kn8eHeZMbumNbAhUPLUVW9myof.60Cy2saqs.', 'Member', 'Approved',
   'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&q=80',
   'Street & night photographer yang menangkap kehidupan kota neon Tokyo dan atmosfer cyberpunk pascahujan.',
   'https://instagram.com/soraneon.jpg', NOW() - INTERVAL '26 days'),

  (10, 'Maya Lestari', 'maya_flora', 'maya@aesthe.art', '$2b$10$uquYDXVQoX6zMij4Kn8eHeZMbumNbAhUPLUVW9myof.60Cy2saqs.', 'Member', 'Approved',
   'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&q=80',
   'Seniman botani & fotografer alam liar yang menyukai kontras gelap, kabut hutan, dan flora klasik.',
   'https://behance.net/mayalestari', NOW() - INTERVAL '24 days'),

  (11, 'Davin Kresna', 'davin_ui', 'davin@aesthe.art', '$2b$10$uquYDXVQoX6zMij4Kn8eHeZMbumNbAhUPLUVW9myof.60Cy2saqs.', 'Member', 'Approved',
   'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&q=80',
   'Product & UI/UX designer. Merancang sistem desain minimalis, dashboard data, dan antarmuka spasial.',
   'https://dribbble.com/davinkresna', NOW() - INTERVAL '21 days'),

  (12, 'Chloe Laurent', 'chloe_canvas', 'chloe@aesthe.art', '$2b$10$uquYDXVQoX6zMij4Kn8eHeZMbumNbAhUPLUVW9myof.60Cy2saqs.', 'Member', 'Approved',
   'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80',
   'Digital painter & abstract artist. Bereksperimen dengan warna atmosfer pegunungan dan seni fluida modern.',
   'https://artstation.com/chloelaurent', NOW() - INTERVAL '19 days'),

  (13, 'Bima Sakti', 'bima_curates', 'bima@aesthe.art', '$2b$10$uquYDXVQoX6zMij4Kn8eHeZMbumNbAhUPLUVW9myof.60Cy2saqs.', 'Curator', 'Approved',
   'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&q=80',
   'Kurator fotografi arsitektur, desain antarmuka, dan pameran minimalis kontemporer.',
   'https://behance.net/bimasakti', NOW() - INTERVAL '32 days'),

  (14, 'Larasati Putri', 'laras_curates', 'laras@aesthe.art', '$2b$10$uquYDXVQoX6zMij4Kn8eHeZMbumNbAhUPLUVW9myof.60Cy2saqs.', 'Curator', 'Pending',
   'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&q=80',
   'Kurator independen bidang seni botani dan ilustrasi editorial buku.',
   'https://instagram.com/laras.curates', NOW() - INTERVAL '18 hours');

-- 4.2 Categories (8 Kategori Merata)
INSERT INTO categories (id, name, created_at) VALUES
  (1, 'Digital Painting', NOW() - INTERVAL '45 days'),
  (2, '3D Art', NOW() - INTERVAL '45 days'),
  (3, 'Cyberpunk', NOW() - INTERVAL '45 days'),
  (4, 'Illustration', NOW() - INTERVAL '45 days'),
  (5, 'Photography', NOW() - INTERVAL '45 days'),
  (6, 'Concept Art', NOW() - INTERVAL '45 days'),
  (7, 'UI/UX Design', NOW() - INTERVAL '45 days'),
  (8, 'Abstract', NOW() - INTERVAL '45 days');

-- 4.3 Artworks (28 Karya — 100% Sinkron antara Foto, Judul, Deskripsi, Kategori, dan Tag)
INSERT INTO artworks (id, user_id, category_id, title, description, image_url, tags, created_at) VALUES
  -- CYBERPUNK (Category 3)
  (1, 5, 3, 'Retro Terminal 1984',
   'Komposisi perangkat komputer klasik era 80-an yang bermandikan cahaya neon magenta dan sian dalam suasana studio malam.',
   'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&q=85',
   ARRAY['cyberpunk', 'retro', 'neon', 'synthwave'], NOW() - INTERVAL '22 days'),

  (2, 9, 3, 'Shibuya Neon Crossing',
   'Potret jalanan malam Tokyo yang dipenuhi papan reklame neon warna-warni dan denyut kota metropolitan futuristik.',
   'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1200&q=85',
   ARRAY['cyberpunk', 'tokyo', 'neon', 'nightcity'], NOW() - INTERVAL '21 days'),

  (3, 9, 3, 'Midnight Cyberpunk District',
   'Atmosfer distrik kota malam berbalut kabut ungu dan sorotan lampu jalanan yang memantul dramatis di antara gedung tinggi.',
   'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=1200&q=85',
   ARRAY['cyberpunk', 'nightcity', 'neon', 'urban'], NOW() - INTERVAL '19 days'),

  (4, 6, 3, 'Neon Prism Portal',
   'Eksplorasi instalasi cahaya neon geometris bernuansa magenta dan biru elektrik dalam ruang gelap bergaya synthwave.',
   'https://images.unsplash.com/photo-1563089145-599997674d42?w=1200&q=85',
   ARRAY['cyberpunk', 'synthwave', 'neon', 'geometry'], NOW() - INTERVAL '18 days'),

  -- 3D ART (Category 2)
  (5, 6, 2, 'Chromatic Silk Wave 3D',
   'Render 3D permukaan gelombang sutra berkilau dengan transisi gradien biru, ungu, dan magenta yang halus dan futuristik.',
   'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=85',
   ARRAY['3d', 'fluid', 'blender', 'gradient'], NOW() - INTERVAL '17 days'),

  (6, 6, 2, 'Iridescent Sculpture Study',
   'Studi pencahayaan material 3D pada pahatan abstrak bergelombang dengan pantulan warna spektral lembut.',
   'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&q=85',
   ARRAY['3d', 'sculpture', 'render', 'iridescent'], NOW() - INTERVAL '15 days'),

  (7, 6, 2, 'Gilded Metallic Spheres',
   'Eksperimen shader logam dan pencahayaan studio pada rangkaian bentuk 3D berlapis pantulan hangat.',
   'https://images.unsplash.com/photo-1618172193622-ae2d025f4032?w=1200&q=85',
   ARRAY['3d', 'metallic', 'blender', 'lighting'], NOW() - INTERVAL '13 days'),

  -- ABSTRACT (Category 8)
  (8, 6, 8, 'Obsidian Aurora Gradient',
   'Gelombang cahaya abstrak berpalet hitam pekat, biru malam, dan violet yang menghadirkan kedalaman visual sinematik.',
   'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=1200&q=85',
   ARRAY['abstract', 'gradient', 'dark', 'minimal'], NOW() - INTERVAL '16 days'),

  (9, 7, 8, 'Chromatic Fluid Swirl',
   'Pusaran cat akrilik cair berwarna kontras yang berbaur secara organik membentuk komposisi tekstur abstrak dinamis.',
   'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1200&q=85',
   ARRAY['abstract', 'fluid', 'color', 'texture'], NOW() - INTERVAL '14 days'),

  (10, 12, 8, 'Spectrum Flow Experiment',
   'Aliran pigmen warna cerah yang saling bertabrakan menghasilkan pola marmer abstrak penuh energi.',
   'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1200&q=85',
   ARRAY['abstract', 'paint', 'fluid', 'experimental'], NOW() - INTERVAL '12 days'),

  (11, 12, 8, 'Refraction Field #07',
   'Eksperimen pembiasan cahaya dan gelombang optik dalam komposisi abstrak bergaya sains visual modern.',
   'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&q=85',
   ARRAY['abstract', 'optical', 'refraction', 'experimental'], NOW() - INTERVAL '6 days'),

  -- ILLUSTRATION (Category 4)
  (12, 7, 4, 'Citadel of the Misty Vale',
   'Ilustrasi dunia fantasi menampilkan benteng batu kuno yang tersembunyi di balik kabut lembah dan pepohonan lebat.',
   'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=85',
   ARRAY['fantasy', 'castle', 'illustration', 'atmosphere'], NOW() - INTERVAL '15 days'),

  (13, 10, 4, 'Nocturne Floral Still Life',
   'Lukisan botani klasik berlatar gelap yang menonjolkan kelopak bunga kontras dengan pencahayaan chiaroscuro dramatis.',
   'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1200&q=85',
   ARRAY['floral', 'botanical', 'fineart', 'illustration'], NOW() - INTERVAL '11 days'),

  (14, 10, 4, 'Golden Bloom Meadow',
   'Eksplorasi warna kelopak bunga bermekaran dalam cahaya hangat yang merayakan keindahan bentuk alami flora.',
   'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1200&q=85',
   ARRAY['floral', 'botanical', 'nature', 'color'], NOW() - INTERVAL '8 days'),

  -- DIGITAL PAINTING (Category 1)
  (15, 12, 1, 'Starlight Over Alpine Ridge',
   'Lanskap pegunungan bersalju di bawah taburan bintang malam yang memadukan biru dingin dan kilau langit senja.',
   'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=85',
   ARRAY['digitalpainting', 'landscape', 'mountain', 'nightsky'], NOW() - INTERVAL '10 days'),

  (16, 5, 1, 'Velvet Nebula Reverie',
   'Studi warna kosmik yang menangkap pendar nebula ungu, debu bintang keemasan, dan keluasan ruang angkasa dalam.',
   'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200&q=85',
   ARRAY['digitalpainting', 'cosmic', 'nebula', 'space'], NOW() - INTERVAL '9 days'),

  (17, 7, 1, 'Stargazer Beneath the Milky Way',
   'Siluet pengelana yang berdiri menatap bentangan galaksi Bima Sakti dengan nuansa sunyi dan kontemplatif.',
   'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=1200&q=85',
   ARRAY['digitalpainting', 'cosmic', 'nightsky', 'atmosphere'], NOW() - INTERVAL '5 days'),

  -- CONCEPT ART (Category 6)
  (18, 5, 6, 'Orbital Horizon 09',
   'Visualisasi bola bumi dari orbit rendah dengan jaringan cahaya kota yang menyala di sisi malam atmosfer biru.',
   'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=85',
   ARRAY['conceptart', 'space', 'scifi', 'orbital'], NOW() - INTERVAL '12 days'),

  (19, 5, 6, 'Low-Orbit Frontier',
   'Konsep eksplorasi luar angkasa dengan perspektif lengkung atmosfer biru dan cahaya matahari di cakrawala orbit.',
   'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&q=85',
   ARRAY['conceptart', 'scifi', 'space', 'cinematic'], NOW() - INTERVAL '4 days'),

  (20, 10, 6, 'Whispering Mist Forest',
   'Studi pencahayaan sinar matahari yang menembus kabut pagi di antara pepohonan tinggi bernuansa mistis.',
   'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=85',
   ARRAY['conceptart', 'forest', 'nature', 'atmosphere'], NOW() - INTERVAL '7 days'),

  -- PHOTOGRAPHY (Category 5)
  (21, 8, 5, 'Glass Monolith Perspective',
   'Fotografi arsitektur sudut bawah yang menonjolkan pola geometris fasad kaca gedung pencakar langit modern.',
   'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=85',
   ARRAY['photography', 'architecture', 'minimalist', 'geometry'], NOW() - INTERVAL '11 days'),

  (22, 8, 5, 'Curved Pavilion Geometry',
   'Eksplorasi garis lengkung bersih dan permainan cahaya alami pada ruang arsitektur galeri modern minimalis.',
   'https://images.unsplash.com/photo-1567201864585-6baec9110dac?w=1200&q=85',
   ARRAY['photography', 'architecture', 'minimalist', 'white'], NOW() - INTERVAL '6 days'),

  (23, 8, 5, 'Solitude in Concrete',
   'Potret arsitektur minimalis dengan garis tegas, bidang kosong, dan kontras cahaya alami yang tenang.',
   'https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?w=1200&q=85',
   ARRAY['photography', 'architecture', 'minimalist', 'concrete'], NOW() - INTERVAL '3 days'),

  (24, 10, 5, 'Emerald Pine Canopy',
   'Perspektif menengadah dari dasar hutan pinus yang membentuk bingkai siluet alami menuju langit senja.',
   'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1200&q=85',
   ARRAY['photography', 'forest', 'nature', 'botanical'], NOW() - INTERVAL '2 days'),

  (25, 10, 5, 'Midnight Botanical Shadows',
   'Makro dedaunan tropis dalam pencahayaan redup yang menonjolkan tekstur urat daun dan nuansa hijau gelap dramatis.',
   'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1200&q=85',
   ARRAY['photography', 'botanical', 'nature', 'dark'], NOW() - INTERVAL '1 day'),

  -- UI/UX DESIGN (Category 7)
  (26, 11, 7, 'Aether OS — Design System',
   'Eksplorasi sistem desain modern dan tata letak antarmuka digital yang bersih untuk perangkat kerja kreatif.',
   'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=1200&q=85',
   ARRAY['uiux', 'interface', 'designsystem', 'minimal'], NOW() - INTERVAL '9 days'),

  (27, 11, 7, 'Pulse Analytics Dashboard UI',
   'Konsep antarmuka dashboard analitik real-time dengan hierarki grafik yang tajam dan navigasi intuitif.',
   'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=85',
   ARRAY['uiux', 'dashboard', 'interface', 'product'], NOW() - INTERVAL '3 days'),

  (28, 8, 7, 'Atelier Mobile App Prototype',
   'Purwarupa aplikasi galeri mobile dengan fokus pada tipografi editorial dan kenyamanan navigasi satu tangan.',
   'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&q=85',
   ARRAY['uiux', 'mobile', 'prototype', 'interface'], NOW() - INTERVAL '12 hours');

-- 4.4 Artwork Reactions (74 Reaksi untuk kontras alami POPULER vs TERBARU)
INSERT INTO artwork_reactions (user_id, artwork_id, reaction_type, created_at) VALUES
  -- Artwork 2 (Shibuya Neon Crossing): 7 reaksi (Top #1 Featured)
  (5, 2, 'fire', NOW() - INTERVAL '20 days'),
  (6, 2, 'wow', NOW() - INTERVAL '19 days'),
  (7, 2, 'love', NOW() - INTERVAL '18 days'),
  (8, 2, 'applause', NOW() - INTERVAL '17 days'),
  (10, 2, 'inspire', NOW() - INTERVAL '15 days'),
  (11, 2, 'fire', NOW() - INTERVAL '12 days'),
  (12, 2, 'love', NOW() - INTERVAL '10 days'),
  -- Artwork 1 (Retro Terminal 1984): 6 reaksi
  (6, 1, 'fire', NOW() - INTERVAL '20 days'),
  (7, 1, 'love', NOW() - INTERVAL '19 days'),
  (8, 1, 'wow', NOW() - INTERVAL '17 days'),
  (9, 1, 'inspire', NOW() - INTERVAL '16 days'),
  (11, 1, 'applause', NOW() - INTERVAL '13 days'),
  (12, 1, 'fire', NOW() - INTERVAL '3 hours'),
  -- Artwork 5 (Chromatic Silk Wave 3D): 5 reaksi
  (5, 5, 'wow', NOW() - INTERVAL '16 days'),
  (7, 5, 'inspire', NOW() - INTERVAL '15 days'),
  (9, 5, 'love', NOW() - INTERVAL '14 days'),
  (11, 5, 'applause', NOW() - INTERVAL '11 days'),
  (12, 5, 'fire', NOW() - INTERVAL '9 days'),
  -- Artwork 16 (Velvet Nebula Reverie): 5 reaksi
  (6, 16, 'wow', NOW() - INTERVAL '8 days'),
  (7, 16, 'love', NOW() - INTERVAL '7 days'),
  (9, 16, 'inspire', NOW() - INTERVAL '6 days'),
  (10, 16, 'love', NOW() - INTERVAL '4 days'),
  (12, 16, 'applause', NOW() - INTERVAL '5 hours'),
  -- Artwork 13 (Nocturne Floral Still Life): 5 reaksi
  (5, 13, 'love', NOW() - INTERVAL '10 days'),
  (7, 13, 'inspire', NOW() - INTERVAL '9 days'),
  (8, 13, 'applause', NOW() - INTERVAL '8 days'),
  (9, 13, 'wow', NOW() - INTERVAL '6 days'),
  (12, 13, 'love', NOW() - INTERVAL '5 days'),
  -- Artwork 21 (Glass Monolith Perspective): 4 reaksi
  (5, 21, 'applause', NOW() - INTERVAL '10 days'),
  (6, 21, 'love', NOW() - INTERVAL '9 days'),
  (11, 21, 'inspire', NOW() - INTERVAL '7 days'),
  (12, 21, 'wow', NOW() - INTERVAL '5 days'),
  -- Artwork 4 (Neon Prism Portal): 4 reaksi
  (5, 4, 'fire', NOW() - INTERVAL '17 days'),
  (8, 4, 'wow', NOW() - INTERVAL '15 days'),
  (9, 4, 'fire', NOW() - INTERVAL '14 days'),
  (11, 4, 'love', NOW() - INTERVAL '10 days'),
  -- Artwork 12 (Citadel of the Misty Vale): 4 reaksi
  (5, 12, 'inspire', NOW() - INTERVAL '14 days'),
  (6, 12, 'wow', NOW() - INTERVAL '13 days'),
  (10, 12, 'love', NOW() - INTERVAL '11 days'),
  (12, 12, 'applause', NOW() - INTERVAL '8 days'),
  -- Artwork 8, 9, 15, 18, 22, 25, 26: 3 reaksi masing-masing
  (5, 8, 'inspire', NOW() - INTERVAL '14 days'),
  (7, 8, 'love', NOW() - INTERVAL '12 days'),
  (11, 8, 'wow', NOW() - INTERVAL '9 days'),
  (5, 9, 'love', NOW() - INTERVAL '12 days'),
  (10, 9, 'fire', NOW() - INTERVAL '10 days'),
  (12, 9, 'inspire', NOW() - INTERVAL '8 days'),
  (5, 15, 'love', NOW() - INTERVAL '9 days'),
  (7, 15, 'wow', NOW() - INTERVAL '7 days'),
  (10, 15, 'inspire', NOW() - INTERVAL '5 days'),
  (6, 18, 'fire', NOW() - INTERVAL '11 days'),
  (7, 18, 'wow', NOW() - INTERVAL '9 days'),
  (9, 18, 'inspire', NOW() - INTERVAL '6 days'),
  (6, 22, 'applause', NOW() - INTERVAL '5 days'),
  (11, 22, 'love', NOW() - INTERVAL '4 days'),
  (12, 22, 'inspire', NOW() - INTERVAL '3 days'),
  (5, 25, 'love', NOW() - INTERVAL '20 hours'),
  (7, 25, 'inspire', NOW() - INTERVAL '15 hours'),
  (12, 25, 'wow', NOW() - INTERVAL '8 hours'),
  (5, 26, 'applause', NOW() - INTERVAL '8 days'),
  (6, 26, 'love', NOW() - INTERVAL '6 days'),
  (8, 26, 'inspire', NOW() - INTERVAL '4 days'),
  -- Reaksi tambahan untuk karya lainnya
  (5, 3, 'fire', NOW() - INTERVAL '16 days'),
  (6, 3, 'wow', NOW() - INTERVAL '13 days'),
  (5, 6, 'inspire', NOW() - INTERVAL '13 days'),
  (11, 6, 'wow', NOW() - INTERVAL '10 days'),
  (7, 7, 'applause', NOW() - INTERVAL '11 days'),
  (9, 10, 'fire', NOW() - INTERVAL '10 days'),
  (5, 10, 'love', NOW() - INTERVAL '9 days'),
  (8, 14, 'love', NOW() - INTERVAL '6 days'),
  (5, 17, 'inspire', NOW() - INTERVAL '4 days'),
  (10, 17, 'love', NOW() - INTERVAL '3 days'),
  (6, 19, 'fire', NOW() - INTERVAL '3 days'),
  (5, 20, 'love', NOW() - INTERVAL '5 days'),
  (8, 24, 'applause', NOW() - INTERVAL '1 day'),
  (11, 28, 'love', NOW() - INTERVAL '6 hours');

-- 4.5 Favorites (32 Favorit lintas member)
INSERT INTO favorites (user_id, artwork_id, created_at) VALUES
  -- Favorit milik Aria (id=5) — 9 karya siap dikelompokkan ke Moodboards
  (5, 2, NOW() - INTERVAL '19 days'),
  (5, 4, NOW() - INTERVAL '17 days'),
  (5, 5, NOW() - INTERVAL '15 days'),
  (5, 8, NOW() - INTERVAL '14 days'),
  (5, 12, NOW() - INTERVAL '13 days'),
  (5, 13, NOW() - INTERVAL '10 days'),
  (5, 15, NOW() - INTERVAL '8 days'),
  (5, 21, NOW() - INTERVAL '7 days'),
  (5, 25, NOW() - INTERVAL '12 hours'),
  -- Favorit Member lain
  (6, 1, NOW() - INTERVAL '19 days'),
  (6, 2, NOW() - INTERVAL '18 days'),
  (6, 16, NOW() - INTERVAL '8 days'),
  (6, 21, NOW() - INTERVAL '9 days'),
  (6, 26, NOW() - INTERVAL '6 days'),
  (7, 1, NOW() - INTERVAL '18 days'),
  (7, 5, NOW() - INTERVAL '14 days'),
  (7, 13, NOW() - INTERVAL '9 days'),
  (7, 16, NOW() - INTERVAL '7 days'),
  (7, 20, NOW() - INTERVAL '5 days'),
  (8, 2, NOW() - INTERVAL '16 days'),
  (8, 4, NOW() - INTERVAL '14 days'),
  (8, 26, NOW() - INTERVAL '6 days'),
  (9, 1, NOW() - INTERVAL '17 days'),
  (9, 4, NOW() - INTERVAL '15 days'),
  (9, 8, NOW() - INTERVAL '12 days'),
  (10, 12, NOW() - INTERVAL '12 days'),
  (10, 15, NOW() - INTERVAL '7 days'),
  (10, 17, NOW() - INTERVAL '3 days'),
  (11, 5, NOW() - INTERVAL '12 days'),
  (11, 21, NOW() - INTERVAL '8 days'),
  (11, 22, NOW() - INTERVAL '4 days'),
  (12, 9, NOW() - INTERVAL '10 days');

-- 4.6 Collections (7 Moodboards Tematik)
INSERT INTO collections (id, user_id, name, description, created_at) VALUES
  (1, 5, 'Referensi Neon & Cyberpunk',
   'Kumpulan pencahayaan neon kota malam, estetika synthwave, dan atmosfer urban futuristik.',
   NOW() - INTERVAL '15 days'),
  (2, 5, 'Minimalis & Gelap Sinematik',
   'Referensi arsitektur modern, gradien gelap obsidian, dan pencahayaan dramatis.',
   NOW() - INTERVAL '10 days'),
  (3, 5, 'Alam, Botani & Fantasi',
   'Inspirasi kastil berkabut, lukisan flora klasik, dan lanskap pegunungan berbintang.',
   NOW() - INTERVAL '6 days'),
  (4, 6, 'Arsitektur & Studi Permukaan',
   'Referensi bentuk geometris, fasad kaca, dan tata antarmuka bersih untuk proyek 3D.',
   NOW() - INTERVAL '8 days'),
  (5, 7, 'Palet Kosmik & Mistis',
   'Referensi nebula ungu, hutan berkabut, dan pencahayaan dramatis untuk seri ilustrasi.',
   NOW() - INTERVAL '7 days'),
  (6, 9, 'Inspirasi Kota Malam',
   'Kumpulan warna neon magenta-sian dan atmosfer retro cyberpunk.',
   NOW() - INTERVAL '11 days'),
  (7, 11, 'Referensi Geometri & UI',
   'Bentuk lengkung minimalis dan studi warna 3D untuk eksplorasi desain produk.',
   NOW() - INTERVAL '5 days');

-- 4.7 Collection Items (Sinkron dengan tema tiap moodboard)
INSERT INTO collection_items (collection_id, artwork_id, created_at) VALUES
  (1, 2, NOW() - INTERVAL '14 days'),
  (1, 4, NOW() - INTERVAL '13 days'),
  (2, 8, NOW() - INTERVAL '10 days'),
  (2, 21, NOW() - INTERVAL '7 days'),
  (3, 12, NOW() - INTERVAL '6 days'),
  (3, 13, NOW() - INTERVAL '5 days'),
  (3, 15, NOW() - INTERVAL '4 days'),
  (3, 25, NOW() - INTERVAL '10 hours'),
  (4, 1, NOW() - INTERVAL '8 days'),
  (4, 21, NOW() - INTERVAL '7 days'),
  (4, 26, NOW() - INTERVAL '5 days'),
  (5, 13, NOW() - INTERVAL '7 days'),
  (5, 16, NOW() - INTERVAL '6 days'),
  (5, 20, NOW() - INTERVAL '4 days'),
  (6, 1, NOW() - INTERVAL '11 days'),
  (6, 4, NOW() - INTERVAL '10 days'),
  (6, 8, NOW() - INTERVAL '9 days'),
  (7, 5, NOW() - INTERVAL '5 days'),
  (7, 21, NOW() - INTERVAL '4 days'),
  (7, 22, NOW() - INTERVAL '3 days');

-- 4.8 Comments (24 Komentar Komunitas yang Nyambung dengan Subjek Gambar)
INSERT INTO comments (artwork_id, user_id, content, created_at) VALUES
  (1, 6, 'Pencahayaan magenta dan sian di setup komputer retronya terasa autentik banget! Nostalgia era 80-an.', NOW() - INTERVAL '19 days'),
  (1, 9, 'Warna neonnya seimbang, nggak over-saturated. Pantas banget jadi Juara #2 di challenge Cyberpunk!', NOW() - INTERVAL '2 days'),
  (1, 11, 'Suka banget detail keyboard dan monitor CRT-nya, langsung kebayang vibe synthwave.', NOW() - INTERVAL '6 hours'),
  (2, 5, 'Komposisi papan neon Shibuya-nya bikin mata langsung masuk ke kedalaman jalan! Selamat Juara #1 Sora!', NOW() - INTERVAL '2 days'),
  (2, 8, 'Exposure malamnya rapi sekali, highlight papan reklame tetap terbaca jelas tanpa pecah.', NOW() - INTERVAL '16 days'),
  (2, 12, 'Palet warna biru dingin ketemu merah neonnya benar-benar sinematik.', NOW() - INTERVAL '10 days'),
  (3, 5, 'Kabut ungu di antara gedung tingginya dapet banget kesan kota cyberpunk tengah malam.', NOW() - INTERVAL '15 days'),
  (4, 9, 'Portal geometris neonnya bersih banget, cocok buat cover album synthwave!', NOW() - INTERVAL '14 days'),
  (5, 5, 'Transisi gradien biru-ungunya mulus banget Kaelen! Ini pakai shader procedural di Blender?', NOW() - INTERVAL '15 days'),
  (5, 6, 'Betul Aria! Pakai displaced plane + glossy coat dengan pencahayaan area light warna kontras.', NOW() - INTERVAL '14 days'),
  (6, 11, 'Pantulan iridescent di lengkungannya kelihatan lembut tapi tetap tajam.', NOW() - INTERVAL '12 days'),
  (8, 11, 'Gradien obsidiannya cocok banget dijadikan wallpaper minimal dark mode.', NOW() - INTERVAL '11 days'),
  (9, 12, 'Aliran pigmen cairnya terasa sangat organik, perpaduan warnanya berani!', NOW() - INTERVAL '11 days'),
  (12, 10, 'Kastil batu di tengah kabut lembahnya kerasa seperti dunia RPG klasik. Atmosfernya juara!', NOW() - INTERVAL '12 days'),
  (13, 5, 'Pencahayaan chiaroscuro pada kelopak bunganya bikin kesannya seperti lukisan museum Eropa.', NOW() - INTERVAL '9 days'),
  (13, 7, 'Kontras warna bunga dengan latar hitam pekatnya sangat elegan Maya!', NOW() - INTERVAL '8 days'),
  (15, 7, 'Langit berbintang di atas puncak pegunungannya bikin adem dilihat berlama-lama.', NOW() - INTERVAL '7 days'),
  (16, 6, 'Tekstur debu bintang dan nebula ungunya sangat dalam. Kerasa banget skala kosmiknya!', NOW() - INTERVAL '7 days'),
  (16, 10, 'Keren banget Aria, langsung masuk ke moodboard inspirasiku!', NOW() - INTERVAL '1 day'),
  (18, 7, 'Cahaya jaringan kota dari orbitnya bikin Bumi kelihatan seperti sirkuit hidup.', NOW() - INTERVAL '9 days'),
  (20, 12, 'Sinar matahari yang menembus kabut hutannya dramatis banget!', NOW() - INTERVAL '5 days'),
  (21, 11, 'Perspektif fasad kacanya simetris dan tajam sekali Raka.', NOW() - INTERVAL '8 days'),
  (22, 6, 'Garis lengkung arsitektur putihnya bersih banget, permainan bayangannya presisi.', NOW() - INTERVAL '4 days'),
  (26, 8, 'Hierarki tipografi dan ruang kosongnya rapi, kerasa banget sistem desain modernnya.', NOW() - INTERVAL '6 days');

-- 4.9 Reports (3 Laporan Karya Pending untuk Antrean Moderasi di /admin)
INSERT INTO reports (artwork_id, reporter_id, reason, status, created_at) VALUES
  (11, 8, 'Plagiat / Pelanggaran Hak Cipta: Diduga menggunakan aset gelombang optik tanpa atribusi pembuat asli.', 'Pending', NOW() - INTERVAL '18 hours'),
  (14, 6, 'Alasan Lainnya: Karya berupa fotografi bunga, sebaiknya dipindahkan ke kategori Photography.', 'Pending', NOW() - INTERVAL '9 hours'),
  (27, 9, 'Spam / Penipuan: Tampilan dashboard terlihat serupa dengan template publik tanpa keterangan modifikasi.', 'Pending', NOW() - INTERVAL '3 hours');

-- 4.9b Comment Reports (2 Laporan Komentar Pending untuk Antrean Moderasi di /admin)
INSERT INTO comment_reports (comment_id, reporter_id, reason, status, created_at) VALUES
  (3, 5, 'Spam / Promosi: Komentar dinilai repetitif dan kurang relevan dengan detail teknis karya.', 'Pending', NOW() - INTERVAL '5 hours'),
  (11, 7, 'Alasan Lainnya: Mohon ditinjau apakah komentar ini sesuai pedoman komunitas.', 'Pending', NOW() - INTERVAL '2 hours');

-- 4.10 Challenges (6 Challenge dengan 4 Status: Ended+Winners, Ended+Unjudged, 3 Ongoing, 1 Upcoming)
INSERT INTO challenges (id, curator_id, title, description, rules, prize, start_date, end_date, banner_url, created_at) VALUES
  (1, 2, 'Neon & Cybernetic Nights 2026',
   'Eksplorasi visual dunia malam futuristik dengan pencahayaan neon, retro synthwave, dan atmosfer kota sibernetik.',
   E'1. Karya orisinal bertema Cyberpunk, Retro Neon, atau Synthwave.\n2. Maksimal 1 karya per Member.\n3. Juara #1, #2, dan #3 dipilih resmi oleh Curator setelah periode berakhir.',
   'Rp 5.000.000 + Official Gold Badge',
   NOW() - INTERVAL '25 days',
   NOW() - INTERVAL '3 days',
   'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1200&q=85',
   NOW() - INTERVAL '27 days'),

  (2, 2, 'Abstract 3D & Fluid Forms',
   'Ciptakan komposisi 3D atau seni abstrak eksperimental yang mengeksplorasi tekstur fluida, warna spektral, dan bentuk organik.',
   E'1. Terbuka untuk kategori 3D Art dan Abstract.\n2. Periode submisi telah ditutup; Curator dapat menentukan Juara #1, #2, #3 melalui Curator Studio.',
   'Rp 3.500.000 + Curator Spotlight',
   NOW() - INTERVAL '18 days',
   NOW() - INTERVAL '1 day',
   'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=85',
   NOW() - INTERVAL '19 days'),

  (3, 2, 'Botanical & Wilderness Reverie',
   'Rayakan keindahan flora, hutan berkabut, dan lanskap alam liar dengan sentuhan atmosfer puitis dan pencahayaan dramatis.',
   E'1. Terbuka untuk seluruh Member Aesthe (ilustrasi, lukisan digital, maupun fotografi alam).\n2. Maksimal 1 karya per peserta.\n3. Submisi dapat ditarik kembali sebelum batas waktu berakhir.',
   'Wacom Intuos Pro + Spotlight Home',
   NOW() - INTERVAL '4 days',
   NOW() + INTERVAL '10 days',
   'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1200&q=85',
   NOW() - INTERVAL '5 days'),

  (4, 13, 'Minimalist Architecture & Geometry',
   'Tangkap keindahan garis geometris, ruang kosong, fasad modern, dan permainan bayangan dalam arsitektur minimalis.',
   E'1. Terbuka untuk fotografi arsitektur, 3D struktural, dan desain geometris.\n2. Maksimal 1 karya per peserta.\n3. Penjurian menilai kekuatan komposisi, simetri, dan pencahayaan.',
   'Featured Exhibition + Rp 3.000.000',
   NOW() - INTERVAL '3 days',
   NOW() + INTERVAL '14 days',
   'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=85',
   NOW() - INTERVAL '4 days'),

  (5, 2, 'Beyond the Horizon: Cosmic Odyssey',
   'Bawa imajinasi melampaui atmosfer bumi melalui visualisasi nebula, galaksi, orbit planet, dan eksplorasi antariksa.',
   E'1. Karya bertema luar angkasa, kosmik, atau sci-fi.\n2. Maksimal 1 karya per Member.\n3. Diutamakan orisinalitas palet warna dan kedalaman atmosfer.',
   'Rp 4.000.000 + Digital Exhibition Feature',
   NOW() - INTERVAL '2 days',
   NOW() + INTERVAL '18 days',
   'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200&q=85',
   NOW() - INTERVAL '3 days'),

  (6, 13, 'Spatial UI & Future Interfaces 2026',
   'Rancang konsep antarmuka digital generasi berikutnya yang memadukan estetika dark luxury, kejelasan data, dan ergonomi modern.',
   E'1. Terbuka untuk kategori UI/UX Design & Digital Product.\n2. Submisi dibuka otomatis sesuai jadwal mulai.\n3. Sertakan penjelasan singkat konsep interaksi pada deskripsi karya.',
   'Figma Pro Annual + Rp 2.500.000',
   NOW() + INTERVAL '4 days',
   NOW() + INTERVAL '24 days',
   'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=85',
   NOW() - INTERVAL '1 day');

-- 4.11 Challenge Submissions (100% Sinkron dengan Tema Challenge masing-masing)
INSERT INTO challenge_submissions (challenge_id, artwork_id, member_id, winner_rank, created_at) VALUES
  -- Challenge 1: Neon & Cybernetic Nights 2026 (Ended + Official Podium Winners -> tampil otomatis di Podium /home)
  (1, 2, 9, 1, NOW() - INTERVAL '20 days'),   -- Juara #1: Shibuya Neon Crossing (Sora)
  (1, 1, 5, 2, NOW() - INTERVAL '19 days'),   -- Juara #2: Retro Terminal 1984 (Aria)
  (1, 4, 6, 3, NOW() - INTERVAL '17 days'),   -- Juara #3: Neon Prism Portal (Kaelen)

  -- Challenge 2: Abstract 3D & Fluid Forms (Ended & BELUM dinilai -> Curator Elena bisa tes pilih Juara #1-#3)
  (2, 5, 6, NULL, NOW() - INTERVAL '15 days'),   -- Chromatic Silk Wave 3D (Kaelen)
  (2, 9, 7, NULL, NOW() - INTERVAL '13 days'),   -- Chromatic Fluid Swirl (Nara)
  (2, 10, 12, NULL, NOW() - INTERVAL '11 days'), -- Spectrum Flow Experiment (Chloe)

  -- Challenge 3: Botanical & Wilderness Reverie (Ongoing — Aria belum ikut agar bisa tes Submit Your Work)
  (3, 13, 10, NULL, NOW() - INTERVAL '3 days'),  -- Nocturne Floral Still Life (Maya)
  (3, 12, 7, NULL, NOW() - INTERVAL '2 days'),   -- Citadel of the Misty Vale (Nara)
  (3, 15, 12, NULL, NOW() - INTERVAL '1 day'),   -- Starlight Over Alpine Ridge (Chloe)

  -- Challenge 4: Minimalist Architecture & Geometry (Ongoing)
  (4, 21, 8, NULL, NOW() - INTERVAL '2 days'),   -- Glass Monolith Perspective (Raka)
  (4, 6, 6, NULL, NOW() - INTERVAL '1 day'),     -- Iridescent Sculpture Study (Kaelen)
  (4, 26, 11, NULL, NOW() - INTERVAL '16 hours'),-- Aether OS — Design System (Davin)

  -- Challenge 5: Beyond the Horizon: Cosmic Odyssey (Ongoing)
  (5, 16, 5, NULL, NOW() - INTERVAL '1 day'),    -- Velvet Nebula Reverie (Aria)
  (5, 17, 7, NULL, NOW() - INTERVAL '12 hours'); -- Stargazer Beneath the Milky Way (Nara)

-- 4.12 Follows (24 Relasi Mengikuti antar Kreator)
INSERT INTO follows (follower_id, following_id, created_at) VALUES
  (5, 6, NOW() - INTERVAL '20 days'),
  (5, 7, NOW() - INTERVAL '18 days'),
  (5, 8, NOW() - INTERVAL '16 days'),
  (5, 9, NOW() - INTERVAL '15 days'),
  (5, 10, NOW() - INTERVAL '10 days'),
  (6, 5, NOW() - INTERVAL '19 days'),
  (6, 7, NOW() - INTERVAL '14 days'),
  (6, 8, NOW() - INTERVAL '12 days'),
  (6, 9, NOW() - INTERVAL '11 days'),
  (7, 5, NOW() - INTERVAL '17 days'),
  (7, 10, NOW() - INTERVAL '11 days'),
  (7, 12, NOW() - INTERVAL '9 days'),
  (8, 5, NOW() - INTERVAL '15 days'),
  (8, 6, NOW() - INTERVAL '13 days'),
  (8, 11, NOW() - INTERVAL '8 days'),
  (9, 5, NOW() - INTERVAL '16 days'),
  (9, 6, NOW() - INTERVAL '12 days'),
  (10, 5, NOW() - INTERVAL '4 hours'),
  (10, 7, NOW() - INTERVAL '10 days'),
  (10, 12, NOW() - INTERVAL '7 days'),
  (11, 6, NOW() - INTERVAL '9 days'),
  (11, 8, NOW() - INTERVAL '7 days'),
  (12, 5, NOW() - INTERVAL '2 hours'),
  (12, 10, NOW() - INTERVAL '6 days');

-- 4.13 Direct Messages (12 Pesan — termasuk unread untuk notifikasi real di /home)
INSERT INTO direct_messages (sender_id, receiver_id, content, is_read, created_at) VALUES
  (2, 5, 'Halo Aria! Selamat atas prestasi Juara #2 di challenge Neon & Cybernetic Nights 2026. Karya Retro Terminal 1984 sangat berkarakter!', FALSE, NOW() - INTERVAL '2 days'),
  (2, 9, 'Selamat Sora! Shibuya Neon Crossing resmi terpilih sebagai Juara #1 pada Neon & Cybernetic Nights 2026!', FALSE, NOW() - INTERVAL '2 days'),
  (6, 5, 'Hai Aria, suka banget sama Velvet Nebula Reverie dan Retro Terminal 1984. Boleh kolaborasi untuk challenge kosmik bulan ini?', TRUE, NOW() - INTERVAL '3 days'),
  (5, 6, 'Halo Kaelen! Terima kasih banyak, boleh banget! Aku penasaran gabungin palet nebula aku dengan bentuk 3D kamu.', TRUE, NOW() - INTERVAL '2 days 20 hours'),
  (6, 5, 'Siap! Aku sudah mulai bikin sketsa shader 3D-nya, nanti sore aku kirim preview-nya di sini ya.', FALSE, NOW() - INTERVAL '4 hours'),
  (9, 5, 'Halo Aria! Karya Retro Terminal 1984 keren banget pencahayaan neonnya, salam kenal dari penggemar cyberpunk juga!', TRUE, NOW() - INTERVAL '5 days'),
  (5, 9, 'Salam kenal Sora! Foto Shibuya Neon Crossing kamu juga luar biasa tajam, pantas banget juara 1!', TRUE, NOW() - INTERVAL '4 days 21 hours'),
  (10, 7, 'Hai Nara, kastil berkabut di Citadel of the Misty Vale vibes-nya puitis banget. Cocok masuk challenge Botanical & Wilderness!', TRUE, NOW() - INTERVAL '2 days'),
  (7, 10, 'Makasih banyak Maya! Lukisan Nocturne Floral kamu juga keren banget pencahayaan gelapnya.', TRUE, NOW() - INTERVAL '1 day 20 hours'),
  (11, 8, 'Halo Raka, prototipe Atelier Mobile App dan foto arsitektur kamu rapi sekali! Boleh tukar referensi UI?', TRUE, NOW() - INTERVAL '1 day'),
  (8, 11, 'Boleh banget Davin! Aku juga suka banget desain Pulse Analytics Dashboard kamu.', FALSE, NOW() - INTERVAL '7 hours'),
  (13, 8, 'Halo Raka, terima kasih sudah ikut Minimalist Architecture & Geometry. Komposisi Glass Monolith-nya sangat kuat!', FALSE, NOW() - INTERVAL '5 hours');

-- ============================================================================
-- 5. SINKRONISASI ULANG SEQUENCE AUTO-INCREMENT (AGAR INSERT BARU AMAN)
-- ============================================================================
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1), true);
SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE((SELECT MAX(id) FROM categories), 1), true);
SELECT setval(pg_get_serial_sequence('artworks', 'id'), COALESCE((SELECT MAX(id) FROM artworks), 1), true);
SELECT setval(pg_get_serial_sequence('artwork_reactions', 'id'), COALESCE((SELECT MAX(id) FROM artwork_reactions), 1), true);
SELECT setval(pg_get_serial_sequence('favorites', 'id'), COALESCE((SELECT MAX(id) FROM favorites), 1), true);
SELECT setval(pg_get_serial_sequence('collections', 'id'), COALESCE((SELECT MAX(id) FROM collections), 1), true);
SELECT setval(pg_get_serial_sequence('collection_items', 'id'), COALESCE((SELECT MAX(id) FROM collection_items), 1), true);
SELECT setval(pg_get_serial_sequence('comments', 'id'), COALESCE((SELECT MAX(id) FROM comments), 1), true);
SELECT setval(pg_get_serial_sequence('reports', 'id'), COALESCE((SELECT MAX(id) FROM reports), 1), true);
SELECT setval(pg_get_serial_sequence('comment_reports', 'id'), COALESCE((SELECT MAX(id) FROM comment_reports), 1), true);
SELECT setval(pg_get_serial_sequence('challenges', 'id'), COALESCE((SELECT MAX(id) FROM challenges), 1), true);
SELECT setval(pg_get_serial_sequence('challenge_submissions', 'id'), COALESCE((SELECT MAX(id) FROM challenge_submissions), 1), true);
SELECT setval(pg_get_serial_sequence('follows', 'id'), COALESCE((SELECT MAX(id) FROM follows), 1), true);
SELECT setval(pg_get_serial_sequence('direct_messages', 'id'), COALESCE((SELECT MAX(id) FROM direct_messages), 1), true);

COMMIT;