-- CORRECCIÓN DE LLAVES DE MÓDULOS (Español -> Inglés)
-- Ejecuta esto para estandarizar las keys.

UPDATE public.company_modules
SET module_key = CASE 
    WHEN module_key = 'grua' THEN 'tow'
    WHEN module_key = 'corriente' THEN 'jump'
    WHEN module_key = 'llanta' THEN 'tire'
    WHEN module_key = 'gasolina' THEN 'gas'
    ELSE module_key 
END
WHERE module_key IN ('grua', 'corriente', 'llanta', 'gasolina');

-- Verificación
SELECT * FROM public.company_modules;
