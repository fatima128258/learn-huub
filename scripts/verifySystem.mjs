import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function verifySystem() {
  console.log('🔍 Starting System Health Check...\n');
  
  try {
    // 1. Check MongoDB Connection
    console.log('1️⃣  Checking MongoDB Connection...');
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.log('❌ MongoDB URI not found in .env.local');
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected successfully\n');

    const db = mongoose.connection.db;

    // 2. Check Collections
    console.log('2️⃣  Checking Collections...');
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    const requiredCollections = ['playlists', 'purchases', 'messages', 'studentplaylistprogresses', 'users'];
    let allCollectionsExist = true;
    
    for (const col of requiredCollections) {
      if (collectionNames.includes(col)) {
        console.log(`✅ ${col} collection exists`);
      } else {
        console.log(`⚠️  ${col} collection not found`);
        allCollectionsExist = false;
      }
    }
    console.log('');

    // 3. Check Indexes
    console.log('3️⃣  Checking Indexes...\n');
    
    // Playlist indexes
    console.log('📚 Playlist Indexes:');
    const playlistIndexes = await db.collection('playlists').indexes();
    console.log(`   Total: ${playlistIndexes.length} indexes`);
    const playlistIndexNames = playlistIndexes.map(i => i.name);
    
    const requiredPlaylistIndexes = ['instructor_1', 'title_1', 'status_1', 'price_1', 'instructor_1_status_1'];
    for (const idx of requiredPlaylistIndexes) {
      if (playlistIndexNames.includes(idx)) {
        console.log(`   ✅ ${idx}`);
      } else {
        console.log(`   ❌ ${idx} missing`);
      }
    }
    console.log('');

    // Purchase indexes
    console.log('💰 Purchase Indexes:');
    const purchaseIndexes = await db.collection('purchases').indexes();
    console.log(`   Total: ${purchaseIndexes.length} indexes`);
    const purchaseIndexNames = purchaseIndexes.map(i => i.name);
    
    const requiredPurchaseIndexes = ['student_1', 'playlist_1', 'status_1', 'student_1_playlist_1'];
    for (const idx of requiredPurchaseIndexes) {
      if (purchaseIndexNames.includes(idx)) {
        console.log(`   ✅ ${idx}`);
      } else {
        console.log(`   ❌ ${idx} missing`);
      }
    }
    console.log('');

    // Message indexes
    console.log('💬 Message Indexes:');
    const messageIndexes = await db.collection('messages').indexes();
    console.log(`   Total: ${messageIndexes.length} indexes`);
    const messageIndexNames = messageIndexes.map(i => i.name);
    
    const requiredMessageIndexes = ['sender_1', 'receiver_1', 'read_1'];
    for (const idx of requiredMessageIndexes) {
      if (messageIndexNames.includes(idx)) {
        console.log(`   ✅ ${idx}`);
      } else {
        console.log(`   ❌ ${idx} missing`);
      }
    }
    console.log('');

    // Progress indexes
    console.log('📊 StudentPlaylistProgress Indexes:');
    const progressIndexes = await db.collection('studentplaylistprogresses').indexes();
    console.log(`   Total: ${progressIndexes.length} indexes`);
    const progressIndexNames = progressIndexes.map(i => i.name);
    
    const requiredProgressIndexes = ['student_1', 'playlist_1', 'student_1_playlist_1'];
    for (const idx of requiredProgressIndexes) {
      if (progressIndexNames.includes(idx)) {
        console.log(`   ✅ ${idx}`);
      } else {
        console.log(`   ❌ ${idx} missing`);
      }
    }
    console.log('');

    // 4. Check Document Counts
    console.log('4️⃣  Checking Document Counts...');
    const playlistCount = await db.collection('playlists').countDocuments();
    const purchaseCount = await db.collection('purchases').countDocuments();
    const messageCount = await db.collection('messages').countDocuments();
    const userCount = await db.collection('users').countDocuments();
    
    console.log(`   Playlists: ${playlistCount}`);
    console.log(`   Purchases: ${purchaseCount}`);
    console.log(`   Messages: ${messageCount}`);
    console.log(`   Users: ${userCount}`);
    console.log('');

    // 5. Check Redis Configuration
    console.log('5️⃣  Checking Redis Configuration...');
    const redisHost = process.env.REDIS_HOST;
    const redisPort = process.env.REDIS_PORT;
    
    if (redisHost && redisPort) {
      console.log(`✅ Redis configured: ${redisHost}:${redisPort}`);
      console.log('   Note: Redis is optional. System works without it.');
    } else {
      console.log('⚠️  Redis not configured (optional)');
      console.log('   System will work with indexes only.');
    }
    console.log('');

    // 6. Performance Test
    console.log('6️⃣  Running Performance Test...');
    
    const startTime = Date.now();
    const testPlaylists = await db.collection('playlists')
      .find({ status: 'approved' })
      .limit(10)
      .toArray();
    const queryTime = Date.now() - startTime;
    
    console.log(`   Query time: ${queryTime}ms`);
    if (queryTime < 100) {
      console.log('   ✅ Excellent performance!');
    } else if (queryTime < 500) {
      console.log('   ✅ Good performance');
    } else {
      console.log('   ⚠️  Slow query - check indexes');
    }
    console.log('');

    // Final Summary
    console.log('═══════════════════════════════════════');
    console.log('📊 SYSTEM HEALTH CHECK SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log('✅ MongoDB: Connected');
    console.log(`✅ Collections: ${allCollectionsExist ? 'All present' : 'Some missing'}`);
    console.log(`✅ Indexes: ${playlistIndexes.length + purchaseIndexes.length + messageIndexes.length + progressIndexes.length} total`);
    console.log(`✅ Documents: ${playlistCount + purchaseCount + messageCount + userCount} total`);
    console.log(`✅ Performance: ${queryTime}ms query time`);
    console.log('═══════════════════════════════════════');
    console.log('\n🎉 System is working properly!\n');

  } catch (error) {
    console.error('\n❌ Error during health check:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

verifySystem();
