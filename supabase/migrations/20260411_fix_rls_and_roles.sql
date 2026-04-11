
-- Fix has_role function to include admin_ccm as a generic admin role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
    AND (
      role = _role 
      OR (role = 'admin_ccm' AND _role = 'admin') -- admin_ccm counts as admin
    )
  );
END;
$$;

-- Ensure admin_ccm exists in the enum (just in case)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'admin_ccm') THEN
    ALTER TYPE public.app_role ADD VALUE 'admin_ccm' AFTER 'admin';
  END IF;
END $$;

-- Policies for profiles are already using has_role(..., 'admin'), 
-- so the function update above fixes it globally for all tables using it.
