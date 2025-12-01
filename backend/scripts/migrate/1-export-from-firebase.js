/**
 * Step 1: Export data from Firebase Firestore to JSON files
 *
 * This script exports all collections from Firebase to local JSON files:
 * - users → data/users.json
 * - posts → data/posts.json
 * - follows → data/follows.json
 * - likes → data/likes.json
 * - comments → data/comments.json
 * - shares → data/shares.json
 */

require('dotenv').config();
const admin = require('firebase-admin');
const fs = require('fs').promises;
const path = require('path');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

const db = admin.firestore();
const dataDir = path.join(__dirname, 'data');

/**
 * Export a Firestore collection to JSON file
 */
async function exportCollection(collectionName, fileName) {
  console.log(`\n📦 Exporting ${collectionName}...`);

  try {
    const snapshot = await db.collection(collectionName).get();
    const documents = [];

    snapshot.forEach(doc => {
      const data = doc.data();

      // Convert Firestore Timestamps to ISO strings
      Object.keys(data).forEach(key => {
        if (data[key] && typeof data[key].toDate === 'function') {
          data[key] = data[key].toDate().toISOString();
        }
      });

      documents.push({
        id: doc.id,
        ...data
      });
    });

    await fs.writeFile(
      path.join(dataDir, fileName),
      JSON.stringify(documents, null, 2)
    );

    console.log(`✅ Exported ${documents.length} documents from ${collectionName}`);
    return documents.length;
  } catch (error) {
    console.error(`❌ Error exporting ${collectionName}:`, error.message);
    throw error;
  }
}

/**
 * Main export function
 */
async function main() {
  console.log('🚀 Starting Firebase data export...\n');
  console.log('Firebase Project:', process.env.FIREBASE_PROJECT_ID);

  // Create data directory if it doesn't exist
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }

  const stats = {};

  try {
    // Export all collections
    stats.users = await exportCollection('users', 'users.json');
    stats.posts = await exportCollection('posts', 'posts.json');
    stats.follows = await exportCollection('follows', 'follows.json');
    stats.likes = await exportCollection('likes', 'likes.json');
    stats.comments = await exportCollection('comments', 'comments.json');
    stats.shares = await exportCollection('shares', 'shares.json');

    // Export summary
    await fs.writeFile(
      path.join(dataDir, '_export_summary.json'),
      JSON.stringify({
        exportDate: new Date().toISOString(),
        collections: stats,
        total: Object.values(stats).reduce((sum, count) => sum + count, 0)
      }, null, 2)
    );

    console.log('\n✅ Export completed successfully!');
    console.log('\n📊 Summary:');
    Object.entries(stats).forEach(([collection, count]) => {
      console.log(`   ${collection}: ${count} documents`);
    });
    console.log(`   Total: ${Object.values(stats).reduce((sum, count) => sum + count, 0)} documents`);

  } catch (error) {
    console.error('\n❌ Export failed:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { exportCollection };
