import { supabase } from "../config/supabase.js";

export const createProposedDishService = async (chefId, dishData, file) => {
  let imageUrl = null;

  // 1. Upload image if provided
  if (file) {
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${chefId}/proposed_${Date.now()}.${fileExt}`;
    const filePath = `proposedDishes/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('dishImages')
      .upload(`chefUploadedImages/${filePath}`, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: { publicUrl } } = supabase.storage
      .from('dishImages')
      .getPublicUrl(`chefUploadedImages/${filePath}`);

    imageUrl = publicUrl;
  }

  // 2. Insert into proposeddishes
  const { data, error } = await supabase
    .from('proposeddishes')
    .insert([{
      chefid: chefId,
      cuisineid: dishData.CuisineId,
      name: dishData.Name,
      description: dishData.Description,
      price: dishData.Price,
      quantityperserving: dishData.QuantityPerServing,
      imageurl: imageUrl,
      status: 'pending',
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw new Error(`Proposed dish creation failed: ${error.message}`);
  return data;
};

export const fetchAllDishes = async () => {
  const { data, error } = await supabase
    .from('dishes')
    .select('*, cuisines(Name)')
    .eq('IsActive', true)
    .order('Name', { ascending: true });

  if (error) throw new Error(error.message);

  return data;
};

export const fetchDishById = async (dishId) => {
  const { data, error } = await supabase
    .from('dishes')
    .select('*, cuisines(Name)')
    .eq('DishId', dishId)
    .single();

  if (error || !data) return null;

  return data;
};

export const createNewDish = async (dishData) => {
  // Ensure ChefId is present - usually from req.user but passed in body for now or controller
  const { data, error } = await supabase
    .from('dishes')
    .insert([dishData])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const updateExistingDish = async (dishId, updates) => {
  const { data, error } = await supabase
    .from('dishes')
    .update(updates)
    .eq('DishId', dishId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const updateChefDishService = async (dishId, chefId, updates, file) => {
  let imageUrl = updates.ImageUrl;

  // 1. Handle image upload if file is provided
  if (file) {
    const fileExt = file.originalname.split('.').pop();
    const filePath = `${chefId}/${dishId}_${Date.now()}.${fileExt}`;

    console.log(`Uploading file to bucket: dishImages, path: chefUploadedImages/${filePath}, type: ${file.mimetype}`);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('dishImages')
      .upload(`chefUploadedImages/${filePath}`, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: { publicUrl } } = supabase.storage
      .from('dishImages')
      .getPublicUrl(`chefUploadedImages/${filePath}`);

    imageUrl = publicUrl;
  }

  // 2. Update dishMapChef (Price and Image)
  const chefUpdates = {
    UpdatedAt: new Date().toISOString()
  };
  if (updates.PricePer100g !== undefined) chefUpdates.BasePricePerPerson = updates.PricePer100g;
  if (imageUrl) chefUpdates.ImageUrl = imageUrl;

  const { error: chefMapError } = await supabase
    .from('dishMapChef')
    .update(chefUpdates)
    .eq('ChefId', chefId)
    .eq('DishId', dishId);

  if (chefMapError) throw new Error(`Chef map update failed: ${chefMapError.message}`);

  // 3. Update global dishes (Description) if provided
  if (updates.Description) {
    const { error: dishError } = await supabase
      .from('dishes')
      .update({ Description: updates.Description, UpdatedAt: new Date().toISOString() })
      .eq('DishId', dishId);

    if (dishError) console.error("Global dish description update failed (non-critical):", dishError.message);
  }

  return { success: true, imageUrl };
};

export const addExistingDishToChefService = async (chefId, dishId, price) => {
  // 1. Fetch dish details to get image
  const { data: dish, error: dishError } = await supabase
    .from('dishes')
    .select('ImageUrls')
    .eq('DishId', dishId)
    .single();

  if (dishError) throw new Error(`Dish fetch failed: ${dishError.message}`);

  let selectedImage = null;
  if (dish.ImageUrls && Array.isArray(dish.ImageUrls) && dish.ImageUrls.length > 0) {
    const randomIndex = Math.floor(Math.random() * dish.ImageUrls.length);
    selectedImage = dish.ImageUrls[randomIndex];
  }

  // 2. Insert into dishMapChef
  const { data, error } = await supabase
    .from('dishMapChef')
    .insert([{
      ChefId: chefId,
      DishId: dishId,
      BasePricePerPerson: parseFloat(price) || 0,
      ImageUrl: selectedImage,
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) throw new Error(`Add existing dish failed: ${error.message}`);
  return data;
};

export const deleteDishById = async (dishId) => {
  // Soft delete
  const { error } = await supabase
    .from('dishes')
    .update({ IsActive: false })
    .eq('DishId', dishId);

  if (error) throw new Error(error.message);
  return true;
};
