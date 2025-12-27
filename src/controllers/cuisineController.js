import { fetchAllCuisines } from '../services/cuisineServices.js';

export const getAllCuisines = async (req, res) => {
  try {
    const cuisines = await fetchAllCuisines();

    return res.json({
      cuisines: cuisines.map((c) => ({
        cuisineId: c.CuisineId,
        name: c.Name,
      })),
    });
  } catch (err) {
    console.error('Fetch cuisines error:', err);
    res.status(500).json({ message: 'Failed to fetch cuisines' });
  }
};
