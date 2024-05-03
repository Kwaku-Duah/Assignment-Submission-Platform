import express, { Express } from 'express';
import { PORT } from './secrets';
import rootRouter from './routes';
import swaggerDoc from './utils/swaggerDoc';
import { errorMiddleware } from './middlewares/errors';
import cors from 'cors';
import helmet from 'helmet';
import { seedScript } from '../prisma/seedScript';
import { existsSync, writeFileSync } from 'fs';
import { sendJob } from './controllers/cronNotification';

const app: Express = express();
app.use(helmet());
app.use(express.json());

app.use(
  cors({
    origin: '*',
    methods: 'GET,POST,PUT,DELETE',
    credentials: true
  })
);

app.use('/api', rootRouter);
swaggerDoc(app);
app.use(errorMiddleware);
swaggerDoc(app);

const seedFlagFile = '.seeded';

if (!existsSync(seedFlagFile)) {
  seedScript(); // Run the seed script
  writeFileSync(seedFlagFile, '');
}
sendJob();
app.listen(PORT, () => {});
