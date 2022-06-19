import { Request, Response } from 'express';
import { QueryResult } from 'pg';
import * as dbUtil from './../utils/dbUtil';

interface Report {
    year: number,
    caregivers: {
        name: string,
        patients: string[]
    }[]
}

export const getReport = async (req: Request, res: Response) => {

    const {year} = req.params
    const sql = `
        SELECT
            caregiver.id      AS caregiver_id,
            caregiver.name    AS caregiver_name,
            patient.id        AS patient_id,
            patient.name      AS patient_name,
            visit.date        AS visit_date
        FROM caregiver
        Join visit ON DATE_PART('year', visit.date) = ${year} AND visit.caregiver = caregiver.id
        JOIN patient ON patient.id = visit.patient
    `;
    
    let result : QueryResult;
    try {
        result = await dbUtil.sqlToDB(sql, []);
        const report: Report = {
            year: parseInt(req.params.year),
            caregivers: []
        };

        result.rows.forEach((row) => {
            let existing = report.caregivers.filter((caregiver => {
                return caregiver.name == row.caregiver_name
            }))
            if (existing.length) {
                let existingIndex = report.caregivers.indexOf(existing[0]);
                report.caregivers[existingIndex].patients = report.caregivers[existingIndex].patients.concat(row.patient_name);
            } else {
                report.caregivers.push({
                    name: row.caregiver_name,
                    patients: [row.patient_name]
                });
            }
        })

        res.status(200).json(report);
    } catch (error) {
        throw new Error(error.message);
    }

}
