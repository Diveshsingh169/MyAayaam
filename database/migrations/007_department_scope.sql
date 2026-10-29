BEGIN;

-- Add department ownership to all department-scoped tables.
ALTER TABLE categories
    ADD COLUMN department_id BIGINT;

ALTER TABLE suppliers
    ADD COLUMN department_id BIGINT;

ALTER TABLE customers
    ADD COLUMN department_id BIGINT;

ALTER TABLE products
    ADD COLUMN department_id BIGINT;

ALTER TABLE purchases
    ADD COLUMN department_id BIGINT;

ALTER TABLE sales
    ADD COLUMN department_id BIGINT;

ALTER TABLE inventory_movements
    ADD COLUMN department_id BIGINT;

-- Add department foreign keys.
ALTER TABLE categories
    ADD CONSTRAINT categories_department_fk
    FOREIGN KEY (department_id)
    REFERENCES departments(id)
    ON DELETE RESTRICT;

ALTER TABLE suppliers
    ADD CONSTRAINT suppliers_department_fk
    FOREIGN KEY (department_id)
    REFERENCES departments(id)
    ON DELETE RESTRICT;

ALTER TABLE customers
    ADD CONSTRAINT customers_department_fk
    FOREIGN KEY (department_id)
    REFERENCES departments(id)
    ON DELETE RESTRICT;

ALTER TABLE products
    ADD CONSTRAINT products_department_fk
    FOREIGN KEY (department_id)
    REFERENCES departments(id)
    ON DELETE RESTRICT;

ALTER TABLE purchases
    ADD CONSTRAINT purchases_department_fk
    FOREIGN KEY (department_id)
    REFERENCES departments(id)
    ON DELETE RESTRICT;

ALTER TABLE sales
    ADD CONSTRAINT sales_department_fk
    FOREIGN KEY (department_id)
    REFERENCES departments(id)
    ON DELETE RESTRICT;

ALTER TABLE inventory_movements
    ADD CONSTRAINT inventory_movements_department_fk
    FOREIGN KEY (department_id)
    REFERENCES departments(id)
    ON DELETE RESTRICT;

COMMIT;
