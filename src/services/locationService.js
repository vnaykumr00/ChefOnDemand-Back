import { supabase } from '../config/supabase.js';

/**
 * Calculates Harversine distance between two sets of coordinates in KM
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

/**
 * Fetches transportation charges based on distance
 * @param {number} distance in KM
 */
export const getTransportationCharges = async (distance) => {
    try {
        // TODO: Replace 'transportation_rates' with the actual table name once provided by the user
        // Assuming table structure: { min_dist, max_dist, rate_per_km, base_charge }

        /* 
        const { data, error } = await supabase
            .from('transportation_rates')
            .select('*')
            .lte('min_dist', distance)
            .gte('max_dist', distance)
            .single();
        
        if (error) throw error;
        return (distance * data.rate_per_km) + data.base_charge;
        */

        // Temporary Mock Logic: ₹10 per km, minimum ₹50
        const ratePerKm = 10;
        const baseCharge = 50;
        const totalCharge = Math.max(baseCharge, distance * ratePerKm);

        return parseFloat(totalCharge.toFixed(2));
    } catch (error) {
        console.error('Charge Calculation Error:', error);
        return 0;
    }
};
