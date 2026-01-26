import {
  fetchAllDishes,
  fetchDishById,
  createNewDish,
  updateExistingDish,
  deleteDishById,
  updateChefDishService,
  createProposedDishService,
  addExistingDishToChefService
} from '../services/dishServices.js';
import { findUserById } from '../services/userService.js';

export const getAllDishes = async (req, res) => {
  try {
    const dishes = await fetchAllDishes();

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
        images: dish.ImageUrls,
      })),
    });
  } catch (err) {
    console.error('Fetch dishes error:', err);
    res.status(500).json({ message: 'Failed to fetch dishes' });
  }
};

export const getDishById = async (req, res) => {
  try {
    const { dishId } = req.params;
    const dish = await fetchDishById(dishId);

    if (!dish) {
      return res.status(404).json({ message: 'Dish not found' });
    }

    res.json({
      dish: {
        dishId: dish.DishId,
        name: dish.Name,
        description: dish.Description,
        pricePer100g: dish.PricePer100g, // Added
        prepTimeMinutes: dish.PrepTimeMinutes,
        cuisine: dish.cuisines ? dish.cuisines.Name : 'Unknown',
        cuisineId: dish.CuisineId,
        isVegetarian: dish.IsVegetarian,
        ingredients: dish.Ingredients,
        imageUrl: dish.ImageUrl // Added
      },
    });
  } catch (err) {
    console.error('Fetch dish error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createDish = async (req, res) => {
  try {
    const dishData = req.body;
    const { id: userId } = req.user;

    // 1. Get user role
    const { data: user, error: userError } = await findUserById(userId);
    if (userError || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. If chef, handle dish proposal or existing selection
    if (user.role === 'chef') {
      if (dishData.DishId) {
        const result = await addExistingDishToChefService(userId, dishData.DishId, dishData.Price);
        return res.status(201).json({
          message: 'Dish added to your menu',
          dish: result
        });
      }
      const result = await createProposedDishService(userId, dishData, req.file);
      return res.status(201).json({
        message: 'Dish proposal submitted for approval',
        proposedDish: result
      });
    }

    // 3. Admin or default creation
    const newDish = await createNewDish(dishData);
    res.status(201).json(newDish);
  } catch (err) {
    console.error('Create dish error:', err);
    res.status(500).json({ message: err.message || 'Failed to create dish' });
  }
};

export const updateDish = async (req, res) => {
  try {
    const { dishId } = req.params;
    const updates = req.body;
    const { id: userId } = req.user;

    // 1. Get user role from DB
    const { data: user, error: userError } = await findUserById(userId);
    if (userError || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. Handle update based on role
    if (user.role === 'chef') {

      const result = await updateChefDishService(dishId, userId, updates, req.file);
      return res.json({ message: 'Dish updated successfully', imageUrl: result.imageUrl });
    }

    // 3. Admin or default update for global dishes
    const updatedDish = await updateExistingDish(dishId, updates);
    res.json(updatedDish);
  } catch (err) {
    console.error('Update dish error:', err);
    res.status(500).json({ message: err.message || 'Failed to update dish' });
  }
};

export const deleteDish = async (req, res) => {
  try {
    const { dishId } = req.params;
    const { id: userId } = req.user;

    // 1. Get user role
    const { data: user, error: userError } = await findUserById(userId);
    if (userError || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. Handle deletion based on role
    if (user.role === 'chef') {
      // For chefs, delete from dishMapChef table
      const { supabase } = await import('../config/supabase.js');
      const { error } = await supabase
        .from('dishMapChef')
        .delete()
        .eq('ChefId', userId)
        .eq('DishId', dishId);

      if (error) throw new Error(error.message);
      return res.status(204).send();
    }

    // 3. Admin or default deletion (soft delete from global dishes)
    await deleteDishById(dishId);
    res.status(204).send();
  } catch (err) {
    console.error('Delete dish error:', err);
    res.status(500).json({ message: 'Failed to delete dish' });
  }
};
