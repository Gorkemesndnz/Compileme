-- V6: Add MOBILE education type constraint
ALTER TABLE education DROP CONSTRAINT IF EXISTS education_type_check;
ALTER TABLE education ADD CONSTRAINT education_type_check CHECK (type IN ('PROGRAMMING', 'LANGUAGE', 'MOBILE', 'OTHER'));
