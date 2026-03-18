// Load .env FIRST, before any other module that reads env vars.
// We must use dynamic imports because ESM hoists all static imports
// above any code — meaning dotenv.config() would run AFTER firebase.js.
import dotenv from "dotenv";
dotenv.config();

const { default: app } = await import("./app.js");
const { connectDB } = await import("./db/db.js");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();