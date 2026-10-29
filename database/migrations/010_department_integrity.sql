BEGIN;

-- 1. Add department ownership to transaction item tables.
ALTER TABLE purchase_items
    ADD COLUMN department_id BIGINT;

ALTER TABLE sale_items
    ADD COLUMN department_id BIGINT;

-- 2. Require department ownership for business records.
ALTER TABLE categories
    ALTER COLUMN department_id SET NOT NULL;

ALTER TABLE suppliers
    ALTER COLUMN department_id SET NOT NULL;

ALTER TABLE customers
    ALTER COLUMN department_id SET NOT NULL;

ALTER TABLE products
    ALTER COLUMN department_id SET NOT NULL;

ALTER TABLE purchases
    ALTER COLUMN department_id SET NOT NULL;

ALTER TABLE sales
    ALTER COLUMN department_id SET NOT NULL;

ALTER TABLE inventory_movements
    ALTER COLUMN department_id SET NOT NULL;

ALTER TABLE purchase_items
    ALTER COLUMN department_id SET NOT NULL;

ALTER TABLE sale_items
    ALTER COLUMN department_id SET NOT NULL;

-- 3. Create composite unique keys.
ALTER TABLE categories
    ADD CONSTRAINT categories_department_id_id_uq
    UNIQUE (department_id, id);

ALTER TABLE suppliers
    ADD CONSTRAINT suppliers_department_id_id_uq
    UNIQUE (department_id, id);

ALTER TABLE customers
    ADD CONSTRAINT customers_department_id_id_uq
    UNIQUE (department_id, id);

ALTER TABLE products
    ADD CONSTRAINT products_department_id_id_uq
    UNIQUE (department_id, id);

ALTER TABLE purchases
    ADD CONSTRAINT purchases_department_id_id_uq
    UNIQUE (department_id, id);

ALTER TABLE sales
    ADD CONSTRAINT sales_department_id_id_uq
    UNIQUE (department_id, id);

-- 4. Enforce department-safe product references.
ALTER TABLE products
    DROP CONSTRAINT products_category_id_fkey;

ALTER TABLE products
    DROP CONSTRAINT products_supplier_id_fkey;

ALTER TABLE products
    ADD CONSTRAINT products_department_category_fk
    FOREIGN KEY (department_id, category_id)
    REFERENCES categories (department_id, id)
    ON DELETE SET NULL (category_id);

ALTER TABLE products
    ADD CONSTRAINT products_department_supplier_fk
    FOREIGN KEY (department_id, supplier_id)
    REFERENCES suppliers (department_id, id)
    ON DELETE SET NULL (supplier_id);

-- 5. Enforce department-safe purchase and sale references.
ALTER TABLE purchases
    DROP CONSTRAINT purchases_supplier_id_fkey;

ALTER TABLE purchases
    ADD CONSTRAINT purchases_department_supplier_fk
    FOREIGN KEY (department_id, supplier_id)
    REFERENCES suppliers (department_id, id)
    ON DELETE SET NULL (supplier_id);

ALTER TABLE sales
    DROP CONSTRAINT sales_customer_id_fkey;

ALTER TABLE sales
    ADD CONSTRAINT sales_department_customer_fk
    FOREIGN KEY (department_id, customer_id)
    REFERENCES customers (department_id, id)
    ON DELETE SET NULL (customer_id);

-- 6. Enforce department-safe purchase items.
ALTER TABLE purchase_items
    DROP CONSTRAINT purchase_items_product_id_fkey;

ALTER TABLE purchase_items
    DROP CONSTRAINT purchase_items_purchase_id_fkey;

ALTER TABLE purchase_items
    ADD CONSTRAINT purchase_items_department_fk
    FOREIGN KEY (department_id)
    REFERENCES departments (id)
    ON DELETE RESTRICT;

ALTER TABLE purchase_items
    ADD CONSTRAINT purchase_items_department_product_fk
    FOREIGN KEY (department_id, product_id)
    REFERENCES products (department_id, id)
    ON DELETE RESTRICT;

ALTER TABLE purchase_items
    ADD CONSTRAINT purchase_items_department_purchase_fk
    FOREIGN KEY (department_id, purchase_id)
    REFERENCES purchases (department_id, id)
    ON DELETE CASCADE;

-- 7. Enforce department-safe sale items.
ALTER TABLE sale_items
    DROP CONSTRAINT sale_items_product_id_fkey;

ALTER TABLE sale_items
    DROP CONSTRAINT sale_items_sale_id_fkey;

ALTER TABLE sale_items
    ADD CONSTRAINT sale_items_department_fk
    FOREIGN KEY (department_id)
    REFERENCES departments (id)
    ON DELETE RESTRICT;

ALTER TABLE sale_items
    ADD CONSTRAINT sale_items_department_product_fk
    FOREIGN KEY (department_id, product_id)
    REFERENCES products (department_id, id)
    ON DELETE RESTRICT;

ALTER TABLE sale_items
    ADD CONSTRAINT sale_items_department_sale_fk
    FOREIGN KEY (department_id, sale_id)
    REFERENCES sales (department_id, id)
    ON DELETE CASCADE;

-- 8. Enforce department-safe inventory movements.
ALTER TABLE inventory_movements
    DROP CONSTRAINT inventory_movements_product_id_fkey;

ALTER TABLE inventory_movements
    ADD CONSTRAINT inventory_movements_department_product_fk
    FOREIGN KEY (department_id, product_id)
    REFERENCES products (department_id, id)
    ON DELETE RESTRICT;

-- 9. Make invoice uniqueness department-scoped.
ALTER TABLE sales
    DROP CONSTRAINT sales_invoice_number_key;

ALTER TABLE sales
    ADD CONSTRAINT sales_department_invoice_uq
    UNIQUE (department_id, invoice_number);

COMMIT;
