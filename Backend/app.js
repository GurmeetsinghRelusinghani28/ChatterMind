
import express from 'express';
import morgan from 'morgan';
import userRoutes from './routes/User.routes.js';
import ProjectRoutes from './routes/Project.routes.js';
import aiRoutes from './routes/ai.routes.js';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import githubRoutes from './routes/github.js';
import githubUploadRoutes from './routes/githubUpload.js';
import mongoose from 'mongoose';
import { getRedisDashboardData } from './services/redis.service.js';
import { getMetricsText, observeHttpRequest } from './monitoring/metrics.js';
dotenv.config();

const app = express();

const allowedOrigins = new Set([
  'https://chattermind-1.onrender.com',
  'http://localhost:5173',
  'http://localhost:5174',
]);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true
}));


app.use(morgan('dev')); // for getting the info of api; like GET / 200 4.634 ms - 11
app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.use(cookieParser());
app.use((req, res, next) => {
  const startedAt = process.hrtime.bigint();
  res.on('finish', () => {
    const route = req.route?.path || req.path;
    observeHttpRequest({
      method: req.method,
      route,
      status: res.statusCode,
      durationSeconds: Number(process.hrtime.bigint() - startedAt) / 1e9,
    });
  });
  next();
});

app.get('/health', async (req, res) => {
  const mongoHealthy = mongoose.connection.readyState === 1;
  const redisDashboard = await getRedisDashboardData();
  const redisHealthy = redisDashboard.redis.connectedClients > 0;
  const healthy = mongoHealthy;
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongoHealthy ? 'up' : 'down',
      redis: redisHealthy ? 'up' : 'unavailable',
    },
  });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.send(await getMetricsText());
});
app.use('/users',userRoutes);
app.use('/projects',ProjectRoutes);
app.use('/ai',aiRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/github', githubUploadRoutes);


app.get('/',(req,res)=>{
    res.send('Hello World');
});

export default app;

