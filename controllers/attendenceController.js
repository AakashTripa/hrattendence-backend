// controllers/attendanceController.js
import db from "../db/db.js";

// Submit attendance for multiple employees
export const submitAttendance = (req, res) => {
  const { date, selectedEmployees } = req.body;

  if (!date || !selectedEmployees || Object.keys(selectedEmployees).length === 0) {
      return res.status(400).json({ message: 'Date and employees data are required' });
  }

  const values = [];

  // Extract values properly from the object
  for (const emp_id in selectedEmployees) {
      const { entryTime, exitTime, status } = selectedEmployees[emp_id];

      if (!entryTime || !exitTime || !status) {
          return res.status(400).json({ message: `All fields are required for ${emp_id}` });
      }

      values.push([emp_id, date, status, entryTime, exitTime]);
  }

  const query = `
      INSERT INTO attendance (emp_id, date, status, entry_time, exit_time) 
      VALUES ? 
      ON DUPLICATE KEY UPDATE 
          status = VALUES(status), 
          entry_time = VALUES(entry_time), 
          exit_time = VALUES(exit_time)`;

  db.query(query, [values], (err, result) => {
      if (err) {
          console.error('Error inserting/updating attendance:', err);
          return res.status(500).json({ message: 'Internal Server Error' });
      }

      res.status(201).json({ message: 'Attendance recorded successfully' });
  });
};


// Function to convert AM/PM to 24-hour format for MySQL
const convertTo24Hour = (time) => {
    if (!time) return null;
    const [hourMinute, period] = time.split(" ");
    let [hours, minutes] = hourMinute.split(":");
    hours = parseInt(hours, 10);
    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, "0")}:${minutes}:00`;
  };
  
  export const updateEmployeeAttendance = (req, res) => {
    const { emp_id } = req.params;
    const { date, status, entry_time, exit_time } = req.body;
  
    if (!emp_id || !date || !status) {
      return res.status(400).json({ message: "Invalid data provided" });
    }
  
    // Convert time before updating in MySQL
    const entryTimeForDB = convertTo24Hour(entry_time);
    const exitTimeForDB = convertTo24Hour(exit_time);
  
    // First, check if attendance for this employee on this date exists
    db.query(
      "SELECT id FROM attendance WHERE emp_id = ? AND date = ?",
      [emp_id, date],
      (selectErr, results) => {
        if (selectErr) {
          console.error("Error checking attendance record:", selectErr);
          return res.status(500).json({ message: "Database query failed" });
        }
  
        if (results.length > 0) {
          // If record exists, update it
          db.query(
            "UPDATE attendance SET status = ?, entry_time = ?, exit_time = ? WHERE emp_id = ? AND date = ?",
            [status, entryTimeForDB, exitTimeForDB, emp_id, date],
            (updateErr) => {
              if (updateErr) {
                console.error("Error updating attendance record:", updateErr);
                return res.status(500).json({ message: "Failed to update attendance" });
              }
              res.status(200).json({ message: "Attendance updated successfully" });
            }
          );
        } else {
          // If no record exists, insert a new one
          db.query(
            "INSERT INTO attendance (emp_id, date, status, entry_time, exit_time) VALUES (?, ?, ?, ?, ?)",
            [emp_id, date, status, entryTimeForDB, exitTimeForDB],
            (insertErr) => {
              if (insertErr) {
                console.error("Error inserting attendance record:", insertErr);
                return res.status(500).json({ message: "Failed to insert attendance" });
              }
              res.status(201).json({ message: "Attendance recorded successfully" });
            }
          );
        }
      }
    );
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




// ✅ Fetch latest attendance by employee ID


export const getEmployeeAttendance = function (req, res) {
  const emp_id = req.params.emp_id;
  const { month, year } = req.query; // Get month and year from query parameters

  let query = `
      SELECT id, date, status, entry_time, exit_time 
      FROM attendance 
      WHERE emp_id = ? 
  `;
  let values = [emp_id];

  if (month && year) {
      query += " AND MONTH(date) = ? AND YEAR(date) = ?";
      values.push(month, year);
  }

  query += " ORDER BY date DESC";

  db.query(query, values, function (error, results) {
      if (error) {
          console.error("Error fetching attendance:", error);
          res.status(500).json({ error: "Server error" });
          return;
      }

      if (results.length === 0) {
          res.status(404).json({ message: "No attendance records found for this month." });
          return;
      }

      res.json(results);
  });
};
