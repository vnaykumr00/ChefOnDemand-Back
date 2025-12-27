import express from "express";
import cors from "cors";
import { supabase } from "./config/supabase.js"; // Import the config we created
import users from "./routes/userRoutes.js";
import dishRoutes from "./routes/dishRoutes.js";
import cuisinesRoutes from './routes/cuisineRoute.js';
import chefsRoutes from './routes/chefRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

//-- Routes ---
app.use('/cuisine', cuisinesRoutes);
app.use('/api/user',users);
app.use('/dishes', dishRoutes);
app.use('/api/chef', chefsRoutes);

app.get("/", (req, res) => {
  res.send("Server is running!");
});
// --- Connection Test Route ---
app.get("/test-db", async (req, res) => {
  try {
    // This is the safest way to test connection: 
    // It just pings the database to see if it responds.
    const { data, error } = await supabase.from('chefAvailability').select('ChefId').limit(1);

    if (error && error.code !== 'PGRST116') { // PGRST116 just means "no rows found", which is fine!
        throw error;
    }

    res.status(200).json({
      status: "Success",
      message: "Server is connected to Supabase!",
    });
  } catch (err) {
    res.status(500).json({
      status: "Error",
      message: "Connection failed",
      error: err.message
    });
  }
});

export default app;