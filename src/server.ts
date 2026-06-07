import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    app.listen(env.PORT, () => {
      console.log(
        `🚀 ShopSphere API running on ${env.APP_URL} (Port: ${env.PORT}) in ${env.NODE_ENV} mode`,
      );
    });
  } catch (error) {
    console.error('❌ Failed to start the server:', error);
    process.exit(1);
  }
};

startServer();
