-- Alterar colunas para permitir NULL
ALTER TABLE clients 
ALTER COLUMN creatives_status DROP NOT NULL,
ALTER COLUMN captions_status DROP NOT NULL;

-- Limpar status para clientes que não têm toggles ativados
UPDATE clients 
SET creatives_status = null, captions_status = null
WHERE creatives_status = 'pending' AND captions_status = 'pending';