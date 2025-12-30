import {
  findUserById,
  registerUser,
  getNearbyChefs,
} from "../services/userService.js";

export async function login(req, res) {
  try {
    const { id } = req.user;
    const { data, error } = await findUserById(id);

    if (error && error.code !== "PGRST116")
      return res.status(500).json({ message: "Database error" });

    if (!data)
      return res
        .status(404)
        .json({ message: "User not registered", code: "NEEDS_REGISTRATION" });

    res.json({ message: "Login successful", user: data });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
}

export async function register(req, res) {
  try {
    const { fullName, role, phoneNumber, address } = req.body;
    const { id, email } = req.user;

    if (!role) return res.status(400).json({ message: "Role is required" });

    const payload = {
      Id: id,
      Email: email,
      Role: role,
      Name: fullName,
      Phone: phoneNumber,
      PhoneVerified: true,
      Address: { ...address, fullName, phoneNumber },
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
    };

    const { data, error } = await registerUser(payload);

    if (error)
      return res.status(500).json({ message: "Database error", error: error.message });

    res.status(201).json({ message: "User registered successfully", user: data });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
}

export async function me(req, res) {
  try {
    const { data, error } = await findUserById(req.user.id);

    if (error && error.code === "PGRST116")
      return res.status(404).json({ message: "User not found" });

    res.json({ user: data });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
}

export async function status(req, res) {
  try {
    const { data } = await findUserById(req.user.id);
    res.json({ isRegistered: !!data, user: data || null });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
}

export async function nearbyChefs(req, res) {
  try {
    const chefs = await getNearbyChefs({
      lat: 16.68424150,
      lng: 74.25901480,
      limit: 20,
      maxDistance: 5000000000,
    });

    res.json({ nearbyChefs: chefs, totalFound: chefs.length });
  } catch (e) {
    console.error("Error in nearbyChefs:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
}
