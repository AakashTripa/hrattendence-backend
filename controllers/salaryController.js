import db from '../db/db.js';

export const addOrUpdateSalary = (req, res) => {
    const { emp_id, base_salary = 0, da = 0, hra = 0, ta = 0, ma = 0, pa = 0, others = [] } = req.body;

    const othersJson = JSON.stringify(others);

    const total_salary = parseFloat(base_salary) + parseFloat(da) + parseFloat(hra) + parseFloat(ta) + parseFloat(ma) + parseFloat(pa)
        + others.reduce((sum, { value }) => sum + parseFloat(value || 0), 0);

    const upsertSql = `
        INSERT INTO salary_structure (emp_id, base_salary, da, hra, ta, ma, pa, others, total_salary) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            base_salary = VALUES(base_salary), 
            da = VALUES(da), 
            hra = VALUES(hra), 
            ta = VALUES(ta), 
            ma = VALUES(ma), 
            pa = VALUES(pa),
            others = VALUES(others),
            total_salary = VALUES(total_salary)`;

    const values = [emp_id, base_salary, da, hra, ta, ma, pa, othersJson, total_salary];

    db.query(upsertSql, values, (err, result) => {
        if (err) {
            console.error("SQL Error:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Salary structure added/updated successfully" });
    });
};
