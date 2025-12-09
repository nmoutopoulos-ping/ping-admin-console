-- Create admin_wallets table to store allowed wallet addresses
CREATE TABLE public.admin_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_wallets ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read admin wallets (for verification)
CREATE POLICY "Authenticated users can view admin wallets"
ON public.admin_wallets
FOR SELECT
TO authenticated
USING (true);

-- Only allow direct database access for modifications (no API modifications)
-- This prevents any authenticated user from adding their own wallet