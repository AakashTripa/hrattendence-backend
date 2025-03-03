import db from "../db/db.js";
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs";
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

export const updateAdminProfile = async (req, res) => {
    const adminId = req.user.admin_id || req.user.adminId
    const { first_name, last_name, email, phone, company_name, password } = req.body;

    try {
        // Check if email is already in use
        db.query("SELECT admin_id FROM admins WHERE email = ? AND admin_id != ?", [email, adminId], async (err, results) => {
            if (err) {
                console.error("Error checking email:", err);
                return res.status(500).json({ message: "Server error" });
            }
            if (results.length > 0) {
                return res.status(400).json({ message: "Email is already in use" });
            }

            // Update profile
            const updateQuery = `UPDATE admins SET first_name = ?, last_name = ?, email = ?, phone = ?, company_name = ? WHERE admin_id = ?`;
            db.query(updateQuery, [first_name, last_name, email, phone, company_name, adminId], async (err) => {
                if (err) {
                    console.error("Error updating profile:", err);
                    return res.status(500).json({ message: "Server error" });
                }

                // If password is provided, hash it and update
                if (password) {
                    const hashedPassword = await bcrypt.hash(password, 10);
                    db.query("UPDATE admins SET password = ? WHERE admin_id = ?", [hashedPassword, adminId]);
                }

                res.json({ message: "Profile updated successfully" });
            });
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Server error" });
    }
};
