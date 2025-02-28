// controllers/attendanceController.js
import db from "../db/db.js";

// Submit attendance for multiple employees
export const submitAttendance = (req, res) => {
  const { date, selectedEmployees } = req.body;

  if (!date || !selectedEmployees || Object.keys(selectedEmployees).length === 0) {
    return res.status(400).json({ message: "Invalid data provided" });
  }

  // Counter to track the number of successful inserts
  let successfulInserts = 0;
  const totalInserts = Object.keys(selectedEmployees).length;

  // Loop through selected employees and insert records into the database
  for (const emp_id in selectedEmployees) {
    const { status, time } = selectedEmployees[emp_id];

    // Insert attendance record using a callback
    db.query(
      "INSERT INTO attendance (emp_id, date, status, time) VALUES (?, ?, ?, ?)",
      [emp_id, date, status, time],
      (error, results) => {
        if (error) {
          console.error("Error inserting attendance record:", error);
          return res.status(500).json({ message: "Failed to submit attendance" });
        }

        successfulInserts++;

        // If all inserts are successful, send a success response
        if (successfulInserts === totalInserts) {
          res.status(200).json({ message: "Attendance submitted successfully" });
        }
      }
    );
  }
};


export const updateEmployeeAttendance = (req, res) => {
    const { emp_id } = req.params;
    const { date, status, time } = req.body;

    if (!emp_id || !date || !status || !time) {
        return res.status(400).json({ message: "Invalid data provided" });
    }

    // Check if the attendance record already exists
    db.query("SELECT * FROM attendance WHERE emp_id = ? AND date = ?", [emp_id, date], (err, results) => {
        if (err) {
            console.error("Error checking attendance record:", err);
            return res.status(500).json({ message: "Failed to check employee attendance" });
        }

        if (results.length > 0) {
            // Update the existing record
            db.query(
                "UPDATE attendance SET status = ?, time = ? WHERE emp_id = ? AND date = ?",
                [status, time, emp_id, date],
                (updateErr) => {
                    if (updateErr) {
                        console.error("Error updating attendance record:", updateErr);
                        return res.status(500).json({ message: "Failed to update employee data" });
                    }
                    res.status(200).json({ message: "Employee data updated successfully" });
                }
            );
        } else {
            // Insert a new record
            db.query(
                "INSERT INTO attendance (emp_id, date, status, time) VALUES (?, ?, ?, ?)",
                [emp_id, date, status, time],
                (insertErr) => {
                    if (insertErr) {
                        console.error("Error inserting attendance record:", insertErr);
                        return res.status(500).json({ message: "Failed to insert employee data" });
                    }
                    res.status(200).json({ message: "Employee data inserted successfully" });
                }
            );
        }
    });
};


export const getAttendanceStats = (req, res) => {
  const adminId = req.user.adminId;
  const { date } = req.query; // Get date from query params

  if (!date) {
      return res.status(400).json({ error: "Date is required" });
  }

  const query = `
      SELECT status, COUNT(*) AS count 
      FROM attendance 
      WHERE emp_id IN (SELECT emp_id FROM employees WHERE admin_id = ?) 
      AND date = ?
      GROUP BY status;
  `;

  db.query(query, [adminId, date], (err, results) => {
      if (err) {
          console.error("Error fetching attendance stats:", err);
          return res.status(500).json({ error: "Server Error" });
      }

      // Initialize stats with default values
      const stats = { Present: 0, Absent: 0, "Half-Day": 0, Leave: 0 };
      results.forEach(row => (stats[row.status] = row.count));

      res.json(stats);
  });
};


