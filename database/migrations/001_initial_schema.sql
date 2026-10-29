-- ============================================
-- MyAayaam - Initial MVP Database Schema
-- PostgreSQL
-- ============================================


-- ============================================
-- 1. USERS
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(150) UNIQUE NOT NULL,

    password_hash TEXT NOT NULL,

    role VARCHAR(30) NOT NULL DEFAULT 'staff'
        CHECK (role IN ('admin', 'manager', 'staff')),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- 2. CATEGORIES
-- ============================================

CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL UNIQUE,

    description TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- 3. SUPPLIERS
-- ============================================

CREATE TABLE IF NOT EXISTS suppliers (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(150) NOT NULL,

    contact_person VARCHAR(100),

    phone VARCHAR(20),

    email VARCHAR(150),

    address TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- 4. PRODUCTS
-- ============================================

CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(200) NOT NULL,

    sku VARCHAR(100) NOT NULL UNIQUE,

    barcode VARCHAR(100) UNIQUE,

    category_id BIGINT
        REFERENCES categories(id)
        ON DELETE SET NULL,

    supplier_id BIGINT
        REFERENCES suppliers(id)
        ON DELETE SET NULL,

    description TEXT,

    purchase_price NUMERIC(12, 2) NOT NULL DEFAULT 0
        CHECK (purchase_price >= 0),

    selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0
        CHECK (selling_price >= 0),

    quantity INTEGER NOT NULL DEFAULT 0
        CHECK (quantity >= 0),

    reorder_level INTEGER NOT NULL DEFAULT 5
        CHECK (reorder_level >= 0),

    unit VARCHAR(30) NOT NULL DEFAULT 'piece',

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- 5. CUSTOMERS
-- ============================================

CREATE TABLE IF NOT EXISTS customers (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(150) NOT NULL,

    phone VARCHAR(20),

    email VARCHAR(150),

    address TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- 6. PURCHASES
-- ============================================

CREATE TABLE IF NOT EXISTS purchases (
    id BIGSERIAL PRIMARY KEY,

    supplier_id BIGINT
        REFERENCES suppliers(id)
        ON DELETE SET NULL,

    invoice_number VARCHAR(100),

    purchase_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0
        CHECK (total_amount >= 0),

    status VARCHAR(30) NOT NULL DEFAULT 'completed'
        CHECK (status IN ('pending', 'completed', 'cancelled')),

    created_by BIGINT
        REFERENCES users(id)
        ON DELETE SET NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- 7. PURCHASE ITEMS
-- Products inside each purchase
-- ============================================

CREATE TABLE IF NOT EXISTS purchase_items (
    id BIGSERIAL PRIMARY KEY,

    purchase_id BIGINT NOT NULL
        REFERENCES purchases(id)
        ON DELETE CASCADE,

    product_id BIGINT NOT NULL
        REFERENCES products(id)
        ON DELETE RESTRICT,

    quantity INTEGER NOT NULL
        CHECK (quantity > 0),

    unit_price NUMERIC(12, 2) NOT NULL
        CHECK (unit_price >= 0),

    total_price NUMERIC(12, 2) NOT NULL
        CHECK (total_price >= 0),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- 8. SALES
-- ============================================

CREATE TABLE IF NOT EXISTS sales (
    id BIGSERIAL PRIMARY KEY,

    customer_id BIGINT
        REFERENCES customers(id)
        ON DELETE SET NULL,

    invoice_number VARCHAR(100) UNIQUE,

    sale_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0
        CHECK (total_amount >= 0),

    payment_status VARCHAR(30) NOT NULL DEFAULT 'paid'
        CHECK (payment_status IN ('paid', 'pending', 'partial')),

    created_by BIGINT
        REFERENCES users(id)
        ON DELETE SET NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- 9. SALE ITEMS
-- Products inside each sale
-- ============================================

CREATE TABLE IF NOT EXISTS sale_items (
    id BIGSERIAL PRIMARY KEY,

    sale_id BIGINT NOT NULL
        REFERENCES sales(id)
        ON DELETE CASCADE,

    product_id BIGINT NOT NULL
        REFERENCES products(id)
        ON DELETE RESTRICT,

    quantity INTEGER NOT NULL
        CHECK (quantity > 0),

    unit_price NUMERIC(12, 2) NOT NULL
        CHECK (unit_price >= 0),

    total_price NUMERIC(12, 2) NOT NULL
        CHECK (total_price >= 0),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- 10. INVENTORY MOVEMENTS
-- Complete stock history
-- ============================================

CREATE TABLE IF NOT EXISTS inventory_movements (
    id BIGSERIAL PRIMARY KEY,

    product_id BIGINT NOT NULL
        REFERENCES products(id)
        ON DELETE RESTRICT,

    movement_type VARCHAR(30) NOT NULL
        CHECK (
            movement_type IN (
                'purchase',
                'sale',
                'adjustment',
                'return'
            )
        ),

    quantity INTEGER NOT NULL,

    reference_type VARCHAR(50),

    reference_id BIGINT,

    notes TEXT,

    created_by BIGINT
        REFERENCES users(id)
        ON DELETE SET NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- INDEXES
-- Improve query performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_category
ON products(category_id);


CREATE INDEX IF NOT EXISTS idx_products_supplier
ON products(supplier_id);


CREATE INDEX IF NOT EXISTS idx_products_sku
ON products(sku);


CREATE INDEX IF NOT EXISTS idx_inventory_movements_product
ON inventory_movements(product_id);


CREATE INDEX IF NOT EXISTS idx_purchases_supplier
ON purchases(supplier_id);


CREATE INDEX IF NOT EXISTS idx_sales_customer
ON sales(customer_id);


CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase
ON purchase_items(purchase_id);


CREATE INDEX IF NOT EXISTS idx_sale_items_sale
ON sale_items(sale_id);


-- ============================================
-- UPDATED_AT AUTOMATION
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- USERS TRIGGER
-- ============================================

DROP TRIGGER IF EXISTS update_users_updated_at ON users;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- CATEGORIES TRIGGER
-- ============================================

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;

CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- SUPPLIERS TRIGGER
-- ============================================

DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;

CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON suppliers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- PRODUCTS TRIGGER
-- ============================================

DROP TRIGGER IF EXISTS update_products_updated_at ON products;

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- CUSTOMERS TRIGGER
-- ============================================

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;

CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON customers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- PURCHASES TRIGGER
-- ============================================

DROP TRIGGER IF EXISTS update_purchases_updated_at ON purchases;

CREATE TRIGGER update_purchases_updated_at
BEFORE UPDATE ON purchases
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- SALES TRIGGER
-- ============================================

DROP TRIGGER IF EXISTS update_sales_updated_at ON sales;

CREATE TRIGGER update_sales_updated_at
BEFORE UPDATE ON sales
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- INITIAL ADMIN USER
-- Password should be inserted later through
-- the application with bcrypt hashing.
-- ============================================
