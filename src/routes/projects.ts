import { Hono } from 'hono';
import { cors } from 'hono/cors'
import dayjs from 'dayjs';
import 'dayjs/locale/ja';
import { pool } from '../db/pool';
import type { Project } from '../models/project';

const app = new Hono();
app.use(cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE']
}));

// 🔹 GET: 全プロジェクト取得
app.get('/projects', async (c) => {
    try {
        const result = await pool.query(`
          SELECT 
            p.pjCd, p.pjName, p.buCd, bu.buName, p.year, p.planSecCd, ps.planSecName,
            p.constTypeCd, ct.constTypeName, p.regionCd, r.regionName, p.customerCd, c.customerName,
            p.abbreviation, p.orderName, p.startDate, p.totalMM, p.totalConst,
            ur.inhouse AS inhouseUtilizationRate, ur.outsourced AS outsourcedUtilizationRate, ur.external AS externalUtilizationRate,
            wh.inhouse AS inhouseWorkHours, wh.outsourced AS outsourcedWorkHours, wh.external AS externalWorkHours,
            pd.calculationBasis, pd.changeReason, pd.remarks
          FROM projects p
          LEFT JOIN business_units bu ON p.buCd = bu.buCd
          LEFT JOIN plan_sections ps ON p.planSecCd = ps.planSecCd
          LEFT JOIN construction_types ct ON p.constTypeCd = ct.constTypeCd
          LEFT JOIN regions r ON p.regionCd = r.regionCd
          LEFT JOIN customers c ON p.customerCd = c.customerCd
          LEFT JOIN utilization_rates ur ON p.pjCd = ur.pjCd
          LEFT JOIN work_hours wh ON p.pjCd = wh.pjCd
          LEFT JOIN project_details pd ON p.pjCd = pd.pjCd
        `);

        // 整形
        const projects: Project[] = result.rows.map(row => (
          {
            pjCd: row.pjcd,
            buCd: row.bucd,
            buName: row.buname,
            year: row.year,
            planSecCd: row.planseccd,
            planSecName: row.plansecname,
            constTypeCd: row.consttypecd,
            constTypeName: row.consttypename,
            regionCd: row.regioncd,
            regionName: row.regionname,
            pjName: row.pjname,
            customerCd: row.customercd,
            customerName: row.customername,
            abbreviation: row.abbreviation,
            order: row.ordername,
            startDate: dayjs(row.startdate).format('YYYY-MM'),
            totalMM: row.totalmm,
            totalConst: row.totalconst,
            utilizationRate: {
                inhouse: row.inhouseutilizationrate ?? 0,
                outsourced: row.outsourcedutilizationrate ?? 0,
                external: row.externalutilizationrate ?? 0,
            },
            workHours: {
                inhouse: row.inhouseworkhours ?? 0,
                outsourced: row.outsourcedworkhours ?? 0,
                external: row.externalworkhours ?? 0,
            },
            calculationBasis: row.calculationbasis ?? '',
            changeReason: row.changereason ?? '',
            remarks: row.remarks ?? '',
          }
        ));

        // レスポンス
        return c.json(projects);
    } catch (error) {
        console.error(error);
        return c.json({ error: 'データ取得に失敗しました' }, 500);
    }
});

// 🔹 GET: 特定のプロジェクト取得
app.get('/projects/:pjCd', async (c) => {
    try {
        const { pjCd } = c.req.param();
        const result = await pool.query(`
          SELECT 
            p.pjCd, p.pjName, p.buCd, bu.buName, p.year, p.planSecCd, ps.planSecName,
            p.constTypeCd, ct.constTypeName, p.regionCd, r.regionName, p.customerCd, c.customerName,
            p.abbreviation, p.orderName, p.startDate, p.totalMM, p.totalConst,
            ur.inhouse AS inhouseUtilizationRate, ur.outsourced AS outsourcedUtilizationRate, ur.external AS externalUtilizationRate,
            wh.inhouse AS inhouseWorkHours, wh.outsourced AS outsourcedWorkHours, wh.external AS externalWorkHours,
            pd.calculationBasis, pd.changeReason, pd.remarks
          FROM projects p
          LEFT JOIN business_units bu ON p.buCd = bu.buCd
          LEFT JOIN plan_sections ps ON p.planSecCd = ps.planSecCd
          LEFT JOIN construction_types ct ON p.constTypeCd = ct.constTypeCd
          LEFT JOIN regions r ON p.regionCd = r.regionCd
          LEFT JOIN customers c ON p.customerCd = c.customerCd
          LEFT JOIN utilization_rates ur ON p.pjCd = ur.pjCd
          LEFT JOIN work_hours wh ON p.pjCd = wh.pjCd
          LEFT JOIN project_details pd ON p.pjCd = pd.pjCd
          WHERE p.pjCd = $1`, [pjCd]);
        if (result.rowCount === 0) {
            return c.json({ error: 'プロジェクトが見つかりません' }, 404);
        }
        const row = result.rows[0];
        // 整形
        const project: Project = {
          pjCd: row.pjcd,
          buCd: row.bucd,
          buName: row.buname,
          year: row.year,
          planSecCd: row.planseccd,
          planSecName: row.plansecname,
          constTypeCd: row.consttypecd,
          constTypeName: row.consttypename,
          regionCd: row.regioncd,
          regionName: row.regionname,
          pjName: row.pjname,
          customerCd: row.customercd,
          customerName: row.customername,
          abbreviation: row.abbreviation,
          order: row.ordername,
          startDate: dayjs(row.startdate).format('YYYY-MM'),
          totalMM: row.totalmm,
          totalConst: row.totalconst,
          utilizationRate: {
              inhouse: row.inhouseutilizationrate ?? 0,
              outsourced: row.outsourcedutilizationrate ?? 0,
              external: row.externalutilizationrate ?? 0,
          },
          workHours: {
              inhouse: row.inhouseworkhours ?? 0,
              outsourced: row.outsourcedworkhours ?? 0,
              external: row.externalworkhours ?? 0,
          },
          calculationBasis: row.calculationbasis ?? '',
          changeReason: row.changereason ?? '',
          remarks: row.remarks ?? ''
        };

        // レスポンス
        return c.json(project);
    } catch (error) {
        console.error(error);
        return c.json({ error: 'データ取得に失敗しました' }, 500);
    }
});

// 🔹 POST: 新規プロジェクト追加
app.post('/projects', async (c) => {
    try {
        const body: Project = await c.req.json();
        await pool.query(
            `INSERT INTO projects (pjCd, pjName, buCd, year, planSecCd, constTypeCd, regionCd, customerCd, startDate, totalMM, totalConst) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
                body.pjCd, body.pjName, body.buCd, body.year, body.planSecCd, body.constTypeCd,
                body.regionCd, body.customerCd, body.startDate, body.totalMM, body.totalConst
            ]
        );
        return c.json({ message: 'プロジェクト追加成功' });
    } catch (error) {
        console.error(error);
        return c.json({ error: 'プロジェクト追加に失敗しました' }, 500);
    }
});

// 🔹 PUT: プロジェクト更新
app.put('/projects/:pjCd', async (c) => {
    try {
        const { pjCd } = c.req.param();
        const body: Partial<Project> = await c.req.json();

        await pool.query(
            `UPDATE projects SET pjName = $1, buCd = $2, year = $3 WHERE pjCd = $4`,
            [body.pjName, body.buCd, body.year, pjCd]
        );

        return c.json({ message: 'プロジェクト更新成功' });
    } catch (error) {
        console.error(error);
        return c.json({ error: 'プロジェクト更新に失敗しました' }, 500);
    }
});

export default app;


// {"pjCd":"PJ001",
//   "buCd":"BU001",
//   "year":2025,
//   "planSecCd":"PS001",
//   "constTypeCd":"CT001",
//   "regionCd":"R001",
//   "pjName":"Project 1",
//   "customerCd":"C001",
//   "abbreviation":"Abbr 1",
//   "order":"Order 1",
//   "startDate":"2024-12-31T15:00:00.000Z",
//   "totalMM":12,
//   "totalConst":1000,
//   "utilizationRate":{
//     "inhouse":0,
//     "outsourced":0,
//     "external":0
//   },
//   "workHours":{
//     "inhouse":0,
//     "outsourced":0,
//     "external":0
//   },
//   "calculationBasis":"",
//   "changeReason":"",
//   "remarks":""
// }