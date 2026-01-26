import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { supabase } from "./config/supabase.js";

// Debug logs for environment variables (safe check)


import http from "http";
import { Server } from "socket.io";

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust as needed for production
    methods: ["GET", "POST"]
  }
});

// Socket.io Logic
io.on("connection", (socket) => {


  socket.on("join-booking", (bookingId) => {
    socket.join(`booking_${bookingId}`);

  });

  socket.on("update-location", async (data) => {
    // data: { bookingId, lat, lng, chefId }
    const { bookingId, lat, lng, chefId } = data;


    // Broadcast to everyone in the room
    io.to(`booking_${bookingId}`).emit("location-updated", { lat, lng });

    // Persist to database so customers see it on initial load
    if (chefId) {
      try {
        await supabase
          .from('chefAvailability')
          .update({
            LocLat: lat,
            LocLng: lng,
            LastUpdated: new Date().toISOString()
          })
          .eq('ChefId', chefId);
      } catch (err) {
        console.error("Failed to persist location:", err.message);
      }
    }
  });

  socket.on("disconnect", () => {

  });
});

server.listen(PORT, async () => {
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