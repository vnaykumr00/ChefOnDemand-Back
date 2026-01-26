
import { supabase } from '../config/supabase.js';

const createBooking = async (bookingData) => {
    const { data, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

const getBookingsByChefId = async (chefId) => {
    const { data, error } = await supabase
        .from('bookings')
        .select(`
            *,
            users:CustomerId (Name, Email, Phone)
        `)
        .eq('ChefId', chefId)
        .order('ServiceDate', { ascending: true });

    if (error) {
        throw new Error(error.message);
    }

    // Enrich DishIds with dish names and images
    if (data && data.length > 0) {
        // Collect all unique dish IDs from all bookings
        const allDishIds = new Set();
        data.forEach(booking => {
            if (booking.DishIds && Array.isArray(booking.DishIds)) {
                booking.DishIds.forEach(dish => {
                    if (dish.id) allDishIds.add(dish.id);
                });
            }
        });

        // Fetch all dish details in one query
        if (allDishIds.size > 0) {
            const { data: dishes } = await supabase
                .from('dishes')
                .select('DishId, Name, ImageUrls, Ingredients')
                .in('DishId', Array.from(allDishIds));

            // Create a map of dish id to details
            const dishMap = {};
            if (dishes) {
                dishes.forEach(dish => {
                    // Extract first image from ImageUrls array
                    let imageUrl = (Array.isArray(dish.ImageUrls) && dish.ImageUrls.length > 0)
                        ? dish.ImageUrls[0]
                        : null;

                    dishMap[dish.DishId.toString()] = { name: dish.Name, image: imageUrl, ingredients: dish.Ingredients };
                });
            }

            // Enrich each booking's DishIds with names and images
            data.forEach(booking => {
                if (booking.DishIds && Array.isArray(booking.DishIds)) {
                    booking.DishIds = booking.DishIds.map(dish => ({
                        ...dish,
                        name: dishMap[dish.id.toString()]?.name || 'Unknown Dish',
                        image: dishMap[dish.id.toString()]?.image || null,
                        ingredients: dishMap[dish.id.toString()]?.ingredients || []
                    }));
                }
            });
        }
    }

    return data;
};

const updateBookingStatus = async (bookingId, status, otp = null) => {
    // 1. Fetch current booking to get current status and history
    const { data: currentBooking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('Id', bookingId)
        .single();

    if (fetchError) throw new Error(fetchError.message);

    const updates = { Status: status };
    let history = currentBooking.StatusHistory || [];

    // Append new status event
    history.push({
        status,
        timestamp: new Date().toISOString()
    });
    updates.StatusHistory = history;

    // 2. Logic for specific transitions

    // Generate OTP when Payment is Completed (To be shared with Chef upon arrival)
    if (status === 'PAYMENT_COMPLETED') {
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        updates.VerificationCode = code;
    }

    // Verify OTP when Ingredients are Verified
    if (status === 'INGREDIENTS_VERIFIED') {
        if (!otp) throw new Error('OTP is required for verification');
        if (String(currentBooking.VerificationCode).trim() !== String(otp).trim()) {
            throw new Error('Invalid OTP');
        }
    }

    // Verify OTP when Reconfirming Order (Legacy support)
    if (status === 'ORDER_RECONFIRMED') {
        if (!otp) throw new Error('OTP is required for reconfirmation');
        if (String(currentBooking.VerificationCode).trim() !== String(otp).trim()) {
            throw new Error('Invalid OTP');
        }
    }

    const { data, error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('Id', bookingId)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }
    return data;
};

const getBookingsByCustomerId = async (customerId) => {
    const { data, error } = await supabase
        .from('bookings')
        .select(`
            *,
            chef:ChefId (Name, Email, chefProfiles(ProfileUrl))
        `)
        .eq('CustomerId', customerId)
        .order('ServiceDate', { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    // Enrich DishIds with dish names
    if (data && data.length > 0) {
        // Collect all unique dish IDs from all bookings
        const allDishIds = new Set();
        data.forEach(booking => {
            if (booking.DishIds && Array.isArray(booking.DishIds)) {
                booking.DishIds.forEach(dish => {
                    if (dish.id) allDishIds.add(dish.id);
                });
            }
        });

        // Fetch all dish details in one query
        if (allDishIds.size > 0) {
            const { data: dishes } = await supabase
                .from('dishes')
                .select('DishId, Name, ImageUrls, Ingredients')
                .in('DishId', Array.from(allDishIds));

            // Create a map of dish id to details
            const dishMap = {};
            if (dishes) {
                dishes.forEach(dish => {
                    // Extract first image from ImageUrls array
                    let imageUrl = (Array.isArray(dish.ImageUrls) && dish.ImageUrls.length > 0)
                        ? dish.ImageUrls[0]
                        : null;

                    dishMap[dish.DishId.toString()] = { name: dish.Name, image: imageUrl, ingredients: dish.Ingredients };
                });
            }

            // Enrich each booking's DishIds with names and images
            data.forEach(booking => {
                if (booking.DishIds && Array.isArray(booking.DishIds)) {
                    booking.DishIds = booking.DishIds.map(dish => ({
                        ...dish,
                        name: dishMap[dish.id.toString()]?.name || 'Unknown Dish',
                        image: dishMap[dish.id.toString()]?.image || null,
                        ingredients: dishMap[dish.id.toString()]?.ingredients || []
                    }));
                }
            });
        }
    }

    return data;
};

const getBookingById = async (bookingId) => {
    const { data, error } = await supabase
        .from('bookings')
        .select(`
            *,
            chef:ChefId (Name, Email, Phone, chefProfiles(ProfileUrl)),
            customer:CustomerId (Name, Email, Phone)
        `)
        .eq('Id', bookingId)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    // Enrich DishIds with dish names and images
    if (data && data.DishIds && Array.isArray(data.DishIds)) {
        const dishIds = data.DishIds.map(dish => dish.id);
        if (dishIds.length > 0) {
            const { data: dishes } = await supabase
                .from('dishes')
                .select('DishId, Name, ImageUrls, Ingredients')
                .in('DishId', dishIds);

            if (dishes) {
                const dishMap = {};
                dishes.forEach(dish => {
                    let imageUrl = (Array.isArray(dish.ImageUrls) && dish.ImageUrls.length > 0)
                        ? dish.ImageUrls[0]
                        : null;

                    dishMap[dish.DishId.toString()] = { name: dish.Name, image: imageUrl, ingredients: dish.Ingredients };
                });

                data.DishIds = data.DishIds.map(dish => ({
                    ...dish,
                    name: dishMap[dish.id.toString()]?.name || 'Unknown Dish',
                    image: dishMap[dish.id.toString()]?.image || null,
                    ingredients: dishMap[dish.id.toString()]?.ingredients || []
                }));
            }
        }
    }

    return data;
};

const createReportedIssue = async (issueData) => {
    const { data, error } = await supabase
        .from('reported_issues')
        .insert([issueData])
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }
    return data;
};

export default {
    createBooking,
    getBookingsByChefId,
    getBookingsByCustomerId,
    getBookingById,
    updateBookingStatus,
    createReportedIssue
};
