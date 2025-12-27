import {supabase} from "./../config/supabase.js";

const normalizeUser = (user) => {
  if (!user) return null;
  return {
    ...user,
    id: user.Id,
    email: user.Email,
    role: user.Role ? user.Role.toLowerCase() : user.Role,
    address: user.Address,
    createdAt: user.CreatedAt,
    updatedAt: user.UpdatedAt,
  };
};

export async function findUserById(userId) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("Id", userId)
    .single();

  return { data: normalizeUser(data), error };
}

export async function registerUser(payload) {
  const { data, error } = await supabase
    .from("users")
    .upsert(payload)
    .select()
    .single();

  return { data: normalizeUser(data), error };
}

export async function getNearbyChefs({ lat, lng, limit, maxDistance }) {
  const { data, error } = await supabase
    .from("chefAvailability")
    .select(`
      ChefId,
      LocLat,
      LocLng,
      users:ChefId (
        Id,
        Name,
        Phone
      )
    `);

  if (error) throw error;

  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  const maxDistKm = maxDistance ? maxDistance / 1000 : null;

  return (data || [])
    .map((row) => {
      const distanceKm = haversine(lat, lng, +row.LocLat, +row.LocLng);
      return {
        id: row.ChefId,
        Name: row.users?.Name || "",
        phone: row.users?.Phone || "",
        location: { lat: +row.LocLat, lng: +row.LocLng },
        distanceKm: +distanceKm.toFixed(2),
      };
    })
    .filter((r) => !maxDistKm || r.distanceKm <= maxDistKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}
