import express from "express";
import cors from "cors";
import { supabase } from "./config/supabase.js";
import { verifySupabaseToken } from "./middleware/auth.middleware.js";
import users from "./routes/userRoutes.js";
import dishRoutes from "./routes/dishRoutes.js";
import cuisinesRoutes from './routes/cuisineRoute.js';
import chefsRoutes from './routes/chefRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//-- Routes ---
// Removed /api/ prefix from all routes ensuring direct access
app.use('/user', users);
app.use('/chef', chefsRoutes);
app.use('/dishes', dishRoutes);
app.use('/cuisines', cuisinesRoutes);

// Public Routes
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Chef On Demand API" }); // Standardized response
});

app.get("/health", (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Protected Query Example
app.get('/admin/debug', verifySupabaseToken, (req, res) => {
  res.json({
    message: 'You have accessed a protected route',
    user: req.user
  });
});


// --- Connection Test Route ---
// Kept for backward compatibility/extra testing if needed, though /health is standard
app.get("/test-db", async (req, res) => {
  try {
    const { data, error } = await supabase.from('chefAvailability').select('ChefId').limit(1);

    if (error && error.code !== 'PGRST116') {
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

// Basic error handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

export default app;