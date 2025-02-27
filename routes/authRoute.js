import express from "express";
import { signup, login} from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);

router.get("/me", verifyToken, (req, res) => {
    const sql = "SELECT id, full_name, email FROM admins WHERE id = ?";
    db.query(sql, [req.user.id], (err, results) => {
        if (err || results.length === 0) {
            return res.status(500).json({ message: "User not found" });
        }
        res.json({ user: results[0] });
    });
});





export default router;
