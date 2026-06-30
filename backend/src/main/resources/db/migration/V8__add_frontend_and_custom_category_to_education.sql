-- V8: Add FRONTEND type, custom_category, start_date, and end_date to education table
ALTER TABLE education DROP CONSTRAINT IF EXISTS education_type_check;
ALTER TABLE education ADD CONSTRAINT education_type_check CHECK (type IN ('PROGRAMMING', 'LANGUAGE', 'FRONTEND', 'MOBILE', 'OTHER'));

ALTER TABLE education ADD COLUMN custom_category VARCHAR(100);
ALTER TABLE education ADD COLUMN start_date DATE;
ALTER TABLE education ADD COLUMN end_date DATE;
