# Database Cleanup Report - DevAcademy

## ✅ Tables Analysis Complete

### 🗑️ **SAFE TO DELETE** (Not Used in Code)

These tables have **NO references** in your JavaScript code and can be safely deleted:

1. **`teachers`** - No usage found
   - Originally for teacher management
   - Not implemented in current system

2. **`course_analytics`** - No usage found
   - Was for tracking course statistics
   - Empty table, never used

3. **`skills`** - No usage found
   - Was for storing course skills
   - Replaced by inline skills in courses table

4. **`user_results`** - No usage found
   - Old quiz results table
   - Replaced by `quiz_attempts` and `quiz_sessions`

5. **`ad_spending`** - No usage found
   - Old ad spending tracking
   - You use `ad_campaigns` instead

### ⚠️ **KEEP FOR NOW** (Will be replaced after backend update)

These tables are currently used but will be replaced by new interactive tables:

1. **`learning_paths`** → Will become `interactive_roadmaps`
2. **`path_lessons`** → Will become `interactive_roadmap_lessons`
3. **`code_submissions`** → Will become `interactive_code_submissions`

**Note:** Keep these until you update your backend code to use the new tables.

### ✅ **KEEP** (Actively Used)

These tables are actively used and should NOT be deleted:

1. **`certificates`** - Used for course certificates (7 references)
2. **`youtube_tokens`** - Used for YouTube integration (3 references)
3. **`lessons`** - Contains ALL lessons (video + interactive)
4. **`progress`** - Tracks progress for ALL lesson types
5. **`courses`** - Core course data
6. **`client`** - User accounts
7. **`purchases`** - Purchase records
8. **`payments`** - Payment tracking
9. **`quizzes`** - Quiz questions
10. **`quiz_sessions`** - Quiz session tracking
11. **`quiz_attempts`** - Quiz answers
12. **`admin`** - Admin accounts
13. **`chapters`** - Course chapters
14. **`payment_info`** - Payment methods
15. **`payment_proofs`** - Payment receipts
16. **`ad_campaigns`** - Ad campaign tracking

---

## 📋 Migration Steps

### Step 1: Run Migration Script
```bash
# Execute the migration script
mysql -u your_user -p railway < config/migrate_to_interactive_tables.sql
```

### Step 2: Verify Migration
Check the verification queries at the end of the migration script to ensure all data was transferred correctly.

### Step 3: Update Backend Code
Update your `routes/interactive.js` and related files to use the new tables:
- `interactive_roadmaps` instead of `learning_paths`
- `interactive_lessons` instead of `lessons` (for interactive only)
- `interactive_code_submissions` instead of `code_submissions`
- `interactive_user_progress` instead of `progress` (for interactive only)

### Step 4: Delete Unused Tables
After verifying everything works, run:

```sql
DROP TABLE IF EXISTS `teachers`;
DROP TABLE IF EXISTS `course_analytics`;
DROP TABLE IF EXISTS `skills`;
DROP TABLE IF EXISTS `user_results`;
DROP TABLE IF EXISTS `ad_spending`;
```

### Step 5: Clean Up Old Interactive Data (Optional)
After backend is updated and tested, you can optionally clean up the old data:

```sql
-- Remove interactive lessons from lessons table
DELETE FROM lessons WHERE lesson_type = 'interactive_code';

-- Remove interactive path links
DELETE pl FROM path_lessons pl
INNER JOIN lessons l ON pl.lesson_id = l.lesson_id
WHERE l.lesson_type = 'interactive_code';

-- Remove interactive code submissions
DELETE cs FROM code_submissions cs
INNER JOIN lessons l ON cs.lesson_id = l.lesson_id
WHERE l.lesson_type = 'interactive_code';
```

---

## 📊 Expected Results

After migration, you should have:
- **4 roadmaps** migrated to `interactive_roadmaps`
- **~50+ lessons** migrated to `interactive_lessons`
- **~160+ roadmap-lesson links** migrated
- **~70+ code submissions** migrated
- **~65+ progress records** migrated

---

## 🔒 Safety Notes

1. **Backup first!** Always backup your database before running migration scripts
2. **Test in development** Run migration on a test database first
3. **Verify counts** Check that all data was migrated correctly
4. **Update code gradually** Update backend routes one at a time
5. **Keep old tables** Don't delete old tables until new system is fully tested

---

## 🎯 Benefits of New Structure

✅ **Separation** - Interactive content separate from video courses
✅ **Performance** - Dedicated indexes for interactive queries
✅ **Scalability** - Easier to add new interactive features
✅ **Clarity** - Clear data model for interactive learning
✅ **Flexibility** - Can add roadmap-specific features easily
