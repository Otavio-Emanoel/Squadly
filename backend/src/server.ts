import { app } from './app';
import { connectDatabase } from './config/database';

const PORT = Number(process.env.PORT) || 3333;

connectDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
