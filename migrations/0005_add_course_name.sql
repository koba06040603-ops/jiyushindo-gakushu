-- Add course_name column to courses table
ALTER TABLE courses ADD COLUMN course_name TEXT;

-- Add description column to courses table
ALTER TABLE courses ADD COLUMN description TEXT;

-- Add color_code column to courses table
ALTER TABLE courses ADD COLUMN color_code TEXT;

-- Update existing courses with default values based on course_level
UPDATE courses SET course_name = 
  CASE course_level
    WHEN 'basic' THEN 'ゆっくりコース'
    WHEN 'standard' THEN 'しっかりコース'
    WHEN 'advanced' THEN 'どんどんコース'
    ELSE 'コース'
  END
WHERE course_name IS NULL;

UPDATE courses SET description = selection_question_content WHERE description IS NULL;
UPDATE courses SET color_code = 
  CASE course_level
    WHEN 'basic' THEN 'green'
    WHEN 'standard' THEN 'blue'
    WHEN 'advanced' THEN 'purple'
    ELSE 'gray'
  END
WHERE color_code IS NULL;
