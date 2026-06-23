ALTER TABLE project_snippet DROP CONSTRAINT IF EXISTS project_snippet_category_check;
ALTER TABLE project_snippet ADD CONSTRAINT project_snippet_category_check CHECK (category IN ('FRONTEND', 'BACKEND', 'DATABASE', 'OTHER'));
