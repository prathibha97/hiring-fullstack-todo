import mongoose from 'mongoose';

export async function connectToDatabase(uri: string): Promise<void> {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });

  console.log('Connected to database');
}

export async function disconnectFromDatabase() {
  await mongoose.disconnect();

  console.log('Disconnected from database');
}
