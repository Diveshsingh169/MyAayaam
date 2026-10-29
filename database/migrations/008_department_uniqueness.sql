BEGIN;

-- A product SKU is unique within its department.
-- Multiple departments may use the same SKU.
ALTER TABLE products
    DROP CONSTRAINT IF EXISTS products_sku_key;

DROP INDEX IF EXISTS idx_products_sku;

CREATE UNIQUE INDEX products_department_sku_uq
    ON products (department_id, sku);

-- Barcodes are optional, but must be unique within a department
-- whenever a barcode is supplied.
ALTER TABLE products
    DROP CONSTRAINT IF EXISTS products_barcode_key;

CREATE UNIQUE INDEX products_department_barcode_uq
    ON products (department_id, barcode)
    WHERE barcode IS NOT NULL;

-- Category names are unique within each department.
ALTER TABLE categories
    DROP CONSTRAINT IF EXISTS categories_name_key;

ALTER TABLE categories
    ADD CONSTRAINT categories_department_name_uq
    UNIQUE (department_id, name);

COMMIT;
