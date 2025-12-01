# Firebase to PostgreSQL Migration Scripts

Complete migration toolkit to move your data from Firebase Firestore to PostgreSQL.

## Prerequisites

1. **Firebase Service Account Key**
   - Go to Firebase Console > Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file securely

2. **PostgreSQL Database Running**
   - Ensure your Supabase PostgreSQL instance is running
   - Have your DATABASE_URL ready

3. **Prisma Schema Applied**
   - Run `npx prisma migrate dev` from `backend/shared` directory

## Setup

1. **Install Dependencies**
   ```bash
   cd backend/scripts/migrate
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env and add your Firebase and PostgreSQL credentials
   ```

3. **Extract Firebase Credentials**

   From your Firebase service account JSON file, extract:
   ```json
   {
     "project_id": "your-project-id",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...",
     "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
   }
   ```

   Add to `.env`:
   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   ```

## Migration Steps

### Option 1: Run All Steps at Once

```bash
npm run migrate
```

This runs all three steps sequentially:
1. Export from Firebase
2. Transform data
3. Import to PostgreSQL

### Option 2: Run Steps Individually

**Step 1: Export from Firebase**
```bash
npm run export
```

Exports all Firestore collections to `data/*.json` files:
- `users.json` - All user documents
- `posts.json` - All post documents
- `follows.json` - All follow relationships
- `likes.json` - All like interactions
- `comments.json` - All comments
- `shares.json` - All share interactions

**Step 2: Transform Data**
```bash
npm run transform
```

Transforms Firebase data to match PostgreSQL schema:
- Converts Firebase timestamps to ISO strings
- Maps Firebase UIDs to PostgreSQL UUIDs
- Normalizes field names
- Validates data integrity

Creates transformed files: `data/*-transformed.json`

**Step 3: Import to PostgreSQL**
```bash
npm run import
```

Imports transformed data to PostgreSQL:
- Batch processing (100 records at a time)
- Progress tracking
- Error handling (continues on individual record failures)
- Foreign key constraint respecting

## Advanced Options

### Dry Run (Test Without Writing)

```bash
DRY_RUN=true npm run import
```

This will simulate the import without actually writing to the database.

### Custom Batch Size

```bash
BATCH_SIZE=50 npm run import
```

Useful if you're hitting memory or connection limits.

### Retry Failed Records

After a failed import, check `data/_import_summary.json` for errors:

```json
{
  "results": {
    "users": {
      "success": 95,
      "failed": 5,
      "errors": [
        {
          "item": "user-id-123",
          "error": "Unique constraint violation"
        }
      ]
    }
  }
}
```

You can manually fix issues or re-run specific collections.

## Data Validation

### Before Migration
- Verify Firebase connection: Check that export finds all collections
- Check record counts match expectations
- Backup Firebase data externally (Firebase Console > Firestore > Export)

### After Migration
- Compare record counts:
  ```sql
  SELECT 'users' as table_name, COUNT(*) as count FROM users
  UNION ALL
  SELECT 'posts', COUNT(*) FROM posts
  UNION ALL
  SELECT 'follows', COUNT(*) FROM follows
  UNION ALL
  SELECT 'likes', COUNT(*) FROM likes
  UNION ALL
  SELECT 'comments', COUNT(*) FROM comments
  UNION ALL
  SELECT 'shares', COUNT(*) FROM shares;
  ```

- Verify foreign key integrity:
  ```sql
  -- Check orphaned posts (posts without users)
  SELECT COUNT(*) FROM posts p
  LEFT JOIN users u ON p."userId" = u.id
  WHERE u.id IS NULL;

  -- Check orphaned likes
  SELECT COUNT(*) FROM likes l
  LEFT JOIN users u ON l."userId" = u.id
  WHERE u.id IS NULL;
  ```

- Test critical queries:
  ```sql
  -- Get user with their post count
  SELECT u.username, COUNT(p.id) as post_count
  FROM users u
  LEFT JOIN posts p ON u.id = p."userId"
  GROUP BY u.id, u.username
  LIMIT 10;
  ```

## Troubleshooting

### "Authentication Error" when exporting
- Check Firebase credentials in `.env`
- Ensure private key has proper newlines: `"-----BEGIN...\\n...\\n-----END..."`
- Verify service account has Firestore read permissions

### "Unique constraint violation" during import
- Some records may already exist in PostgreSQL
- Check if you've run the import before
- Use DRY_RUN first to identify issues

### "Foreign key constraint violation"
- Ensure users are imported before posts/follows/interactions
- Check that all referenced user IDs exist in users table
- Review transformation step for data integrity

### "Connection timeout" or "Out of memory"
- Reduce BATCH_SIZE: `BATCH_SIZE=50 npm run import`
- Import collections one at a time
- Increase PostgreSQL connection limits

### Data mismatch after migration
- Compare counts: Firebase console vs PostgreSQL queries
- Check transformation logic in `2-transform-data.js`
- Verify field mappings match your Firebase structure

## Roll Back

If you need to undo the migration:

```sql
-- WARNING: This deletes all data!
TRUNCATE shares, comments, likes, follows, posts, users CASCADE;
```

Then you can re-run the migration.

## Production Checklist

- [ ] Backup Firebase data (Firebase Console export)
- [ ] Backup PostgreSQL database (if not empty)
- [ ] Run migration in TEST environment first
- [ ] Verify data integrity after migration
- [ ] Test application functionality with new data
- [ ] Monitor application for errors after migration
- [ ] Keep Firebase running for 1-2 weeks as fallback
- [ ] Document any custom transformations needed

## Support

If you encounter issues:

1. Check `data/_export_summary.json` for export stats
2. Check `data/_transform_summary.json` for transformation stats
3. Check `data/_import_summary.json` for import errors
4. Review logs for specific error messages
5. Verify Firebase and PostgreSQL credentials

## Security Notes

- Never commit `.env` file to git
- Store Firebase service account key securely
- Rotate service account keys after migration
- Delete local `data/*.json` files after successful migration
- Use read-only Firebase service account if possible
