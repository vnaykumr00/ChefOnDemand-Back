import {
  fetchAllDishes,
  fetchDishById,
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
        prepTimeMinutes: dish.PrepTimeMinutes,
        cuisine: dish.cuisines ? dish.cuisines.Name : 'Unknown',
        cuisineId: dish.CuisineId,
        isVegetarian: dish.IsVegetarian,
        ingredients: dish.Ingredients,
      },
    });
  } catch (err) {
    console.error('Fetch dish error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
