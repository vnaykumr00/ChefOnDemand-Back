
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
            users:CustomerId (Name, Email)
        `)
        .eq('ChefId', chefId)
        .order('ServiceDate', { ascending: true });

    if (error) {
        throw new Error(error.message);
    }
    return data;
};

const updateBookingStatus = async (bookingId, status) => {
    const { data, error } = await supabase
        .from('bookings')
        .update({ Status: status })
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
                .select('DishId, Name')
                .in('DishId', Array.from(allDishIds));

            // Create a map of dish id to name
            const dishMap = {};
            if (dishes) {
                dishes.forEach(dish => {
                    dishMap[dish.DishId] = dish.Name;
                });
            }

            // Enrich each booking's DishIds with names
            data.forEach(booking => {
                if (booking.DishIds && Array.isArray(booking.DishIds)) {
                    booking.DishIds = booking.DishIds.map(dish => ({
                        ...dish,
                        name: dishMap[dish.id] || 'Unknown Dish'
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
            chef:ChefId (Name, Email, chefProfiles(ProfileUrl)),
            customer:CustomerId (Name, Email)
        `)
        .eq('Id', bookingId)
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
    updateBookingStatus
};
