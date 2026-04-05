-- ============================================================
-- Migration 001: Initial Schema
-- Web POS System — Restaurant Point of Sale
-- Target: PostgreSQL (Supabase)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('OWNER', 'MANAGER', 'STAFF', 'KITCHEN');
CREATE TYPE table_status AS ENUM ('EMPTY', 'OCCUPIED', 'CLEANING');
CREATE TYPE menu_item_status AS ENUM ('ACTIVE', 'INACTIVE', 'SOLD_OUT');
CREATE TYPE order_status AS ENUM ('OPEN', 'CLOSED', 'CANCELLED');
CREATE TYPE payment_method AS ENUM ('CASH', 'CREDIT_CARD', 'LINE_PAY', 'JKOPAY', 'OTHER');

-- ============================================================
-- TABLES
-- ============================================================

-- Stores
CREATE TABLE stores (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name             VARCHAR(255) NOT NULL,
    address          TEXT,
    phone            VARCHAR(50),
    tax_rate         NUMERIC(5,4)  NOT NULL DEFAULT 0.05,
    service_charge_rate NUMERIC(5,4) NOT NULL DEFAULT 0.10,
    currency         VARCHAR(10)   NOT NULL DEFAULT 'TWD',
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- User Profiles (linked to Supabase Auth users)
CREATE TABLE user_profiles (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id        UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    store_id       UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name           VARCHAR(255) NOT NULL,
    employee_id    VARCHAR(50),
    role           user_role NOT NULL DEFAULT 'STAFF',
    phone          VARCHAR(50),
    email          VARCHAR(255),
    pin_hash       VARCHAR(255),
    hourly_rate    NUMERIC(10,2),
    monthly_salary NUMERIC(10,2),
    hire_date      DATE,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (store_id, employee_id)
);

-- Menu Categories
CREATE TABLE categories (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id   UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name       VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Menu Items
CREATE TABLE menu_items (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id    UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name        VARCHAR(255) NOT NULL,
    price       NUMERIC(10,2) NOT NULL,
    cost        NUMERIC(10,2),
    image_url   TEXT,
    description TEXT,
    status      menu_item_status NOT NULL DEFAULT 'ACTIVE',
    sort_order  INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Modifiers (modifier groups for a menu item, e.g. "Doneness", "Side Dish")
CREATE TABLE modifiers (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    name         VARCHAR(255) NOT NULL,
    is_required  BOOLEAN NOT NULL DEFAULT FALSE,
    is_multiple  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Modifier Options (individual choices within a modifier group)
CREATE TABLE modifier_options (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    modifier_id UUID NOT NULL REFERENCES modifiers(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    price       NUMERIC(10,2) NOT NULL DEFAULT 0,
    sort_order  INT NOT NULL DEFAULT 0
);

-- Table Areas (zones within the restaurant)
CREATE TABLE table_areas (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id   UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name       VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tables (physical dining tables)
CREATE TABLE tables (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id     UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    area_id      UUID REFERENCES table_areas(id) ON DELETE SET NULL,
    table_number VARCHAR(50) NOT NULL,
    capacity     INT NOT NULL DEFAULT 4,
    status       table_status NOT NULL DEFAULT 'EMPTY',
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id        UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    table_id        UUID REFERENCES tables(id) ON DELETE SET NULL,
    table_number    VARCHAR(50),                          -- snapshot at order creation
    staff_id        UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    pax_count       INT NOT NULL DEFAULT 1,
    status          order_status NOT NULL DEFAULT 'OPEN',
    note            TEXT,
    subtotal        NUMERIC(10,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    service_charge  NUMERIC(10,2) NOT NULL DEFAULT 0,
    tax             NUMERIC(10,2) NOT NULL DEFAULT 0,
    total           NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    closed_at       TIMESTAMP WITH TIME ZONE
);

-- Order Items
CREATE TABLE order_items (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id       UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id   UUID REFERENCES menu_items(id) ON DELETE SET NULL, -- nullable: item may be deleted
    menu_item_name VARCHAR(255) NOT NULL,                              -- snapshot
    quantity       INT NOT NULL,
    unit_price     NUMERIC(10,2) NOT NULL,
    subtotal       NUMERIC(10,2) NOT NULL,
    note           TEXT,
    is_completed   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Order Item Modifiers (selected modifier options per order item)
CREATE TABLE order_item_mods (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_item_id      UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    modifier_option_id UUID REFERENCES modifier_options(id) ON DELETE SET NULL, -- nullable: option may be deleted
    option_name        VARCHAR(255),                                             -- snapshot
    price              NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- Payments
CREATE TABLE payments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    staff_id        UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    method          payment_method NOT NULL,
    amount          NUMERIC(10,2) NOT NULL,
    received_amount NUMERIC(10,2),
    change_amount   NUMERIC(10,2),
    note            TEXT,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Clock Records (employee time tracking)
CREATE TABLE clock_records (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id          UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    store_id          UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    clock_in          TIMESTAMP WITH TIME ZONE NOT NULL,
    clock_out         TIMESTAMP WITH TIME ZONE,
    total_minutes     INT,
    is_manually_edited BOOLEAN NOT NULL DEFAULT FALSE,
    note              TEXT,
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Daily Reports
CREATE TABLE daily_reports (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id            UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    report_date         DATE NOT NULL,
    total_revenue       NUMERIC(12,2),
    total_orders        INT,
    avg_order_value     NUMERIC(10,2),
    cash_amount         NUMERIC(12,2),
    credit_card_amount  NUMERIC(12,2),
    line_pay_amount     NUMERIC(12,2),
    jkopay_amount       NUMERIC(12,2),
    other_amount        NUMERIC(12,2),
    total_discount      NUMERIC(12,2),
    is_settled          BOOLEAN NOT NULL DEFAULT FALSE,
    settled_at          TIMESTAMP WITH TIME ZONE,
    settled_by          UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (store_id, report_date)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- store_id lookups (most frequent access pattern)
CREATE INDEX idx_user_profiles_store_id    ON user_profiles(store_id);
CREATE INDEX idx_categories_store_id       ON categories(store_id);
CREATE INDEX idx_menu_items_store_id       ON menu_items(store_id);
CREATE INDEX idx_table_areas_store_id      ON table_areas(store_id);
CREATE INDEX idx_tables_store_id           ON tables(store_id);
CREATE INDEX idx_orders_store_id           ON orders(store_id);
CREATE INDEX idx_clock_records_store_id    ON clock_records(store_id);
CREATE INDEX idx_daily_reports_store_id    ON daily_reports(store_id);

-- status columns
CREATE INDEX idx_orders_status  ON orders(status);
CREATE INDEX idx_tables_status  ON tables(status);

-- relational lookups
CREATE INDEX idx_menu_items_category_id   ON menu_items(category_id);
CREATE INDEX idx_order_items_order_id     ON order_items(order_id);
CREATE INDEX idx_clock_records_staff_id   ON clock_records(staff_id);
CREATE INDEX idx_daily_reports_date       ON daily_reports(report_date);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_stores_updated_at
    BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_menu_items_updated_at
    BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_tables_updated_at
    BEFORE UPDATE ON tables
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on every table
ALTER TABLE stores             ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifiers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifier_options   ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_areas        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables             ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_mods    ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE clock_records      ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports      ENABLE ROW LEVEL SECURITY;

-- Helper function: returns the store_id for the currently authenticated user.
-- Returns NULL when there is no match (unauthenticated or no profile yet).
CREATE OR REPLACE FUNCTION auth_user_store_id()
RETURNS UUID AS $$
    SELECT store_id
    FROM   user_profiles
    WHERE  user_id = auth.uid()
    LIMIT  1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- -----------------------------------------------------------------
-- stores
-- Authenticated users may read/write only their own store row.
-- -----------------------------------------------------------------
CREATE POLICY "stores: own store only"
    ON stores
    FOR ALL
    TO authenticated
    USING  (id = auth_user_store_id())
    WITH CHECK (id = auth_user_store_id());

-- -----------------------------------------------------------------
-- user_profiles
-- -----------------------------------------------------------------
CREATE POLICY "user_profiles: own store only"
    ON user_profiles
    FOR ALL
    TO authenticated
    USING  (store_id = auth_user_store_id())
    WITH CHECK (store_id = auth_user_store_id());

-- -----------------------------------------------------------------
-- categories
-- -----------------------------------------------------------------
CREATE POLICY "categories: own store only"
    ON categories
    FOR ALL
    TO authenticated
    USING  (store_id = auth_user_store_id())
    WITH CHECK (store_id = auth_user_store_id());

-- -----------------------------------------------------------------
-- menu_items
-- -----------------------------------------------------------------
CREATE POLICY "menu_items: own store only"
    ON menu_items
    FOR ALL
    TO authenticated
    USING  (store_id = auth_user_store_id())
    WITH CHECK (store_id = auth_user_store_id());

-- -----------------------------------------------------------------
-- modifiers — scoped through menu_items
-- -----------------------------------------------------------------
CREATE POLICY "modifiers: own store only"
    ON modifiers
    FOR ALL
    TO authenticated
    USING (
        menu_item_id IN (
            SELECT id FROM menu_items WHERE store_id = auth_user_store_id()
        )
    )
    WITH CHECK (
        menu_item_id IN (
            SELECT id FROM menu_items WHERE store_id = auth_user_store_id()
        )
    );

-- -----------------------------------------------------------------
-- modifier_options — scoped through modifiers → menu_items
-- -----------------------------------------------------------------
CREATE POLICY "modifier_options: own store only"
    ON modifier_options
    FOR ALL
    TO authenticated
    USING (
        modifier_id IN (
            SELECT m.id
            FROM   modifiers m
            JOIN   menu_items mi ON mi.id = m.menu_item_id
            WHERE  mi.store_id = auth_user_store_id()
        )
    )
    WITH CHECK (
        modifier_id IN (
            SELECT m.id
            FROM   modifiers m
            JOIN   menu_items mi ON mi.id = m.menu_item_id
            WHERE  mi.store_id = auth_user_store_id()
        )
    );

-- -----------------------------------------------------------------
-- table_areas
-- -----------------------------------------------------------------
CREATE POLICY "table_areas: own store only"
    ON table_areas
    FOR ALL
    TO authenticated
    USING  (store_id = auth_user_store_id())
    WITH CHECK (store_id = auth_user_store_id());

-- -----------------------------------------------------------------
-- tables
-- -----------------------------------------------------------------
CREATE POLICY "tables: own store only"
    ON tables
    FOR ALL
    TO authenticated
    USING  (store_id = auth_user_store_id())
    WITH CHECK (store_id = auth_user_store_id());

-- -----------------------------------------------------------------
-- orders
-- -----------------------------------------------------------------
CREATE POLICY "orders: own store only"
    ON orders
    FOR ALL
    TO authenticated
    USING  (store_id = auth_user_store_id())
    WITH CHECK (store_id = auth_user_store_id());

-- -----------------------------------------------------------------
-- order_items — scoped through orders
-- -----------------------------------------------------------------
CREATE POLICY "order_items: own store only"
    ON order_items
    FOR ALL
    TO authenticated
    USING (
        order_id IN (
            SELECT id FROM orders WHERE store_id = auth_user_store_id()
        )
    )
    WITH CHECK (
        order_id IN (
            SELECT id FROM orders WHERE store_id = auth_user_store_id()
        )
    );

-- -----------------------------------------------------------------
-- order_item_mods — scoped through order_items → orders
-- -----------------------------------------------------------------
CREATE POLICY "order_item_mods: own store only"
    ON order_item_mods
    FOR ALL
    TO authenticated
    USING (
        order_item_id IN (
            SELECT oi.id
            FROM   order_items oi
            JOIN   orders o ON o.id = oi.order_id
            WHERE  o.store_id = auth_user_store_id()
        )
    )
    WITH CHECK (
        order_item_id IN (
            SELECT oi.id
            FROM   order_items oi
            JOIN   orders o ON o.id = oi.order_id
            WHERE  o.store_id = auth_user_store_id()
        )
    );

-- -----------------------------------------------------------------
-- payments — scoped through orders
-- -----------------------------------------------------------------
CREATE POLICY "payments: own store only"
    ON payments
    FOR ALL
    TO authenticated
    USING (
        order_id IN (
            SELECT id FROM orders WHERE store_id = auth_user_store_id()
        )
    )
    WITH CHECK (
        order_id IN (
            SELECT id FROM orders WHERE store_id = auth_user_store_id()
        )
    );

-- -----------------------------------------------------------------
-- clock_records
-- -----------------------------------------------------------------
CREATE POLICY "clock_records: own store only"
    ON clock_records
    FOR ALL
    TO authenticated
    USING  (store_id = auth_user_store_id())
    WITH CHECK (store_id = auth_user_store_id());

-- -----------------------------------------------------------------
-- daily_reports
-- -----------------------------------------------------------------
CREATE POLICY "daily_reports: own store only"
    ON daily_reports
    FOR ALL
    TO authenticated
    USING  (store_id = auth_user_store_id())
    WITH CHECK (store_id = auth_user_store_id());

-- Note: The Supabase service role key bypasses RLS automatically.
-- No explicit service-role policy is needed; service role always has full access.
