
-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  date_of_birth DATE,
  living_location TEXT DEFAULT '',
  face_photo_url TEXT,
  id_card_photo_url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_is_verified ON public.profiles(is_verified);

-- 3. Create verification_requests table
CREATE TABLE public.verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_verification_requests_user_id ON public.verification_requests(user_id);
CREATE INDEX idx_verification_requests_status ON public.verification_requests(status);

-- 4. Create trees table
CREATE TABLE public.trees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  species TEXT NOT NULL DEFAULT '',
  height_meters NUMERIC,
  health TEXT NOT NULL DEFAULT 'healthy' CHECK (health IN ('healthy', 'damaged', 'diseased', 'dead')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trees_user_id ON public.trees(user_id);
CREATE INDEX idx_trees_species ON public.trees(species);

-- 5. Create tree_tags table
CREATE TABLE public.tree_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id UUID REFERENCES public.trees(id) ON DELETE CASCADE NOT NULL,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tree_tags_tree_id ON public.tree_tags(tree_id);

-- 6. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- 7. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tree_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 8. Helper functions (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_verified(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = _user_id AND is_verified = true
  )
$$;

CREATE OR REPLACE FUNCTION public.is_tree_owner(_tree_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trees WHERE id = _tree_id AND user_id = auth.uid()
  )
$$;

-- 9. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_verification_requests_updated_at BEFORE UPDATE ON public.verification_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_trees_updated_at BEFORE UPDATE ON public.trees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 11. RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 12. RLS Policies for verification_requests
CREATE POLICY "Users can view own verification" ON public.verification_requests FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create verification request" ON public.verification_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update verifications" ON public.verification_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 13. RLS Policies for trees
CREATE POLICY "Verified users can view all trees" ON public.trees FOR SELECT TO authenticated USING (public.is_verified(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Verified users can add trees" ON public.trees FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.is_verified(auth.uid()));
CREATE POLICY "Owners can update own trees" ON public.trees FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can delete own trees" ON public.trees FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 14. RLS Policies for tree_tags
CREATE POLICY "Verified users can view all tags" ON public.tree_tags FOR SELECT TO authenticated USING (public.is_verified(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can insert tags" ON public.tree_tags FOR INSERT TO authenticated WITH CHECK (public.is_tree_owner(tree_id));
CREATE POLICY "Owners can update tags" ON public.tree_tags FOR UPDATE TO authenticated USING (public.is_tree_owner(tree_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can delete tags" ON public.tree_tags FOR DELETE TO authenticated USING (public.is_tree_owner(tree_id) OR public.has_role(auth.uid(), 'admin'));

-- 15. RLS Policies for user_roles
CREATE POLICY "Admins can view roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 16. Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('tree-photos', 'tree-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('selfies', 'selfies', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('id-cards', 'id-cards', false);

-- 17. Storage policies for tree-photos (public read, authenticated insert/delete own)
CREATE POLICY "Anyone can view tree photos" ON storage.objects FOR SELECT USING (bucket_id = 'tree-photos');
CREATE POLICY "Authenticated users can upload tree photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'tree-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own tree photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'tree-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 18. Storage policies for selfies (private - user own + admin)
CREATE POLICY "Users can view own selfies" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'selfies' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Users can upload own selfies" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'selfies' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own selfies" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'selfies' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 19. Storage policies for id-cards (private - user own + admin)
CREATE POLICY "Users can view own id cards" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'id-cards' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Users can upload own id cards" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'id-cards' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own id cards" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'id-cards' AND (storage.foldername(name))[1] = auth.uid()::text);
