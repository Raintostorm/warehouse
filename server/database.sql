DO $$ DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;

-- Users
CREATE TABLE Users (
    Id VARCHAR(10) PRIMARY KEY,
    Fullname TEXT,
    Number VARCHAR(15),
    Address TEXT,
    Email TEXT,
    Password TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdateAt TIMESTAMP,
    Actor TEXT
);

-- Warehouses
CREATE TABLE Warehouses (
    Id VARCHAR(10) PRIMARY KEY,
    Name TEXT,
    Address TEXT,
    Size NUMERIC(10,2),
    Type TEXT,
    StartedDate DATE,
    EndDate DATE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdateAt TIMESTAMP
);

-- Products
CREATE TABLE Products (
    Id VARCHAR(10) PRIMARY KEY,
    Name TEXT,
    Type TEXT,
    Unit TEXT,
    Number INTEGER,
    Price NUMERIC(12,2),
    SupplierID VARCHAR(10),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdateAt TIMESTAMP
);

-- Orders
CREATE TABLE Orders (
    Id VARCHAR(15) PRIMARY KEY,
    Type TEXT,
    Date DATE,
    UId VARCHAR(10),
    CustomerName TEXT,
    Total NUMERIC(14,2),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdateAt TIMESTAMP
);

-- Suppliers
CREATE TABLE Suppliers (
    Id VARCHAR(10) PRIMARY KEY,
    Name TEXT,
    Address TEXT,
    Phone VARCHAR(15),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdateAt TIMESTAMP
);

-- Roles
CREATE TABLE Roles (
    Id VARCHAR(10) PRIMARY KEY,
    Name TEXT
);

-- WarehouseManagement
CREATE TABLE WarehouseManagement (
    Wid VARCHAR(10),
    Uid VARCHAR(10),
    Action TEXT,
    Date DATE,
    Note TEXT,
    PRIMARY KEY (Wid, Uid)
);

-- ProductManagement
CREATE TABLE ProductManagement (
    Pid VARCHAR(10),
    Uid VARCHAR(10),
    Action TEXT,
    Number INTEGER,
    Date DATE,
    Note TEXT,
    PRIMARY KEY (Pid, Uid)
);

-- OrderWarehouses
CREATE TABLE OrderWarehouses (
    Wid VARCHAR(10),
    Oid VARCHAR(15),
    Note TEXT,
    PRIMARY KEY (Wid, Oid)
);

-- ProductDetails
CREATE TABLE ProductDetails (
    Pid VARCHAR(10),
    Wid VARCHAR(10),
    UpdatedAt DATE,
    Number INTEGER,
    Note TEXT,
    PRIMARY KEY (Pid, Wid)
);

-- OrderDetails
CREATE TABLE OrderDetails (
    Oid VARCHAR(15),
    Pid VARCHAR(10),
    Number INTEGER,
    Note TEXT,
    PRIMARY KEY (Oid, Pid)
);

-- UserRoles
CREATE TABLE UserRoles (
    UId VARCHAR(10),
    RId VARCHAR(10),
    PRIMARY KEY (UId, RId)
);
