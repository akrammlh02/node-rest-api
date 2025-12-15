-- Add resources column to lessons table
-- This will store JSON array of resource objects with name and url
ALTER TABLE lessons ADD COLUMN resources TEXT DEFAULT NULL;

-- Example of how resources will be stored:
-- [{"name": "Course Notes.pdf", "url": "https://cloudinary.com/..."}, {"name": "Exercise Files", "url": "https://..."}]
