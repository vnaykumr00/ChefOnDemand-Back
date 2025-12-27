import {supabase} from '../config/supabase.js';

export const fetchAllCuisines = async () => {
  const { data, error } = await supabase
    .from('cuisines')
    .select('*')
    .order('Name', { ascending: true });

  if (error) throw new Error(error.message);

  return data;
};
