
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

export default {
    createBooking,
    getBookingsByChefId,
    updateBookingStatus
};
