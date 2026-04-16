import mongoose from 'mongoose';
import dotenv from 'dotenv';


dotenv.config({ path: '.env.local' });

async function createIndexes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoUri) {
      throw new Error('❌ MongoDB URI not found! Please set MONGO_URI in .env.local');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

   
    console.log('📚 Creating Playlist indexes...');
    const playlistCollection = db.collection('playlists');
    
    try {
      await playlistCollection.createIndex({ instructor: 1 });
    } catch (e) { if (!e.message.includes('already exists')) throw e; }
    
    try {
      await playlistCollection.createIndex({ title: 1 });
    } catch (e) { if (!e.message.includes('already exists')) throw e; }
    
    try {
      await playlistCollection.createIndex({ status: 1 });
    } catch (e) { if (!e.message.includes('already exists')) throw e; }
    
    try {
      await playlistCollection.createIndex({ price: 1 });
    } catch (e) { if (!e.message.includes('already exists')) throw e; }
    
    try {
      await playlistCollection.createIndex({ instructor: 1, status: 1 });
    } catch (e) { if (!e.message.includes('already exists')) throw e; }
    
    try {
      await playlistCollection.createIndex({ status: 1, createdAt: -1 });
    } catch (e) { if (!e.message.includes('already exists')) throw e; }
    
    try {
      await playlistCollection.createIndex({ instructor: 1, createdAt: -1 });
    } catch (e) { if (!e.message.includes('already exists')) throw e; }
    
    console.log('✅ Playlist indexes created');

    // Create Purchase indexes
    console.log('💰 Creating Purchase indexes...');
    const purchaseCollection = db.collection('purchases');
    
    try {
      await purchaseCollection.createIndex({ student: 1 });
    } catch (e) { if (!e.message.includes('already exists')) throw e; }
    
    try {
      await purchaseCollection.createIndex({ playlist: 1 });
    } catch (e) { if (!e.message.includes('already exists')) throw e; }
    
    try {
      await purchaseCollection.createIndex({ status: 1 });
    } catch (e) { if (!e.message.includes('already exists')) throw e; }
    
    try {
      await purchaseCollection.createIndex({ instructorPaid: 1 });
    } catch (e) { if (!e.message.includes('already exists')) throw e; }
    
    try {
      await purchaseCollection.createIndex({ student: 1, playlist: 1 }, { unique: true });
    } catch (e) { 
      if (!e.message.includes('already exists') && !e.message.includes('same name')) {
        console.log('⚠️  Index student_1_playlist_1 already exists, skipping...');
      }
    }
    
    try {
      await purchaseCollection.createIndex({ student: 1, status: 1 });
    } catch (e) { if (!e.message.includes('already exists')) throw e; }
    
    try {
      await purchaseCollection.createIndex({ status: 1, createdAt: -1 });
    } catch (e) { if (!e.message.includes('already exists')) throw e; }
    
    console.log('✅ Purchase indexes created');

    // Create Message indexes
    console.log('💬 Creating Message indexes...');
    const messageCollection = db.collection('messages');
    
    try {
      await messageCollection.createIndex({ sender: 1 });
    } catch (e) { if (!e.message.includes('already exists')) throw e; }
    
    try {
      await messageCollection.createIndex({ receiver: 1 });
    } catch (e) { if (!e.message.includes('already exists')) throw e; }
    
    try {
      await messageCollection.createIndex({ read: 1 });
    } catch (e) { if (!e.message.includes('already exists')) throw e; }
    
    try {
      await messageCollection.createIndex({ sender: 1, receiver: 1, createdAt: -1 });
    } catch (e) { if (!e.message.includes('already exists')) throw e; }
    
    try {
      await messageCollection.createIndex({ receiver: 1, read: 1 });
    } catch (e) { if (!e.message.includes('already exists')) throw e; }
    
    console.log('✅ Message indexes created');

    // Create StudentPlaylistProgress indexes
    console.log('📊 Creating StudentPlaylistProgress indexes...');
    const progressCollection = db.collection('studentplaylistprogresses');
    
    try {
      await progressCollection.createIndex({ student: 1 });
    } catch (e) { if (!e.message.includes('already exists')) throw e; }
    
    try {
      await progressCollection.createIndex({ playlist: 1 });
    } catch (e) { if (!e.message.includes('already exists')) throw e; }
    
    try {
      await progressCollection.createIndex({ student: 1, playlist: 1 }, { unique: true });
    } catch (e) { 
      if (!e.message.includes('already exists') && !e.message.includes('same name')) {
        console.log('⚠️  Index student_1_playlist_1 already exists, skipping...');
      }
    }
    
    try {
      await progressCollection.createIndex({ playlist: 1, completed: 1 });
    } catch (e) { if (!e.message.includes('already exists')) throw e; }
    
    try {
      await progressCollection.createIndex({ student: 1, lastAccessedAt: -1 });
    } catch (e) { if (!e.message.includes('already exists')) throw e; }
    
    console.log('✅ StudentPlaylistProgress indexes created');

    console.log('\n🎉 All indexes created successfully!\n');

    // List all indexes
    console.log('📋 Current indexes:\n');
    
    const playlistIndexes = await playlistCollection.indexes();
    console.log('Playlist indexes:', playlistIndexes.map(i => i.name).join(', '));
    
    const purchaseIndexes = await purchaseCollection.indexes();
    console.log('Purchase indexes:', purchaseIndexes.map(i => i.name).join(', '));
    
    const messageIndexes = await messageCollection.indexes();
    console.log('Message indexes:', messageIndexes.map(i => i.name).join(', '));
    
    const progressIndexes = await progressCollection.indexes();
    console.log('StudentPlaylistProgress indexes:', progressIndexes.map(i => i.name).join(', '));

    console.log('\n✅ Done!');

  } catch (error) {
    console.error('❌ Error creating indexes:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

createIndexes();
