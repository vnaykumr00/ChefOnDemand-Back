import {supabase} from '../config/supabase.js';

// ---------------- Register Chef ----------------
export const registerChefService = async ({
  userId,
  email,
  fullName,
  phoneNumber,
  address,
  cuisines,
  experience,
  about,
  dishes,
  chefType,
}) => {
  // 1) users
  const { data: userData, error: userError } = await supabase
    .from('users')
    .upsert({
      Id: userId,
      Email: email,
      Role: 'chef',
      Name: fullName,
      Phone: phoneNumber,
      PhoneVerified: true,
      Address: address || {},
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
    })
    .select()
    .single();

  if (userError) throw new Error(`USER:${userError.message}`);

  // 2) chefProfiles
  const { data: chefProfileData, error: chefProfileError } =
    await   supabase
      .from('chefProfiles')
      .upsert({
        ChefId: userId,
        Cuisine: cuisines,
        Experience: parseInt(experience) || 0,
        About: about || '',
        ProfileUrl: {},
        TotalBookings: 0,
        ResponseRate: 0,
        Rating: 0,
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString(),
      })
      .select()
      .single();

  if (chefProfileError) {
    await supabase.from('users').delete().eq('Id', userId);
    throw new Error(`PROFILE:${chefProfileError.message}`);
  }

  // 3) dishMapChef
  if (dishes && dishes.length > 0) {
    const dishMappings = dishes.map((d) => ({
      ChefId: userId,
      DishId: d.dishId,
      BasePricePerPerson: parseFloat(d.price) || 0,
      IsSpecial: d.isSpecial || false,
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
    }));

    const { error: dishMapError } = await supabase
      .from('dishMapChef')
      .insert(dishMappings);

    if (dishMapError) {
      await supabase.from('chefProfiles').delete().eq('ChefId', userId);
      await supabase.from('users').delete().eq('Id', userId);
      throw new Error(`DISHMAP:${dishMapError.message}`);
    }
  }

  return { userData, chefProfileData };
};

// ---------------- Get dishes for registration ----------------
export const getChefDishesService = async (cuisineIds) => {
  let query = supabase
    .from('dishes')
    .select('*, cuisines(Name)')
    .eq('IsActive', true);

  if (cuisineIds) {
    const ids = typeof cuisineIds === 'string'
      ? cuisineIds.split(',')
      : cuisineIds;

    query = query.in('CuisineId', ids);
  }

  const { data, error } = await query.order('Name', { ascending: true });

  if (error) throw new Error(error.message);

  return data;
};

// ---------------- Chef profile ----------------
export const getChefProfileService = async (chefId) => {
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('Id', chefId)
    .eq('Role', 'chef')
    .single();

  if (userError || !userData) return null;

  const { data: chefProfile } = await supabase
    .from('chefProfiles')
    .select('*')
    .eq('ChefId', chefId)
    .single();

  const { data: dishes } = await supabase
    .from('dishMapChef')
    .select('*, dishes(*)')
    .eq('ChefId', chefId);

  return { userData, chefProfile, dishes };
};

// ---------------- Availability ----------------
export const setAvailabilityService = async (userId, lat, lng) => {
  const { data, error } = await supabase
    .from('chefAvailability')
    .upsert({
      ChefId: userId,
      LocLat: lat,
      LocLng: lng,
      LastUpdated: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
};

export const deleteAvailabilityService = async (userId) => {
  const { error } = await supabase
    .from('chefAvailability')
    .delete()
    .eq('ChefId', userId);

  if (error) throw new Error(error.message);
};

export const getAvailabilityService = async (userId) => {
  const { data, error } = await supabase
    .from('chefAvailability')
    .select('*')
    .eq('ChefId', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data;
};
