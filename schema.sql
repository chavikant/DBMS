-- SQL schema for Stock Portfolio Analysis

-- Table to store stock information
CREATE TABLE IF NOT EXISTS stocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol VARCHAR(10) NOT NULL UNIQUE,
    company_name VARCHAR(100)
);

-- Table to store portfolio transactions
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stock_id INTEGER NOT NULL,
    transaction_type VARCHAR(10) NOT NULL CHECK(transaction_type IN ('buy', 'sell')),
    shares INTEGER NOT NULL CHECK(shares > 0),
    price_per_share DECIMAL(10, 2) NOT NULL CHECK(price_per_share > 0),
    transaction_date DATE DEFAULT CURRENT_DATE,
    FOREIGN KEY (stock_id) REFERENCES stocks(id)
);

-- Table to store portfolio summary (optional, can be derived from transactions)
CREATE TABLE IF NOT EXISTS portfolio_summary (
    stock_id INTEGER PRIMARY KEY,
    total_shares INTEGER NOT NULL,
    average_cost DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (stock_id) REFERENCES stocks(id)
);
