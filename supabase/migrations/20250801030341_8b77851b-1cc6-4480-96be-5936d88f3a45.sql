-- Atualizar o cliente de teste com os status corretos baseados nos dados salvos
UPDATE clients 
SET creatives_status = 'approved', captions_status = 'approved' 
WHERE id = '002de17b-1399-4564-9905-c8f756105022';