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

  if (error) {
    console.error("Supabase Query Error:", error);
    throw error;
  }
  console.log("Raw Nearby Chefs Data:", JSON.stringify(data, null, 2));

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

  const maxDistKm = maxDistance ? maxDistance / 1000 : null;

  return (data || [])
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
        const found = rawDishes.find(d => matchingDishIds.has(d.DishId));
        if (found) {
          let img = found.ImageUrl;
          // Transform Google Drive URLs
          if (img && img.includes('drive.google.com') && img.includes('id=')) {
            const idMatch = img.match(/id=([^&]+)/);
            if (idMatch && idMatch[1]) {
              img = `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
            }
          }

          matchedDish = {
            id: found.DishId, // CRITICAL for frontend matching
            name: searchQuery, // Using search query as label for now, or could fetch real name
            image: img,
            price: found.BasePricePerPerson
          };
        }
      }

      // Prefer Special dishes images first, then others
      const dishImages = rawDishes
        .filter(d => d.ImageUrl)
        .sort((a, b) => (b.IsSpecial === true ? 1 : 0) - (a.IsSpecial === true ? 1 : 0))
        .map(d => {
          // Transform Google Drive URLs to reliable CDN view links
          if (d.ImageUrl.includes('drive.google.com') && d.ImageUrl.includes('id=')) {
            const idMatch = d.ImageUrl.match(/id=([^&]+)/);
            if (idMatch && idMatch[1]) {
              return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
            }
          }
          return d.ImageUrl;
        });

      return {
        id: row.ChefId,
        name: row.users?.Name || "",
        phone: row.users?.Phone || "",
        location: { lat: +row.LocLat, lng: +row.LocLng },
        distanceKm: +distanceKm.toFixed(2),
        cuisine: cuisineNames, // Returning names instead of IDs
        rating: profile.Rating || 0,
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
