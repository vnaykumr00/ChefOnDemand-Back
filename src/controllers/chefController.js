import {
  registerChefService,
  getChefDishesService,
  getChefProfileService,
  setAvailabilityService,
  deleteAvailabilityService,
  getAvailabilityService,
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
