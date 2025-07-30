-- Adicionar campo captions_status na tabela clients
ALTER TABLE public.clients 
ADD COLUMN captions_status TEXT NOT NULL DEFAULT 'pending';