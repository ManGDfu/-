SET NOCOUNT ON;

/*
Optional:
CREATE DATABASE PreMadeFoodDB;
GO
USE PreMadeFoodDB;
GO
*/


/* Security domain */
CREATE TABLE dbo.sys_role (
    role_id         VARCHAR(20)  NOT NULL PRIMARY KEY,
    role_name       NVARCHAR(50) NOT NULL,
    permission_desc NVARCHAR(200) NULL
);

CREATE TABLE dbo.sys_user (
    user_id         VARCHAR(20)   NOT NULL PRIMARY KEY,
    role_id         VARCHAR(20)   NOT NULL,
    username        VARCHAR(50)   NOT NULL,
    login_password  VARCHAR(100)  NOT NULL,
    real_name       NVARCHAR(50)  NOT NULL,
    contact_phone   VARCHAR(20)   NOT NULL,
    CONSTRAINT uq_sys_user_username UNIQUE (username),
    CONSTRAINT fk_sys_user_role FOREIGN KEY (role_id) REFERENCES dbo.sys_role(role_id)
);

/* Procurement domain */
CREATE TABLE dbo.supplier (
    supplier_id     VARCHAR(20)   NOT NULL PRIMARY KEY,
    supplier_name   NVARCHAR(100) NOT NULL,
    contact_person  NVARCHAR(50)  NOT NULL,
    contact_phone   VARCHAR(20)   NOT NULL,
    address         NVARCHAR(200) NOT NULL,
    CONSTRAINT uq_supplier_name UNIQUE (supplier_name)
);

CREATE TABLE dbo.ingredient (
    ingredient_id    VARCHAR(20)   NOT NULL PRIMARY KEY,
    ingredient_name  NVARCHAR(100) NOT NULL,
    unit             NVARCHAR(20)  NOT NULL,
    category         NVARCHAR(50)  NOT NULL,
    shelf_life_days  INT           NOT NULL,
    CONSTRAINT ck_ingredient_shelf_life CHECK (shelf_life_days > 0)
);

CREATE TABLE dbo.purchase_order (
    purchase_order_id   VARCHAR(20)   NOT NULL PRIMARY KEY,
    supplier_id         VARCHAR(20)   NOT NULL,
    order_date          DATE          NOT NULL,
    order_total_amount  DECIMAL(12,2) NOT NULL DEFAULT (0),
    order_status        VARCHAR(20)   NOT NULL,
    CONSTRAINT ck_purchase_order_total CHECK (order_total_amount >= 0),
    CONSTRAINT ck_purchase_order_status CHECK (order_status IN ('PENDING','APPROVED','COMPLETED','CANCELLED')),
    CONSTRAINT fk_purchase_order_supplier FOREIGN KEY (supplier_id) REFERENCES dbo.supplier(supplier_id)
);

CREATE TABLE dbo.purchase_detail (
    purchase_detail_id   VARCHAR(20)   NOT NULL PRIMARY KEY,
    purchase_order_id    VARCHAR(20)   NOT NULL,
    ingredient_id        VARCHAR(20)   NOT NULL,
    purchase_qty         DECIMAL(12,2) NOT NULL,
    purchase_unit_price  DECIMAL(12,2) NOT NULL,
    CONSTRAINT ck_purchase_detail_qty CHECK (purchase_qty > 0),
    CONSTRAINT ck_purchase_detail_price CHECK (purchase_unit_price > 0),
    CONSTRAINT uq_purchase_order_ingredient UNIQUE (purchase_order_id, ingredient_id),
    CONSTRAINT fk_purchase_detail_order FOREIGN KEY (purchase_order_id) REFERENCES dbo.purchase_order(purchase_order_id),
    CONSTRAINT fk_purchase_detail_ingredient FOREIGN KEY (ingredient_id) REFERENCES dbo.ingredient(ingredient_id)
);

/* Warehouse domain */
CREATE TABLE dbo.warehouse (
    warehouse_id        VARCHAR(20)   NOT NULL PRIMARY KEY,
    warehouse_name      NVARCHAR(100) NOT NULL,
    warehouse_location  NVARCHAR(200) NOT NULL,
    warehouse_capacity  DECIMAL(12,2) NOT NULL,
    temperature_type    VARCHAR(20)   NOT NULL,
    CONSTRAINT ck_warehouse_capacity CHECK (warehouse_capacity > 0),
    CONSTRAINT ck_warehouse_temp CHECK (temperature_type IN ('FROZEN','CHILLED','NORMAL')),
    CONSTRAINT uq_warehouse_name UNIQUE (warehouse_name)
);

CREATE TABLE dbo.inventory (
    inventory_id      VARCHAR(20)   NOT NULL PRIMARY KEY,
    warehouse_id      VARCHAR(20)   NOT NULL,
    ingredient_id     VARCHAR(20)   NOT NULL,
    stock_qty         DECIMAL(12,2) NOT NULL,
    production_date   DATE          NOT NULL,
    expiry_date       DATE          NOT NULL,
    safety_stock      DECIMAL(12,2) NOT NULL,
    CONSTRAINT ck_inventory_stock CHECK (stock_qty >= 0),
    CONSTRAINT ck_inventory_safety CHECK (safety_stock >= 0),
    CONSTRAINT ck_inventory_date CHECK (expiry_date >= production_date),
    CONSTRAINT fk_inventory_warehouse FOREIGN KEY (warehouse_id) REFERENCES dbo.warehouse(warehouse_id),
    CONSTRAINT fk_inventory_ingredient FOREIGN KEY (ingredient_id) REFERENCES dbo.ingredient(ingredient_id)
);

CREATE TABLE dbo.transfer_order (
    transfer_order_id    VARCHAR(20) NOT NULL PRIMARY KEY,
    source_warehouse_id  VARCHAR(20) NOT NULL,
    target_warehouse_id  VARCHAR(20) NOT NULL,
    transfer_date        DATE        NOT NULL,
    transfer_type        VARCHAR(20) NOT NULL,
    CONSTRAINT ck_transfer_type CHECK (transfer_type IN ('BALANCE','EMERGENCY','REPLENISH')),
    CONSTRAINT ck_transfer_diff_warehouse CHECK (source_warehouse_id <> target_warehouse_id),
    CONSTRAINT fk_transfer_source FOREIGN KEY (source_warehouse_id) REFERENCES dbo.warehouse(warehouse_id),
    CONSTRAINT fk_transfer_target FOREIGN KEY (target_warehouse_id) REFERENCES dbo.warehouse(warehouse_id)
);

CREATE TABLE dbo.transfer_detail (
    transfer_detail_id  VARCHAR(20)   NOT NULL PRIMARY KEY,
    transfer_order_id   VARCHAR(20)   NOT NULL,
    ingredient_id       VARCHAR(20)   NOT NULL,
    transfer_qty        DECIMAL(12,2) NOT NULL,
    CONSTRAINT ck_transfer_qty CHECK (transfer_qty > 0),
    CONSTRAINT uq_transfer_order_ingredient UNIQUE (transfer_order_id, ingredient_id),
    CONSTRAINT fk_transfer_detail_order FOREIGN KEY (transfer_order_id) REFERENCES dbo.transfer_order(transfer_order_id),
    CONSTRAINT fk_transfer_detail_ingredient FOREIGN KEY (ingredient_id) REFERENCES dbo.ingredient(ingredient_id)
);

/* Production domain */
CREATE TABLE dbo.factory (
    factory_id        VARCHAR(20)   NOT NULL PRIMARY KEY,
    factory_name      NVARCHAR(100) NOT NULL,
    factory_location  NVARCHAR(200) NOT NULL,
    manager_name      NVARCHAR(50)  NOT NULL,
    contact_phone     VARCHAR(20)   NOT NULL
);

CREATE TABLE dbo.product (
    product_id         VARCHAR(20)   NOT NULL PRIMARY KEY,
    product_name       NVARCHAR(100) NOT NULL,
    product_category   NVARCHAR(50)  NOT NULL,
    sales_price        DECIMAL(12,2) NOT NULL,
    shelf_life_days    INT           NOT NULL,
    CONSTRAINT ck_product_price CHECK (sales_price > 0),
    CONSTRAINT ck_product_shelf_life CHECK (shelf_life_days > 0),
    CONSTRAINT uq_product_name UNIQUE (product_name)
);

CREATE TABLE dbo.recipe (
    recipe_id       VARCHAR(20)   NOT NULL PRIMARY KEY,
    product_id      VARCHAR(20)   NOT NULL,
    recipe_name     NVARCHAR(100) NOT NULL,
    recipe_version  VARCHAR(20)   NOT NULL,
    CONSTRAINT fk_recipe_product FOREIGN KEY (product_id) REFERENCES dbo.product(product_id),
    CONSTRAINT uq_recipe_product_version UNIQUE (product_id, recipe_version)
);

CREATE TABLE dbo.recipe_ingredient (
    recipe_id        VARCHAR(20)   NOT NULL,
    ingredient_id    VARCHAR(20)   NOT NULL,
    ingredient_qty   DECIMAL(12,2) NOT NULL,
    CONSTRAINT pk_recipe_ingredient PRIMARY KEY (recipe_id, ingredient_id),
    CONSTRAINT ck_recipe_ingredient_qty CHECK (ingredient_qty > 0),
    CONSTRAINT fk_recipe_ingredient_recipe FOREIGN KEY (recipe_id) REFERENCES dbo.recipe(recipe_id),
    CONSTRAINT fk_recipe_ingredient_ingredient FOREIGN KEY (ingredient_id) REFERENCES dbo.ingredient(ingredient_id)
);

CREATE TABLE dbo.work_order (
    work_order_id     VARCHAR(20)   NOT NULL PRIMARY KEY,
    factory_id        VARCHAR(20)   NOT NULL,
    product_id        VARCHAR(20)   NOT NULL,
    recipe_id         VARCHAR(20)   NOT NULL,
    production_date   DATE          NOT NULL,
    production_qty    DECIMAL(12,2) NOT NULL,
    CONSTRAINT ck_work_order_qty CHECK (production_qty > 0),
    CONSTRAINT fk_work_order_factory FOREIGN KEY (factory_id) REFERENCES dbo.factory(factory_id),
    CONSTRAINT fk_work_order_product FOREIGN KEY (product_id) REFERENCES dbo.product(product_id),
    CONSTRAINT fk_work_order_recipe FOREIGN KEY (recipe_id) REFERENCES dbo.recipe(recipe_id)
);

/* Sales domain */
CREATE TABLE dbo.store (
    store_id        VARCHAR(20)   NOT NULL PRIMARY KEY,
    store_name      NVARCHAR(100) NOT NULL,
    store_address   NVARCHAR(200) NOT NULL,
    store_manager   NVARCHAR(50)  NOT NULL,
    contact_phone   VARCHAR(20)   NOT NULL,
    CONSTRAINT uq_store_name UNIQUE (store_name)
);

CREATE TABLE dbo.sales_order (
    sales_order_id      VARCHAR(20)   NOT NULL PRIMARY KEY,
    store_id            VARCHAR(20)   NOT NULL,
    order_date          DATE          NOT NULL,
    order_total_amount  DECIMAL(12,2) NOT NULL DEFAULT (0),
    order_status        VARCHAR(20)   NOT NULL,
    CONSTRAINT ck_sales_order_total CHECK (order_total_amount >= 0),
    CONSTRAINT ck_sales_order_status CHECK (order_status IN ('PENDING','PAID','SHIPPED','COMPLETED','CANCELLED')),
    CONSTRAINT fk_sales_order_store FOREIGN KEY (store_id) REFERENCES dbo.store(store_id)
);

CREATE TABLE dbo.sales_detail (
    sales_detail_id    VARCHAR(20)   NOT NULL PRIMARY KEY,
    sales_order_id     VARCHAR(20)   NOT NULL,
    product_id         VARCHAR(20)   NOT NULL,
    sales_qty          DECIMAL(12,2) NOT NULL,
    sales_unit_price   DECIMAL(12,2) NOT NULL,
    CONSTRAINT ck_sales_detail_qty CHECK (sales_qty > 0),
    CONSTRAINT ck_sales_detail_price CHECK (sales_unit_price > 0),
    CONSTRAINT uq_sales_order_product UNIQUE (sales_order_id, product_id),
    CONSTRAINT fk_sales_detail_order FOREIGN KEY (sales_order_id) REFERENCES dbo.sales_order(sales_order_id),
    CONSTRAINT fk_sales_detail_product FOREIGN KEY (product_id) REFERENCES dbo.product(product_id)
);

/* Indexes */
CREATE INDEX ix_purchase_order_supplier ON dbo.purchase_order(supplier_id);
CREATE INDEX ix_purchase_detail_order ON dbo.purchase_detail(purchase_order_id);
CREATE INDEX ix_purchase_detail_ingredient ON dbo.purchase_detail(ingredient_id);

CREATE INDEX ix_inventory_warehouse ON dbo.inventory(warehouse_id);
CREATE INDEX ix_inventory_ingredient ON dbo.inventory(ingredient_id);
CREATE INDEX ix_transfer_order_source ON dbo.transfer_order(source_warehouse_id);
CREATE INDEX ix_transfer_order_target ON dbo.transfer_order(target_warehouse_id);
CREATE INDEX ix_transfer_detail_order ON dbo.transfer_detail(transfer_order_id);

CREATE INDEX ix_recipe_product ON dbo.recipe(product_id);
CREATE INDEX ix_recipe_ingredient_ingredient ON dbo.recipe_ingredient(ingredient_id);
CREATE INDEX ix_work_order_factory ON dbo.work_order(factory_id);
CREATE INDEX ix_work_order_product ON dbo.work_order(product_id);
CREATE INDEX ix_work_order_recipe ON dbo.work_order(recipe_id);

CREATE INDEX ix_sales_order_store ON dbo.sales_order(store_id);
CREATE INDEX ix_sales_detail_order ON dbo.sales_detail(sales_order_id);
CREATE INDEX ix_sales_detail_product ON dbo.sales_detail(product_id);
