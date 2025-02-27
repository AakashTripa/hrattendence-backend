import db from "../db/db.js";

// Register Employee (by Admin)


// Register Employee (by Admin)
export const registerEmployee = async (req, res) => {
    const { name, email, phone, designation, join_date, admin_id, company_name ,last_name} = req.body;

    if (!admin_id || isNaN(admin_id) || !company_name) {
        return res.status(400).json({ message: "Invalid Admin ID or Company Name" });
    }

    try {
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

            // Determine new office_id (increment for each admin)
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
                const insertQuery = `INSERT INTO employees (emp_id, office_id, name, last_name,email, admin_id, phone, designation, join_date) 
                                     VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)`;

                db.query(insertQuery, [newEmpId, newOfficeId, name,last_name, email, admin_id, phone, designation, join_date], (err, result) => {
                    if (err) {
                        return res.status(500).json({ message: "Error registering employee", error: err });
                    }
                    res.status(201).json({ message: "Employee registered successfully!", emp_id: newEmpId, office_id: newOfficeId });
                });
            });
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};







// Fetch employees by admin ID
export const getEmployeesByAdmin = async (req, res) => {
    const admin_id = req.user.adminId; // ✅ Get admin_id from decoded token

    if (!admin_id) {
        return res.status(400).json({ message: "Invalid Admin ID" });
    }

    try {
        const query = "SELECT * FROM employees WHERE admin_id = ?";
        db.query(query, [admin_id], (err, results) => {
            if (err) {
                return res.status(500).json({ message: "Error fetching employees", error: err });
            }
            res.status(200).json(results);
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};



