import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import admin from 'firebase-admin';
import { config } from './config';
import { authMiddleware } from './middleware/auth.middleware';
import { errorMiddleware } from './middleware/error.middleware';

import authRoutes from './routes/auth.routes';
import pantryRoutes from './routes/pantry.routes';
import productsRoutes from './routes/products.routes';
import shoppingRoutes from './routes/shopping.routes';
import recipesRoutes from './routes/recipes.routes';
import mealPlansRoutes from './routes/meal-plans.routes';
import aiRoutes from './routes/ai.routes';
import notificationsRoutes from './routes/notifications.routes';

// Inicjalizacja Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.firebase.projectId,
      clientEmail: config.firebase.clientEmail,
      privateKey: config.firebase.privateKey,
    }),
  });
}

const app = express();

// Security & parsing
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check (publiczny)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Publiczne trasy auth
app.use('/v1/auth', authRoutes);

// Middleware auth dla wszystkich pozostałych tras
app.use('/v1', authMiddleware);

// Chronione trasy
app.use('/v1/pantry', pantryRoutes);
app.use('/v1/products', productsRoutes);
app.use('/v1/shopping', shoppingRoutes);
app.use('/v1/recipes', recipesRoutes);
app.use('/v1/meal-plans', mealPlansRoutes);
app.use('/v1/ai', aiRoutes);
app.use('/v1/notifications', notificationsRoutes);

// Error handler (zawsze ostatni)
app.use(errorMiddleware);

export default app;
