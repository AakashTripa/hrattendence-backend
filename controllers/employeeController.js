import db from "../db/db.js";

// Register Employee (by Admin)


// Register Employee (by Admin)
export const registerEmployee = (req, res) => {
    const { name, last_name, email, phone, designation, join_date, admin_id, company_name } = req.body;

    if (!admin_id || isNaN(admin_id) || !company_name) {
        return res.status(400).json({ message: "Invalid Admin ID or Company Name" });
    }

    // Generate company prefix based on company name
    const words = company_name.trim().split(" ");
    const companyPrefix = words.map(word => word[0].toUpperCase()).join(""); // e.g., "Radical Global" → "RG"

    // Query to get the last office_id for this admin
    const officeIdQuery = `SELECT MAX(CAST(SUBSTRING_INDEX(office_id, '-', -1) AS UNSIGNED)) AS last_office_id 
                           FROM employees WHERE admin_id = ?`;

    db.query(officeIdQuery, [admin_id], (err, officeResult) => {
        if (err) {
            return res.status(500).json({ message: "Error fetching last office ID", error: err });
        }

        const lastOfficeId = officeResult[0].last_office_id || 0; // Default to 0 if no employees exist
        const newOfficeId = `${companyPrefix}-${lastOfficeId + 1}`;

        // Query to get the last emp_id globally
        const empIdQuery = `SELECT MAX(CAST(SUBSTRING_INDEX(emp_id, '-', -1) AS UNSIGNED)) AS last_emp_id FROM employees`;

        db.query(empIdQuery, [], (err, empResult) => {
            if (err) {
                return res.status(500).json({ message: "Error fetching last emp ID", error: err });
            }

            const lastEmpId = empResult[0].last_emp_id || 0; // Default to 0 if no employees exist
            const newEmpId = `EMP-${lastEmpId + 1}`; // Increment globally

            // Insert new employee with emp_id and office_id
            const insertQuery = `INSERT INTO employees (emp_id, office_id, name, last_name, email, admin_id, phone, designation, join_date, status) 
                                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`;

            db.query(insertQuery, [newEmpId, newOfficeId, name, last_name, email, admin_id, phone, designation, join_date], (err, result) => {
                if (err) {
                    return res.status(500).json({ message: "Error registering employee", error: err });
                }
                res.status(201).json({ message: "Employee registered successfully!", emp_id: newEmpId, office_id: newOfficeId });
            });
        });
    });
};


export const employeeCount = (req, res) => {
    try {
        const adminId = req.user.adminId; // Ensure adminId is correctly set from authMiddleware

        db.query(
            "SELECT COUNT(*) AS count FROM employees WHERE admin_id = ? AND status = 'active'", // Filters only active employees
            [adminId],
            (error, results) => {
                if (error) {
                    console.error("Error fetching active employee count:", error);
                    return res.status(500).json({ message: "Internal server error" });
                }
                res.json({ count: results[0].count }); // Returns only the active employees count
            }
        );
    } catch (error) {
        console.error("Error fetching active employee count:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};







  export const getEmployeesByAdmin = (req, res) => {
    try {
        const admin_id = req.user.admin_id || req.user.adminId; // Ensure compatibility

        if (!admin_id) {
            return res.status(400).json({ error: "Admin ID is missing" });
        }

        db.query(
            "SELECT * FROM employees WHERE admin_id = ? AND status = 'active'", 
            [admin_id], 
            (err, results) => {
                if (err) {
                    console.error("Database Query Error:", err);
                    return res.status(500).json({ error: "Failed to fetch employees" });
                }

                res.json(results);
            }
        );
    } catch (error) {
        console.error("Error in getEmployeesByAdmin:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


// Get Deactivated Employees by Admin ID
// Get Deactivated Employees
export const getDeactivatedEmployees = (req, res) => {
    try {
        const admin_id = req.user.admin_id || req.user.adminId; // Ensure compatibility

        if (!admin_id) {
            return res.status(400).json({ error: "Admin ID is missing" });
        }

        const sql = "SELECT * FROM employees WHERE admin_id = ? AND status = 'deactivated'";

        db.query(sql, [admin_id], (err, results) => {
            if (err) {
                console.error("Database Query Error:", err);
                return res.status(500).json({ error: "Failed to fetch deactivated employees" });
            }

           
            res.json(results);
        });
    } catch (error) {
        console.error("Error in getDeactivatedEmployees:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Soft Delete (Deactivate Employee)
export const deactivateEmployee = (req, res) => {
    try {
        const { emp_id } = req.params;
        const admin_id = req.user.admin_id || req.user.adminId; // Ensure compatibility

        if (!admin_id) {
            return res.status(400).json({ error: "Admin ID is missing" });
        }

        const sql = "UPDATE employees SET status = 'deactivated' WHERE emp_id = ? AND admin_id = ?";

        db.query(sql, [emp_id, admin_id], (err, result) => {
            if (err) {
                console.error("Database Update Error:", err);
                return res.status(500).json({ error: "Failed to deactivate employee" });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Employee not found or already deactivated" });
            }

            res.json({ message: "Employee deactivated successfully" });
        });
    } catch (error) {
        console.error("Error in deactivateEmployee:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const activateEmployee = (req, res) => {
    const { emp_id } = req.params;
    const admin_id = req.user.admin_id || req.user.adminId; 

    if (!admin_id) {
        return res.status(400).json({ error: "Admin ID is missing" });
    }

    const sql = "UPDATE employees SET status = 'active' WHERE emp_id = ? AND admin_id = ?";
    
    db.query(sql, [emp_id, admin_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Failed to activate employee" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Employee not found or already active" });
        }

        res.json({ message: "Employee activated successfully" });
    });
};
