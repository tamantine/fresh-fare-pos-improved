-- Rename columns to match the application code
ALTER TABLE public.caixas RENAME COLUMN val_abertura TO valor_inicial;
ALTER TABLE public.caixas RENAME COLUMN val_fechamento TO valor_final;
