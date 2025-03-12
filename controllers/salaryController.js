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
        let updateQuery = 'UPDATE salary_structure  SET ';
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
  