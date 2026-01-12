CREATE DATABASE
USE ringgittrack;

-- ----------------------------
-- 1. Table transactions
-- ----------------------------

CREATE TABLE transactions (
    id INT(11) AUTO_INCREMENT PRIMARY KEY, 
    item_name VARCHAR(255) NOT NULL,       
    amount DECIMAL(10, 2) NOT NULL,        
    category VARCHAR(50) NOT NULL,
    transaction_date DATE NOT NULL,        
    lat VARCHAR(50),                       
    lng VARCHAR(50),
    address TEXT
);

-- ----------------------------
-- 2. Table goals
-- ----------------------------

CREATE TABLE goals (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    target_amount DECIMAL(10, 2) NOT NULL,
    saved_amount DECIMAL(10, 2) NOT NULL
);

-- ----------------------------
-- 3. Table budget_topups
-- ----------------------------

CREATE TABLE budget_topups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    amount DECIMAL(10,2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);