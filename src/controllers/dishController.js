import {
  fetchAllDishes,
  fetchDishById,
  createNewDish,
  updateExistingDish,
  deleteDishById
} from '../services/dishServices.js';

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
    const newDish = await createNewDish(dishData);
    res.status(201).json(newDish);
  } catch (err) {
    console.error('Create dish error:', err);
    res.status(500).json({ message: 'Failed to create dish' });
  }
};

export const updateDish = async (req, res) => {
  try {
    const { dishId } = req.params;
    const updates = req.body;
    const updatedDish = await updateExistingDish(dishId, updates);
    res.json(updatedDish);
  } catch (err) {
    console.error('Update dish error:', err);
    res.status(500).json({ message: 'Failed to update dish' });
  }
};

export const deleteDish = async (req, res) => {
  try {
    const { dishId } = req.params;
    await deleteDishById(dishId);
    res.status(204).send();
  } catch (err) {
    console.error('Delete dish error:', err);
    res.status(500).json({ message: 'Failed to delete dish' });
  }
};
