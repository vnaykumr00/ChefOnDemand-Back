-- 06_search_function.sql

-- Drop the function first to allow changing the return type signature
DROP FUNCTION IF EXISTS get_search_hints(TEXT);

CREATE OR REPLACE FUNCTION get_search_hints(search_term TEXT)
RETURNS TABLE (
  label TEXT,
  type TEXT,
  id TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Search Chefs (Name Only)
  SELECT 
    u."Name"::text as label, 
    'Chef'::text as type, 
    u."Id"::text as id
  FROM "users" u
  JOIN "chefProfiles" cp ON u."Id" = cp."ChefId"
  WHERE u."Name" ILIKE '%' || search_term || '%'
  
  UNION
  
  -- Search Dishes
  SELECT 
    d."Name"::text as label, 
    'Dish'::text as type, 
    d."DishId"::text as id
  FROM "dishes" d
  WHERE d."Name" ILIKE '%' || search_term || '%'
  
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;
