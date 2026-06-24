ALTER TABLE education_practice
    ADD COLUMN resource_id BIGINT;

ALTER TABLE education_practice
    ADD CONSTRAINT fk_education_practice_resource
    FOREIGN KEY (resource_id)
    REFERENCES education_resource(id)
    ON DELETE SET NULL;

CREATE INDEX idx_edu_practice_resource ON education_practice (resource_id);
