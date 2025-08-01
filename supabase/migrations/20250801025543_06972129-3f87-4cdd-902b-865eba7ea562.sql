-- Limpar status de creatives para clientes que não têm toggles ativados
-- Isso será feito via aplicação quando os usuários acessarem a etapa 4
UPDATE clients 
SET creatives_status = null, captions_status = null
WHERE creatives_status = 'pending' AND captions_status = 'pending';