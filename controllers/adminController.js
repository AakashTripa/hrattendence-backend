import db from "../db/db.js";

export const getAdminProfile = (req, res) => {
    try {
        const admin_id = req.user.admin_id || req.user.adminId; // Ensure compatibility

        if (!admin_id) {
            return res.status(400).json({ error: "Admin ID is missing" });
        }

        db.query(
            "SELECT * FROM admins WHERE admin_id = ?", 
            [admin_id], 
            (err, results) => {
                if (err) {
                    console.error("Database Query Error:", err);
                    return res.status(500).json({ error: "Failed to fetch admin profile" });
                }

                if (results.length === 0) {
                    return res.status(404).json({ error: "Admin not found" });
                }

                res.json(results[0]); // Return a single admin object
            }
        );
    } catch (error) {
        console.error("Error fetching admin profile:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
