import {
  registerChefService,
  getChefDishesService,
  getChefProfileService,
  setAvailabilityService,
  deleteAvailabilityService,
  getAvailabilityService,
  getChefPublicProfileService,
} from '../services/chefServices.js';

export const registerChef = async (req, res) => {
  try {
    const { fullName, phoneNumber, address, cuisines, experience, dishes, about, chefType } =
      req.body;

    const { id: userId, email } = req.user;

    if (!fullName || !phoneNumber || !cuisines || !experience) {
      return res.status(400).json({
        message:
          'Missing required fields: fullName, phoneNumber, cuisines, experience',
      });
    }

    const { userData, chefProfileData } = await registerChefService({
      userId,
      email,
      fullName,
      phoneNumber,
      address,
      cuisines,
      experience,
      dishes,
      about,
      chefType,
    });

    return res.status(201).json({
      message: 'Chef registered successfully',
      chef: {
        id: userData.Id,
        email: userData.Email,
        fullName: userData.Name,
        phoneNumber: userData.Phone,
        role: userData.Role,
        address: userData.Address,
        cuisines: chefProfileData.Cuisine,
        experience: chefProfileData.Experience,
        rating: chefProfileData.Rating,
      },
    });
  } catch (err) {
    console.error('Chef registration error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getRegistrationDishes = async (req, res) => {
  try {
    const dishes = await getChefDishesService(req.query.cuisineIds);

    res.json({
      dishes: dishes.map((dish) => ({
        dishId: dish.DishId,
        name: dish.Name,
        description: dish.Description,
        prepTimeMinutes: dish.PrepTimeMinutes,
        cuisine: dish.cuisines ? dish.cuisines.Name : 'Unknown',
        cuisineId: dish.CuisineId,
        isVegetarian: dish.IsVegetarian,
        ingredients: dish.Ingredients,
      })),
    });
  } catch (err) {
    console.error('Fetch dishes error:', err);
    res.status(500).json({ message: 'Failed to fetch dishes' });
  }
};

export const getChefProfile = async (req, res) => {
  try {
    const result = await getChefProfileService(req.params.chefId);

    if (!result) return res.status(404).json({ message: 'Chef not found' });

    const { userData, chefProfile, dishes } = result;

    res.json({
      chef: {
        id: userData.Id,
        email: userData.Email,
        fullName: userData.Name,
        phoneNumber: userData.Phone,
        address: userData.Address,
        cuisines: chefProfile.Cuisine,
        experience: chefProfile.Experience,
        rating: chefProfile.Rating,
        totalBookings: chefProfile.TotalBookings,
        responseRate: chefProfile.ResponseRate,
        dishes: dishes || [],
      },
    });
  } catch (err) {
    console.error('Fetch chef profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const setAvailability = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const { id: userId } = req.user;

    if (lat === undefined || lng === undefined) {
      return res
        .status(400)
        .json({ message: 'Latitude and longitude are required' });
    }

    const data = await setAvailabilityService(userId, lat, lng);

    res.json({
      message: 'Availability updated successfully',
      availability: data,
    });
  } catch (err) {
    console.error('Availability update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteAvailability = async (req, res) => {
  try {
    const { id: userId } = req.user;

    await deleteAvailabilityService(userId);

    res.json({ message: 'Availability disabled successfully' });
  } catch (err) {
    console.error('Availability delete error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAvailability = async (req, res) => {
  try {
    const { id: userId } = req.user;

    const data = await getAvailabilityService(userId);

    res.json({ isOnline: !!data, availability: data });
  } catch (err) {
    console.error('Fetch availability error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getChefPublicProfile = async (req, res) => {
  try {
    const { chefId } = req.params;
    if (!chefId) return res.status(400).json({ message: "Chef ID is required" });

    const result = await getChefPublicProfileService(chefId);
    if (!result) return res.status(404).json({ message: "Chef not found" });

    const { userData, chefProfile, availability, cuisineMap, menuData } = result;

    // Normalize Profile (Supabase might return single object or array depending on relation setup)
    const profile = Array.isArray(chefProfile) ? chefProfile[0] : chefProfile || {};
    const avail = Array.isArray(availability) ? availability[0] : availability || {};

    // Map Cuisines
    const cuisineIds = profile.Cuisine || [];
    const cuisineNames = cuisineIds.map(id => cuisineMap[id] || `Unknown (${id})`);

    // Prepare Response
    const response = {
      id: userData.Id,
      name: userData.Name,
      cuisine: cuisineNames,
      rating: profile.Rating || 0,
      distance: "Calculating...", // You might want frontend to calculate or pass lat/long in query to calc here. Fore now placeholder.
      location: { lat: avail.LocLat, lng: avail.LocLng }, // Frontend can calc distance
      image: profile.ProfileUrl?.image || "https://images.unsplash.com/photo-1577219491136-5dd90d9779df?q=80&w=300&auto=format&fit=crop",
      about: profile.About || "",
      specialDishes: profile.ProfileUrl?.specialDishes || [],
      dishes: menuData.map(m => ({
        id: m.DishId, // using DishId for consistency, or generate unique if needed
        name: m.dishes?.Name,
        pricePer100g: m.BasePricePerPerson, // Mapping DB BasePrice to frontend 'pricePer100g' terminology
        ingredients: m.dishes?.Ingredients || [], // Assuming JSON structure matches {name, quantity, unit}
        isSpecial: m.IsSpecial,
        description: m.dishes?.Description
      }))
    };

    res.json(response);
  } catch (err) {
    console.error('Get public profile error:', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
