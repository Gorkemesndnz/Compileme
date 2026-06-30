-- V7: Add duration and description to education table
ALTER TABLE education ADD COLUMN duration_hours INT;
ALTER TABLE education ADD COLUMN description TEXT;
