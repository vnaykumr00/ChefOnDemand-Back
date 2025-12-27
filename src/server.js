import app from "./app.js";
import { supabase } from "./config/supabase.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Backend running on port ${PORT}`);

  try {
    // We just "peek" at the chefAvailability table to see if we can talk to it
    const { data, error } = await supabase
      .from('chefAvailability') 
      .select('count', { count: 'exact', head: true });

    if (error) throw error;

    console.log("✅ Supabase connected successfully! Database is reachable.");
  } catch (err) {
    console.error("❌ Supabase connection failed:", err.message);
    console.log("Tip: Check your SUPABASE_URL and SUPABASE_ANON_KEY in the .env file.");
  }
});