-- ============================================================
-- EcoVibe 2.0 — Full Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- 1) PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT '',
  year INT NOT NULL DEFAULT 1,
  eco_points INT NOT NULL DEFAULT 0,
  streak INT NOT NULL DEFAULT 0,
  last_activity_date DATE,
  role TEXT NOT NULL DEFAULT 'student',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on auth signup (called from client after signup)
-- We'll handle profile creation from the client side instead of a trigger
-- since we need custom fields from the signup form.

-- 2) CO2 LOGS
CREATE TABLE IF NOT EXISTS co2_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- transport, food, electricity, waste
  transport_mode TEXT,
  km NUMERIC,
  food_type TEXT,
  meals INT,
  electricity_hours NUMERIC,
  waste_action TEXT,
  co2_kg NUMERIC NOT NULL DEFAULT 0,
  points_earned INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) MARKETPLACE LISTINGS
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('exchange', 'craft')),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  condition TEXT,
  price_type TEXT NOT NULL CHECK (price_type IN ('swap', 'free', 'minimal', 'custom')),
  price_amount NUMERIC DEFAULT 0,
  pickup_point_id UUID,
  images TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4) SWAP REQUESTS
CREATE TABLE IF NOT EXISTS swap_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5) CAMPUS POINTS
CREATE TABLE IF NOT EXISTS campus_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  lat NUMERIC,
  lng NUMERIC,
  map_x NUMERIC,
  map_y NUMERIC,
  icon TEXT DEFAULT 'map-pin'
);

-- 6) POSTS
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7) POST LIKES
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- 8) POST COMMENTS
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9) CHALLENGES
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly')),
  points INT NOT NULL DEFAULT 10,
  icon TEXT DEFAULT 'trophy',
  active BOOLEAN NOT NULL DEFAULT true
);

-- 10) CHALLENGE COMPLETIONS
CREATE TABLE IF NOT EXISTS challenge_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  proof_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, user_id, completed_date)
);

-- 11) REWARDS
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  points_cost INT NOT NULL,
  vendor TEXT,
  icon TEXT DEFAULT 'gift',
  active BOOLEAN NOT NULL DEFAULT true
);

-- 12) REDEMPTIONS
CREATE TABLE IF NOT EXISTS redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points_spent INT NOT NULL,
  code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13) BADGES
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'award',
  requirement TEXT
);

-- 14) USER BADGES
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE co2_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Anyone can read profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- CO2 LOGS POLICIES
CREATE POLICY "Users can read own logs" ON co2_logs FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own logs" ON co2_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own logs" ON co2_logs FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own logs" ON co2_logs FOR DELETE TO authenticated USING (user_id = auth.uid());

-- MARKETPLACE LISTINGS POLICIES
CREATE POLICY "Anyone can read active listings" ON marketplace_listings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create listings" ON marketplace_listings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own listings" ON marketplace_listings FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own listings" ON marketplace_listings FOR DELETE TO authenticated USING (user_id = auth.uid());

-- SWAP REQUESTS POLICIES
CREATE POLICY "Buyer and seller can read requests" ON swap_requests FOR SELECT TO authenticated USING (buyer_id = auth.uid() OR seller_id = auth.uid());
CREATE POLICY "Users can create requests" ON swap_requests FOR INSERT TO authenticated WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "Seller can update requests" ON swap_requests FOR UPDATE TO authenticated USING (seller_id = auth.uid());

-- CAMPUS POINTS POLICIES
CREATE POLICY "Anyone can read campus points" ON campus_points FOR SELECT TO authenticated USING (true);

-- POSTS POLICIES
CREATE POLICY "Anyone can read posts" ON posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create posts" ON posts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE TO authenticated USING (user_id = auth.uid());

-- POST LIKES POLICIES
CREATE POLICY "Anyone can read likes" ON post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can like" ON post_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can unlike" ON post_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- POST COMMENTS POLICIES
CREATE POLICY "Anyone can read comments" ON post_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create comments" ON post_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own comments" ON post_comments FOR DELETE TO authenticated USING (user_id = auth.uid());

-- CHALLENGES POLICIES
CREATE POLICY "Anyone can read challenges" ON challenges FOR SELECT TO authenticated USING (true);

-- CHALLENGE COMPLETIONS POLICIES
CREATE POLICY "Users can read own completions" ON challenge_completions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can complete challenges" ON challenge_completions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Authenticated users can update completions" ON challenge_completions FOR UPDATE TO authenticated USING (true);

-- REWARDS POLICIES
CREATE POLICY "Anyone can read rewards" ON rewards FOR SELECT TO authenticated USING (true);

-- REDEMPTIONS POLICIES
CREATE POLICY "Users can read own redemptions" ON redemptions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create redemptions" ON redemptions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- BADGES POLICIES
CREATE POLICY "Anyone can read badges" ON badges FOR SELECT TO authenticated USING (true);

-- USER BADGES POLICIES
CREATE POLICY "Anyone can read user badges" ON user_badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can award badges" ON user_badges FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
-- Run these in Supabase Dashboard → Storage → Create bucket
-- Or use the SQL below:

INSERT INTO storage.buckets (id, name, public) VALUES ('listing-images', 'listing-images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true) ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload listing images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'listing-images');

CREATE POLICY "Anyone can view listing images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'listing-images');

CREATE POLICY "Authenticated users can upload post images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'post-images');

CREATE POLICY "Anyone can view post images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'post-images');

-- ============================================================
-- SEED DATA
-- ============================================================

-- Campus Points
INSERT INTO campus_points (name, description, lat, lng, map_x, map_y, icon) VALUES
  ('Main Library', 'Central campus library - open 8 AM to 10 PM', 12.9716, 77.5946, 45, 30, 'book-open'),
  ('Canteen Block', 'Main canteen area with food courts', 12.9720, 77.5950, 60, 45, 'utensils'),
  ('Admin Block', 'Administrative offices and registration', 12.9712, 77.5942, 30, 20, 'building'),
  ('Main Gate', 'Primary entrance and security checkpoint', 12.9708, 77.5940, 15, 50, 'door-open'),
  ('Hostel Complex', 'Student residential area', 12.9724, 77.5954, 75, 35, 'home'),
  ('Stationery Shop', 'Books and supplies near library', 12.9718, 77.5948, 50, 28, 'pencil'),
  ('Pickup Zone', 'Designated exchange & pickup area', 12.9714, 77.5944, 40, 55, 'package')
ON CONFLICT DO NOTHING;

-- Challenges
INSERT INTO challenges (title, description, frequency, points, icon, active) VALUES
  ('Walk to Class', 'Walk instead of using motorized transport today', 'daily', 15, 'footprints', true),
  ('Meatless Monday', 'Have only vegetarian meals today', 'daily', 20, 'salad', true),
  ('Recycle Right', 'Properly recycle at least 3 items today', 'daily', 10, 'recycle', true),
  ('Power Down', 'Reduce screen time by 2 hours today', 'daily', 10, 'battery-low', true),
  ('Green Commute Week', 'Use only walking or cycling for 5 days', 'weekly', 75, 'bike', true),
  ('Zero Waste Challenge', 'Produce no non-recyclable waste for a full week', 'weekly', 100, 'leaf', true)
ON CONFLICT DO NOTHING;

-- Rewards
INSERT INTO rewards (title, description, points_cost, vendor, icon, active) VALUES
  ('Canteen 10% Off', '10% discount on your next canteen meal', 100, 'Campus Canteen', 'utensils', true),
  ('Free Coffee', 'One free coffee at the campus café', 50, 'Campus Café', 'coffee', true),
  ('Stationery Coupon', '₹50 off on stationery purchases', 150, 'Campus Store', 'pen-tool', true),
  ('Event Pass', 'Free entry to the next campus cultural event', 200, 'Student Council', 'ticket', true),
  ('Plant a Tree', 'We plant a tree in your name on campus', 300, 'Green Club', 'tree-pine', true)
ON CONFLICT DO NOTHING;

-- Badges
INSERT INTO badges (name, description, icon, requirement) VALUES
  ('First Steps', 'Logged your first CO2 entry', 'footprints', 'first_log'),
  ('Eco Warrior', 'Completed 10 challenges', 'shield', '10_challenges'),
  ('Green Trader', 'Made your first swap on GreenSwap', 'repeat', 'first_swap'),
  ('Social Butterfly', 'Created 5 posts on the feed', 'message-circle', '5_posts'),
  ('Point Master', 'Earned 500 EcoPoints', 'star', '500_points'),
  ('Streak Champion', 'Maintained a 7-day activity streak', 'flame', '7_streak'),
  ('Tree Hugger', 'Redeemed the Plant a Tree reward', 'tree-pine', 'tree_reward')
ON CONFLICT DO NOTHING;
