import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'kuchniapp',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  },

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },

  expo: {
    accessToken: process.env.EXPO_ACCESS_TOKEN || '',
  },

  openFoodFacts: {
    userAgent: process.env.OPENFOODFACTS_USER_AGENT || 'KuchniApp/1.0',
  },
};
