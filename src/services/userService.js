import { supabase } from "./../config/supabase.js";

const normalizeUser = (user) => {
  if (!user) return null;
  return {
    ...user,
    id: user.Id,
    email: user.Email,
    role: user.Role ? user.Role.toLowerCase() : user.Role,
    address: user.Address,
    createdAt: user.CreatedAt,
    updatedAt: user.UpdatedAt,
  };
};

export async function findUserById(userId) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("Id", userId)
    .single();

  return { data: normalizeUser(data), error };
}

export async function findUserByPhone(phone) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("Phone", phone)
    .single();

  return { data: normalizeUser(data), error };
}

export async function registerUser(payload) {
  const { data, error } = await supabase
    .from("users")
    .upsert(payload)
    .select()
    .single();

  return { data: normalizeUser(data), error };
}

export async function getNearbyChefs({ lat, lng, limit, maxDistance, searchQuery, searchType }) {
  // 1. Pre-fetch Dish IDs if searching by Dish
  let matchingDishIds = null;
  if (searchQuery && searchType === 'Dish') {
    const { data: dishes } = await supabase
      .from('dishes')
      .select('DishId')
      .ilike('Name', `%${searchQuery}%`);

    if (dishes) {
      matchingDishIds = new Set(dishes.map(d => d.DishId));
    }
  }

  // 2. Start building the query
  let query = supabase
    .from("chefAvailability")
    .select(`
      ChefId,
      LocLat,
      LocLng,
      users!inner (
        Id,
        Name,
        Phone,
        chefProfiles (
          Cuisine,
          ProfileUrl,
          Rating,
          About
        ),
        dishMapChef (
          DishId,
          ImageUrl,
          IsSpecial,
          BasePricePerPerson
        )
      )
    `);

  // Apply Search Filters (Chef Name)
  if (searchQuery && searchType === 'Chef') {
    query = query.ilike('users.Name', `%${searchQuery}%`);
  }

  const { data, error } = await query;

  if (error) throw error;

  // 2. Fetch all cuisines for mapping
  const { data: cuisinesData, error: cuisineError } = await supabase
    .from("cuisines")
    .select("CuisineId, Name");

  if (cuisineError) throw cuisineError;

  const cuisineMap = (cuisinesData || []).reduce((acc, c) => {
    acc[c.CuisineId] = c.Name;
    return acc;
  }, {});


  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // NEW: Fetch Real Ratings from 'ratings' table
  const chefIds = (data || []).map(c => c.ChefId);
  let ratingMap = {};
  let busyChefs = new Set();

  if (chefIds.length > 0) {
    // 3. Check for active bookings for these chefs
    // Active statuses: CHEF_ACCEPTED, CHEF_ARRIVED, PAYMENT_COMPLETED, INGREDIENTS_VERIFIED, COOKING_STARTED, COOKING_COMPLETED
    // Note: We exclude 'ORDER_PLACED' because the chef hasn't accepted yet, so they might still show as available until they accept? 
    // actually if they are considering it, maybe they are still available? 
    // The requirement says "when a chef is engaged with a order". "Engaged" usually means they have accepted.
    const { data: bookingData } = await supabase
      .from('bookings')
      .select('ChefId')
      .in('ChefId', chefIds)
      .in('Status', ['CHEF_ACCEPTED', 'CHEF_ARRIVED', 'PAYMENT_COMPLETED', 'INGREDIENTS_VERIFIED', 'COOKING_STARTED', 'COOKING_COMPLETED']);

    if (bookingData) {
      bookingData.forEach(b => busyChefs.add(b.ChefId));
    }

    const { data: ratingData } = await supabase
      .from('ratings')
      .select('RateeId, Rating')
      .in('RateeId', chefIds);

    if (ratingData) {
      const groups = {};
      ratingData.forEach(r => {
        if (!groups[r.RateeId]) groups[r.RateeId] = [];
        groups[r.RateeId].push(r.Rating);
      });
      for (const id in groups) {
        const sum = groups[id].reduce((a, b) => a + b, 0);
        ratingMap[id] = (sum / groups[id].length).toFixed(1);
      }
    }
  }

  // Filter out busy chefs from the main data array
  const availableChefs = (data || []).filter(c => !busyChefs.has(c.ChefId));

  const maxDistKm = maxDistance ? maxDistance / 1000 : null;

  return availableChefs
    .map((row) => {
      const distanceKm = haversine(lat, lng, +row.LocLat, +row.LocLng);
      // Retrieve profile from nested users object.
      // chefProfiles is 1:1 with users, but Supabase might return it as an array or object.
      const rawProfile = row.users?.chefProfiles;
      const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile || {};

      // Map cuisine IDs to Names
      const cuisineIds = profile.Cuisine || [];
      const cuisineNames = cuisineIds.map(id => cuisineMap[id] || `Unknown (${id})`);

      // Extract Dish Images
      const rawDishes = row.users?.dishMapChef || [];

      // Matched Dish Logic
      let matchedDish = null;
      if (searchType === 'Dish' && matchingDishIds) {
        const found = rawDishes.find(d => d && d.DishId && matchingDishIds.has(d.DishId));
        if (found) {
          matchedDish = {
            id: found.DishId, // CRITICAL for frontend matching
            name: searchQuery, // Using search query as label for now, or could fetch real name
            image: found.ImageUrl,
            price: found.BasePricePerPerson
          };
        }
      }

      // Prefer Special dishes images first, then others
      const dishImages = rawDishes
        .filter(d => d.ImageUrl)
        .sort((a, b) => (b.IsSpecial === true ? 1 : 0) - (a.IsSpecial === true ? 1 : 0))
        .map(d => d.ImageUrl);

      return {
        id: row.ChefId,
        name: row.users?.Name || "",
        phone: row.users?.Phone || "",
        location: { lat: +row.LocLat, lng: +row.LocLng },
        distanceKm: +distanceKm.toFixed(2),
        cuisine: cuisineNames, // Returning names instead of IDs
        rating: ratingMap[row.ChefId] || profile.Rating || 0,
        about: profile.About || "",
        image: profile.ProfileUrl?.image || (dishImages.length > 0 ? dishImages[0] : "https://images.unsplash.com/photo-1577219491136-5dd90d9779df?q=80&w=300&auto=format&fit=crop"),
        specialDishes: dishImages.length > 0 ? dishImages : (profile.ProfileUrl?.specialDishes || []),
        matchedDish, // Include the matched dish details
        // Helper for filtering
        hasDish: searchType === 'Dish' && matchingDishIds
          ? rawDishes.some(d => matchingDishIds.has(d.DishId))
          : true
      };
    })
    .filter((r) => {
      // Distance filter
      if (maxDistKm && r.distanceKm > maxDistKm) return false;

      // Dish Search Filter
      if (searchType === 'Dish' && searchQuery) {
        return r.hasDish;
      }

      return true;
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

export async function getSearchHints(searchTerm) {
  const { data, error } = await supabase
    .rpc('get_search_hints', { search_term: searchTerm });

  if (error) throw error;
  return data;
}
