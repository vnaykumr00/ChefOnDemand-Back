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

export const createNewDish = async (dishData) => {
  // Ensure ChefId is present - usually from req.user but passed in body for now or controller
  const { data, error } = await supabase
    .from('dishes')
    .insert([dishData])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const updateExistingDish = async (dishId, updates) => {
  const { data, error } = await supabase
    .from('dishes')
    .update(updates)
    .eq('DishId', dishId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const deleteDishById = async (dishId) => {
  // Soft delete
  const { error } = await supabase
    .from('dishes')
    .update({ IsActive: false })
    .eq('DishId', dishId);

  if (error) throw new Error(error.message);
  return true;
};
