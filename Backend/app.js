
import express from 'express';
import morgan from 'morgan';
import connect from './db/db.js';
import userRoutes from './routes/User.routes.js';
import ProjectRoutes from './routes/Project.routes.js';
import aiRoutes from './routes/ai.routes.js';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import cors from 'cors';
dotenv.config();

connect();

const app = express();

app.use(cors());
app.use(morgan('dev')); // for getting the info of api; like GET / 200 4.634 ms - 11
app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.use(cookieParser());
app.use('/users',userRoutes);
app.use('/projects',ProjectRoutes);
app.use('/ai',aiRoutes);

app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    next();
  });


app.get('/',(req,res)=>{
    res.send('Hello World');
});

export default app;

