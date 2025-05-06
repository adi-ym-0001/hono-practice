import { serve } from '@hono/node-server';
import app from './routes/projects';

serve(app, (info) => {
    console.log(`🚀 Server running on http://localhost:${info.port}`);
});
