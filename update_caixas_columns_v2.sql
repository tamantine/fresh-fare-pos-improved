-- Rename columns to match the application code's new expectation (which matches the Real Schema as per instructions)
-- If the DB currently has val_abertura, we rename to valor_abertura.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'caixas' AND column_name = 'val_abertura') THEN
        ALTER TABLE public.caixas RENAME COLUMN val_abertura TO valor_abertura;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'caixas' AND column_name = 'val_fechamento') THEN
        ALTER TABLE public.caixas RENAME COLUMN val_fechamento TO valor_fechamento;
    END IF;
END $$;
