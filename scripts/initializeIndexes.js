import mongoose from 'mongoose';
import dotenv from 'dotenv';


dotenv.config({ path: '.env.local' });


import Playlist from '../src/models/Playlist.js';
import Purchase from '../src/models/Purchase.js';
import Message from '../src/models/Message.js';
import StudentPlaylistProgress from '../src/models/StudentPlaylistProgress.js';

async function initializeIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables. Please set MONGO_URI or MONGODB_URI in .env.local');
    }
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    console.log('\nCreating indexes...');


    console.log('Creating Playlist indexes...');
    await Playlist.collection.createIndex({ instructor: 1, status: 1 });
    await Playlist.collection.createIndex({ status: 1, createdAt: -1 });
    await Playlist.collection.createIndex({ instructor: 1, createdAt: -1 });
    await Playlist.collection.createIndex({ title: 1 });
    await Playlist.collection.createIndex({ price: 1 });
    console.log('✓ Playlist indexes created');

  
    console.log('Creating Purchase indexes...');
    await Purchase.collection.createIndex({ student: 1, playlist: 1 }, { unique: true });
    await Purchase.collection.createIndex({ student: 1, status: 1 });
    await Purchase.collection.createIndex({ status: 1, createdAt: -1 });
    await Purchase.collection.createIndex({ instructorPaid: 1, createdAt: 1 });
    console.log(' Purchase indexes created');

    console.log('Creating Message indexes...');
    await Message.collection.createIndex({ sender: 1, receiver: 1, createdAt: -1 });
    await Message.collection.createIndex({ receiver: 1, read: 1 });
    console.log('Message indexes created');


    console.log('Creating StudentPlaylistProgress indexes...');
    await StudentPlaylistProgress.collection.createIndex({ student: 1, playlist: 1 }, { unique: true });
    await StudentPlaylistProgress.collection.createIndex({ playlist: 1, completed: 1 });
    await StudentPlaylistProgress.collection.createIndex({ student: 1, lastAccessedAt: -1 });
    console.log('✓ StudentPlaylistProgress indexes created');

    console.log('\n All indexes created successfully!');

    
    console.log('\nCurrent indexes:');
    const playlistIndexes = await Playlist.collection.getIndexes();
    console.log('\nPlaylist indexes:', Object.keys(playlistIndexes));
    
    const purchaseIndexes = await Purchase.collection.getIndexes();
    console.log('Purchase indexes:', Object.keys(purchaseIndexes));
    
    const messageIndexes = await Message.collection.getIndexes();
    console.log('Message indexes:', Object.keys(messageIndexes));
    
    const progressIndexes = await StudentPlaylistProgress.collection.getIndexes();
    console.log('StudentPlaylistProgress indexes:', Object.keys(progressIndexes));

  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

initializeIndexes();
