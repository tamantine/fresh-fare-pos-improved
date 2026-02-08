-- FORCE RELOAD SCHEMA CACHE
-- Run this in Supabase SQL Editor to refresh the API definition
NOTIFY pgrst, 'reload config';

-- VERIFY TRIGGERS (Check if any old trigger exists)
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'caixas';
