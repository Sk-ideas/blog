require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");


// Import database connection
const sequelize = require("./config/db");

const app = express();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));

// Test database connection on startup
sequelize
  .authenticate()
  .then(() => {
    console.log("Database connection established successfully.");

    // Sync all models (create tables if they don't exist)
    // In production, you should use migrations instead
    return sequelize.sync({ alter: true }); // alter: true safely updates tables
  })
  .then(() => {
    console.log("All models were synchronized successfully.");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/posts", require("./routes/postRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/tags", require("./routes/tagRoutes"));
app.use("/api/comments", require("./routes/commentRoutes"));
app.use("/api/media", require("./routes/mediaRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
// Add other routes here...

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something broke!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
