-- Create smart_contracts table to store tracked contracts
CREATE TABLE public.smart_contracts (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    address TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('fiat', 'asset')),
    decimals INTEGER NOT NULL DEFAULT 18,
    chain_id INTEGER NOT NULL DEFAULT 11155111,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.smart_contracts ENABLE ROW LEVEL SECURITY;

-- Allow public read access (contracts are public info)
CREATE POLICY "Anyone can view contracts"
ON public.smart_contracts
FOR SELECT
USING (true);

-- Allow public insert/update for now (we can add auth later)
CREATE POLICY "Anyone can insert contracts"
ON public.smart_contracts
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update contracts"
ON public.smart_contracts
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete contracts"
ON public.smart_contracts
FOR DELETE
USING (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_smart_contracts_updated_at
BEFORE UPDATE ON public.smart_contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();