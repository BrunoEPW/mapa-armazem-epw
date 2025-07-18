-- Phase 1: Critical Database Security Fixes

-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'viewer');

-- Create profiles table for user authentication
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get user role (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create security definer function to check if user has role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = _user_id AND role = _role
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'viewer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Profiles RLS Policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Update existing table policies to require authentication

-- Products: Admin/Editor can manage, all authenticated users can view
DROP POLICY IF EXISTS "Enable all operations for everyone" ON public.products;

CREATE POLICY "Authenticated users can view products"
  ON public.products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and editors can insert products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_current_user_role() IN ('admin', 'editor')
  );

CREATE POLICY "Admins and editors can update products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (
    public.get_current_user_role() IN ('admin', 'editor')
  );

CREATE POLICY "Only admins can delete products"
  ON public.products FOR DELETE
  TO authenticated
  USING (
    public.get_current_user_role() = 'admin'
  );

-- Materials: Admin/Editor can manage, all authenticated users can view
DROP POLICY IF EXISTS "Enable all operations for everyone" ON public.materials;

CREATE POLICY "Authenticated users can view materials"
  ON public.materials FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and editors can insert materials"
  ON public.materials FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_current_user_role() IN ('admin', 'editor')
  );

CREATE POLICY "Admins and editors can update materials"
  ON public.materials FOR UPDATE
  TO authenticated
  USING (
    public.get_current_user_role() IN ('admin', 'editor')
  );

CREATE POLICY "Only admins can delete materials"
  ON public.materials FOR DELETE
  TO authenticated
  USING (
    public.get_current_user_role() = 'admin'
  );

-- Movements: Admin/Editor can manage, all authenticated users can view
DROP POLICY IF EXISTS "Enable all operations for everyone" ON public.movements;

CREATE POLICY "Authenticated users can view movements"
  ON public.movements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and editors can insert movements"
  ON public.movements FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_current_user_role() IN ('admin', 'editor')
  );

CREATE POLICY "Admins and editors can update movements"
  ON public.movements FOR UPDATE
  TO authenticated
  USING (
    public.get_current_user_role() IN ('admin', 'editor')
  );

CREATE POLICY "Only admins can delete movements"
  ON public.movements FOR DELETE
  TO authenticated
  USING (
    public.get_current_user_role() = 'admin'
  );

-- Audit Logs: Only authenticated users can view, system can insert
DROP POLICY IF EXISTS "Enable all operations for everyone" ON public.audit_logs;

CREATE POLICY "Authenticated users can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);