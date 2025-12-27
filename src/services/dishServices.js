import { supabase } from "../config/supabase.js"; 

export const fetchAllDishes = async () => {
  const { data, error } = await supabase
    .from('dishes')
    .select('*, cuisines(Name)')
    .eq('IsActive', true)
    .order('Name', { ascending: true });

  if (error) throw new Error(error.message);

  return data;
};

export const fetchDishById = async (dishId) => {
  const { data, error } = await supabase
    .from('dishes')
    .select('*, cuisines(Name)')
    .eq('DishId', dishId)
    .single();

  if (error || !data) return null;

  return data;
};
