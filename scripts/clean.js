const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function clean() {
  try {
    console.log('Stopping and removing Docker containers and volumes...');
    try {
      execSync('docker compose down -v', { stdio: 'inherit' });
    } catch (e) {
      // It's ok if docker compose fails, might not have containers
    }

    console.log('Removing node_modules directories...');
    const dirsToRemove = [
      'node_modules',
      'backend/node_modules',
      'backend/services/atomic/user-service/node_modules',
      'backend/services/atomic/post-service/node_modules',
      'backend/services/atomic/interaction-service/node_modules',
      'backend/services/atomic/follow-service/node_modules',
      'backend/services/composite/feed-service/node_modules',
      'backend/services/composite/profile-service/node_modules',
      'backend/services/composite/social-interaction-service/node_modules',
      'backend/services/composite/explore-routes-service/node_modules',
      'backend/services/composite/leaderboard-service/node_modules',
      'backend/services/composite/user-discovery-service/node_modules',
    ];

    for (const dir of dirsToRemove) {
      const fullPath = path.join(process.cwd(), dir);
      if (fs.existsSync(fullPath)) {
        console.log(`  Removing ${dir}...`);
        fs.rmSync(fullPath, { recursive: true, force: true });
      }
    }

    console.log('Clean complete!');
  } catch (error) {
    console.error('Error during cleanup:', error.message);
    process.exit(1);
  }
}

clean();
