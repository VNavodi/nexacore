CREATE TABLE IF NOT EXISTS purchase_orders (
    id BIGSERIAL PRIMARY KEY,
    po_number VARCHAR(64) UNIQUE,
    supplier VARCHAR(255) NOT NULL,
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    delivery_address VARCHAR(255),
    payment_terms VARCHAR(100),
    internal_notes TEXT,
    supplier_instructions TEXT,
    terms_and_conditions TEXT,
    status VARCHAR(30) NOT NULL,
    subtotal DOUBLE PRECISION NOT NULL DEFAULT 0,
    tax DOUBLE PRECISION NOT NULL DEFAULT 0,
    grand_total DOUBLE PRECISION NOT NULL DEFAULT 0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_order_lines (
    id BIGSERIAL PRIMARY KEY,
    purchase_order_id BIGINT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    ordered_qty INTEGER NOT NULL,
    unit_cost DOUBLE PRECISION NOT NULL,
    expected_date DATE,
    received_qty INTEGER NOT NULL DEFAULT 0
);
