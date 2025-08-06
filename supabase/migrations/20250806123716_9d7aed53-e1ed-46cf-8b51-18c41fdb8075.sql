-- Add new fields to clients table
ALTER TABLE public.clients 
ADD COLUMN drive_folder_link TEXT,
ADD COLUMN copy_legends_document_link TEXT;