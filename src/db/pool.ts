import { Pool } from 'pg';
import { config } from 'dotenv';

config(); // 環境変数を読み込む

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
