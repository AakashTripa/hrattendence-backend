import db from '../db/db.js';
export function addOrUpdateSalary(req, res) {
    const { emp_id, base_salary, da, hra, ta, ma, pa, others } = req.body;
    const othersJson = others ? JSON.stringify(others) : null;
  
    const sqlCheck = 'SELECT * FROM salary_structure  WHERE emp_id = ?';
    db.query(sqlCheck, [emp_id], function (err, result) {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
  
      if (result.length > 0) {
        // Employee exists, update only provided fields
        let updateQuery = 'UPDATE salary_structure SET ';
        const updateValues = [];
        
        if (base_salary !== undefined) {
          updateQuery += 'base_salary = ?, ';
          updateValues.push(base_salary);
        }
        if (da !== undefined) {
          updateQuery += 'da = ?, ';
          updateValues.push(da);
        }
        if (hra !== undefined) {
          updateQuery += 'hra = ?, ';
          updateValues.push(hra);
        }
        if (ta !== undefined) {
          updateQuery += 'ta = ?, ';
          updateValues.push(ta);
        }
        if (ma !== undefined) {
          updateQuery += 'ma = ?, ';
          updateValues.push(ma);
        }
        if (pa !== undefined) {
          updateQuery += 'pa = ?, ';
          updateValues.push(pa);
        }
        if (othersJson !== null) {
          updateQuery += 'others = ?, ';
          updateValues.push(othersJson);
        }
  
        // Remove last comma and add WHERE clause
        updateQuery = updateQuery.slice(0, -2) + ' WHERE emp_id = ?';
        updateValues.push(emp_id);
  
        db.query(updateQuery, updateValues, function (err) {
          if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
          }
          res.json({ message: 'Salary details updated successfully' });
        });
  
      } else {
        // Employee does not exist, insert new record
        const sqlInsert = `
          INSERT INTO salary_structure (emp_id, base_salary, da, hra, ta, ma, pa, others)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.query(sqlInsert, [
          emp_id, base_salary || 0, da || 0, hra || 0, ta || 0, ma || 0, pa || 0, othersJson || '[]'
        ], function (err) {
          if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
          }
          res.json({ message: 'Salary details added successfully' });
        });
      }
    });
  }

export const getSalaryByEmpId = (req, res) => {
    const { emp_id } = req.params;
    const sql = 'SELECT * FROM salary_structure WHERE emp_id = ?';
  
    db.query(sql, [emp_id], (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (results.length === 0) return res.status(404).json({ error: 'Salary not found' });
  
      const salaryData = results[0];
      salaryData.others = salaryData.others ? JSON.parse(salaryData.others) : [];
      res.json(salaryData);
    });
  };
  


  export const getEmployeeStatusAndSalary = (req, res) => {
    const empId = req.params.empId;
    const { month } = req.query; // Format: YYYY-MM

    // Query to fetch total salary from salary_structure
    const salaryQuery = `SELECT total_salary FROM salary_structure WHERE emp_id = ?`;

    // Query to fetch admin_id from employees
    const adminQuery = `SELECT admin_id FROM employees WHERE emp_id = ?`;

    // Query to fetch attendance records for the month
    const attendanceQuery = `
        SELECT status, DATE_FORMAT(date, '%Y-%m-%d') AS date  
        FROM attendance 
        WHERE emp_id = ? 
        AND DATE_FORMAT(date, '%Y-%m') = ?`;

    // Get total salary
    db.query(salaryQuery, [empId], (err, salaryResults) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch salary data' });
        if (salaryResults.length === 0) return res.status(404).json({ error: 'Salary not found' });
        
        const { total_salary } = salaryResults[0];

        // Get admin_id from employees table
        db.query(adminQuery, [empId], (err, adminResults) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch admin data' });
            if (adminResults.length === 0) return res.status(404).json({ error: 'Admin not found' });
            
            const { admin_id } = adminResults[0];

            // Get attendance records
            db.query(attendanceQuery, [empId, month], (err, attendanceResults) => {
                if (err) return res.status(500).json({ error: 'Failed to fetch attendance data' });

                // Get holidays for this admin and month
                const holidaysQuery = `
                    SELECT DATE_FORMAT(date, '%Y-%m-%d') AS date 
                    FROM holidays 
                    WHERE admin_id = ? 
                    AND DATE_FORMAT(date, '%Y-%m') = ?`;

                db.query(holidaysQuery, [admin_id, month], (err, holidayResults) => {
                    if (err) return res.status(500).json({ error: 'Failed to fetch holiday data' });

                    // Get weekends for this admin
                    const weekendsQuery = `SELECT day FROM weekends WHERE admin_id = ?`;

                    db.query(weekendsQuery, [admin_id], (err, weekendResults) => {
                        if (err) return res.status(500).json({ error: 'Failed to fetch weekend data' });

                        // Data processing
                        const totalDays = new Date(month.split('-')[0], month.split('-')[1], 0).getDate();
                        let presentDays = 0, leaveDays = 0, absentDays = 0;
                        let holidayDays = 0, weekendDays = 0;
                        let weekendDates = [];

                        const attendanceMap = {};
                        attendanceResults.forEach(item => {
                            attendanceMap[item.date] = item.status;
                        });

                        // Prepare weekend days (e.g., Saturday, Sunday, Friday)
                        const weekendList = weekendResults.map(row => row.day.toLowerCase());

                        // Loop through each day of the month
                        for (let day = 1; day <= totalDays; day++) {
                            let date = `${month}-${day.toString().padStart(2, '0')}`;
                            let dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

                            const isHoliday = holidayResults.some(h => h.date === date);
                            const isWeekend = weekendList.includes(dayOfWeek);

                            // Attendance status checks
                            if (attendanceMap[date] === 'Present') {
                                presentDays++;
                            } else if (attendanceMap[date] === 'Leave') {
                                leaveDays++;
                            } else if (isHoliday) {
                                holidayDays++;
                            } else if (isWeekend) {
                                weekendDays++;
                                weekendDates.push(date);
                            } else {
                                absentDays++;
                            }
                        }

                        // Calculate total paid days
                        const totalPaidDays = presentDays + leaveDays + holidayDays + weekendDays;
                        const perDaySalary = total_salary / totalDays;
                        const netSalary = Math.round(totalPaidDays * perDaySalary);

                        res.json({
                            total_salary,
                            presentDays,
                            leaveDays,
                            holidayDays,
                            weekendDays,
                            absentDays,
                            totalPaidDays,
                            netSalary,
                            attendance: attendanceResults,
                            holidays: holidayResults,
                            weekends: weekendList,
                            weekendDates
                        });
                    });
                });
            });
        });
    });
};
