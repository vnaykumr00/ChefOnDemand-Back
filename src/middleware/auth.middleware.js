import { supabase } from "../config/supabase.js"; // Import the new Supabase config

export const verifySupabaseToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Expect: "Bearer <token>"

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    /**
     * In Supabase, we use auth.getUser(token) to verify the JWT.
     * This method is safer than just decoding because it validates 
     * the token against the Supabase Auth server.
     */
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(403).json({ message: "Unauthorized or invalid token" });
    }

    // data.user contains id (uid), email, metadata, etc.
    req.user = data.user; 
    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};