BEGIN;

-- 1. Add department membership.
-- NULL is allowed for Super Admin accounts.
ALTER TABLE users
    ADD COLUMN department_id BIGINT;

-- 2. Convert existing roles to the agreed role names.
-- The users table is currently empty, but this mapping also
-- supports a safe conversion if legacy accounts exist later.
ALTER TABLE users
    DROP CONSTRAINT users_role_check;

ALTER TABLE users
    ALTER COLUMN role DROP DEFAULT;

UPDATE users
SET role = CASE role
    WHEN 'admin' THEN 'department_admin'
    WHEN 'manager' THEN 'worker'
    WHEN 'staff' THEN 'worker'
    ELSE role
END;

ALTER TABLE users
    ADD CONSTRAINT users_role_check
    CHECK (
        role IN (
            'super_admin',
            'department_admin',
            'worker'
        )
    );

ALTER TABLE users
    ALTER COLUMN role SET DEFAULT 'worker';

-- 3. Ensure Super Admin has no department,
-- while Department Admins and Workers must belong to one.
ALTER TABLE users
    ADD CONSTRAINT users_role_department_check
    CHECK (
        (role = 'super_admin' AND department_id IS NULL)
        OR
        (
            role IN ('department_admin', 'worker')
            AND department_id IS NOT NULL
        )
    );

-- 4. Link users to departments.
ALTER TABLE users
    ADD CONSTRAINT users_department_fk
    FOREIGN KEY (department_id)
    REFERENCES departments(id)
    ON DELETE RESTRICT;

-- 5. Allow only one ACTIVE Department Admin per department.
CREATE UNIQUE INDEX users_one_active_department_admin_uq
    ON users (department_id)
    WHERE role = 'department_admin'
      AND is_active = TRUE;

COMMIT;
