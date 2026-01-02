import { supabase } from '../config/supabase.js';

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
    await supabase
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
    // Fetch ImageUrls from dishes table
    const dishIds = dishes.map(d => d.dishId);
    const { data: dbDishes, error: dishFetchError } = await supabase
      .from('dishes')
      .select('DishId, ImageUrls')
      .in('DishId', dishIds);

    if (dishFetchError) {
      // Rollback
      await supabase.from('chefProfiles').delete().eq('ChefId', userId);
      await supabase.from('users').delete().eq('Id', userId);
      throw new Error(`DISH_FETCH:${dishFetchError.message}`);
    }

    const dishInfoMap = (dbDishes || []).reduce((acc, d) => {
      acc[d.DishId] = d;
      return acc;
    }, {});

    const dishMappings = dishes.map((d) => {
      const dbDish = dishInfoMap[d.dishId];
      let selectedImage = null;

      // Randomly select an image URL if available
      if (dbDish && dbDish.ImageUrls && Array.isArray(dbDish.ImageUrls) && dbDish.ImageUrls.length > 0) {
        const randomIndex = Math.floor(Math.random() * dbDish.ImageUrls.length);
        selectedImage = dbDish.ImageUrls[randomIndex];
      }

      return {
        ChefId: userId,
        DishId: d.dishId,
        BasePricePerPerson: parseFloat(d.price) || 0,
        IsSpecial: d.isSpecial || false,
        ImageUrl: selectedImage,
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString(),
      };
    });

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

// ---------------- Public Profile (Customer View) ----------------
export const getChefPublicProfileService = async (chefId) => {
  // 1. Fetch User & Profile
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select(`
      Id, Name, Phone, Address,
      chefProfiles (
        Cuisine, Rating, About, ProfileUrl, TotalBookings, ResponseRate, Experience
      ),
      chefAvailability ( LocLat, LocLng )
    `)
    .eq('Id', chefId)
    .single();

  if (userError || !userData) return null;

  // 2. Fetch Cuisines for Mapping
  const { data: cuisinesData } = await supabase
    .from('cuisines')
    .select('CuisineId, Name');

  const cuisineMap = (cuisinesData || []).reduce((acc, c) => {
    acc[c.CuisineId] = c.Name;
    return acc;
  }, {});

  // 3. Fetch Dishes with Customer Pricing (Manual Join to avoid relationship errors)
  const { data: menuMapData, error: menuMapError } = await supabase
    .from('dishMapChef')
    .select(`
      DishId,
      BasePricePerPerson,
      IsSpecial,
      ImageUrl
    `)
    .eq('ChefId', chefId);

  if (menuMapError) throw new Error(menuMapError.message);

  let menuData = [];
  if (menuMapData && menuMapData.length > 0) {
    const dishIds = menuMapData.map(d => d.DishId);

    const { data: dishesData, error: dishesError } = await supabase
      .from('dishes')
      .select('DishId, Name, Description, Ingredients, IsVegetarian, Quantity')
      .in('DishId', dishIds);

    if (dishesError) throw new Error(dishesError.message);

    // Merge data
    const dishMap = (dishesData || []).reduce((acc, d) => {
      acc[d.DishId] = d;
      return acc;
    }, {});

    menuData = menuMapData.map(item => ({
      ...item,
      dishes: dishMap[item.DishId] || {} // Mocking the structure expected: item.dishes.Name, etc.
    }));
  }

  return {
    userData,
    chefProfile: userData.chefProfiles,
    availability: userData.chefAvailability,
    cuisineMap,
    menuData
  };
};
