CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    sku VARCHAR(100),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    cost_price DOUBLE PRECISION,
    selling_price DOUBLE PRECISION,
     reorder_level INTEGER,
    stock_on_hand INTEGER NOT NULL DEFAULT 0
);
    