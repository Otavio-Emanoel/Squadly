import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI as string;

if (!uri) {
  console.error('❌ MONGODB_URI não definida no .env');
}

export async function connectDatabase() {
  if (!uri) return;

  try {
    await mongoose.connect(uri, {
      dbName: 'squadly',
    } as mongoose.ConnectOptions);

    mongoose.connection.on('connected', () => console.log('🟢 MongoDB conectado'));
    mongoose.connection.on('error', (err: unknown) => console.error('🔴 Erro MongoDB:', err));
    mongoose.connection.on('disconnected', () => console.warn('🟡 MongoDB desconectado'));
  } catch (err) {
    console.error('🔴 Falha ao conectar no MongoDB:', err);
    // Retry simples após 3s
    setTimeout(connectDatabase, 3000);
  }
}

export default mongoose;
