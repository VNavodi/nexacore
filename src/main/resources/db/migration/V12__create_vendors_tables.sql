CREATE TABLE IF NOT EXISTS vendors (
    id BIGSERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    account_name VARCHAR(255),
    bank_name VARCHAR(255),
    branch_name VARCHAR(255),
    account_number VARCHAR(100),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendor_supplied_products (
    id BIGSERIAL PRIMARY KEY,
    vendor_id BIGINT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vendor_supplied_products_vendor_id ON vendor_supplied_products(vendor_id);
