-- Create database
CREATE DATABASE IF NOT EXISTS house_agency;
USE house_agency;

-- Users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(191) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('public', 'landlord', 'admin', 'super_admin', 'asset_manager') DEFAULT 'public',
  name VARCHAR(255),
  phone VARCHAR(20),
  asset_manager_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_manager_id) REFERENCES users(id)
);

-- Landlord general payment/account information (one row per landlord)
CREATE TABLE landlord_payment_info (
  id INT AUTO_INCREMENT PRIMARY KEY,
  landlord_id INT NOT NULL,
  first_name VARCHAR(255),
  second_name VARCHAR(255),
  other_names VARCHAR(255),
  phone VARCHAR(20),
  alt_phone VARCHAR(20),
  bank_name VARCHAR(255),
  account_number VARCHAR(50),
  account_name VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (landlord_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_landlord (landlord_id)
);

-- Slots table
CREATE TABLE slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('house', 'hotel', 'shop', 'car', 'bicycle', 'motocycle', 'baby', 'general', 'land') NOT NULL,
  slot_title VARCHAR(255) NOT NULL,  slot_description TEXT,  capacity INT NOT NULL,
  duration INT NOT NULL, -- in days
  price DECIMAL(10,2) NOT NULL,
  --  tax DECIMAL(10,2)  NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Slot services
-- that means each of these area types most have tax for 1 room, 2 room, 3 room, 4 room, 5+ room, and then a few additional services for each area type as well (e.g. cleaning, security, etc.)
CREATE TABLE slot_service (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slot_id INT NOT NULL,
  service_id INT NOT NULL,
  service_name VARCHAR(255) NOT NULL,
  tax DECIMAL(10,2) NULL,
  number_of_rooms INT,
  area_type ENUM('Urban', 'Rural', 'Suburban', 'Peri-Urban', 'Remote'),
  area_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (slot_id) REFERENCES slots(id) ON DELETE CASCADE
);
-- Purchased slots table
CREATE TABLE purchased_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slot_id INT NOT NULL,
  landlord_id INT NOT NULL,
  payment_id INT,
  date_purchased TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  renewed_at TIMESTAMP NULL,
  next_expiry TIMESTAMP NULL,
  status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
  FOREIGN KEY (slot_id) REFERENCES slots(id),
  FOREIGN KEY (landlord_id) REFERENCES users(id),
  FOREIGN KEY (payment_id) REFERENCES payments(id)
);

-- Used slots table
CREATE TABLE used_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slot_id INT NOT NULL,
  landlord_id INT NOT NULL,
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (slot_id) REFERENCES slots(id),
  FOREIGN KEY (landlord_id) REFERENCES users(id)
);

-- Room sizes options
CREATE TABLE room_sizes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL, -- e.g., 'Small', 'Medium', 'Large'
  size_text TEXT NOT NULL -- e.g., '10x10 sq ft'
);

-- Houses table
CREATE TABLE houses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  landlord_id INT,
  slot_id INT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  state VARCHAR(100),
  area VARCHAR(100),
  location VARCHAR(255),
  price DECIMAL(10,2),
  rent_period VARCHAR(50), -- e.g. '6 months', '1 year', etc.
  room_sizes TEXT,
  number_of_bedrooms INT,
  area_type ENUM('Urban', 'Rural', 'Suburban', 'Peri-Urban', 'Remote'),
  tax_fee DECIMAL(10,2),
  electricity VARCHAR(255),
  alternative_electricity VARCHAR(255),
  tenant_categories JSON,
  tenant_restrictions TEXT,
  additional_tenant_description TEXT,
  use_dedicated_payment_account TINYINT(1) DEFAULT 0,
  dedicated_payment_info JSON,
  -- lawyer_fee DECIMAL(10,2),  -- removed: fee is now embedded in `price` or handled via lawyer_in_charge
  lawyer_in_charge TINYINT(1) DEFAULT 0,
  lawyer_name VARCHAR(255) NULL,
  lawyer_phone VARCHAR(20) NULL,
  lawyer_email VARCHAR(255) NULL,
  agent_in_charge TINYINT(1) DEFAULT 0,
  agent_name VARCHAR(255) NULL,
  agent_phone VARCHAR(20) NULL,
  agent_email VARCHAR(255) NULL,
  agent_fee DECIMAL(10,2),
  pay_agent_by_cash TINYINT(1) DEFAULT 0,
  agent_additional_info TEXT,
  interior_quality TEXT,
  exterior_quality TEXT,
  images JSON, -- array of image paths
  video VARCHAR(255),
  map_latitude DECIMAL(10,8),
  map_longitude DECIMAL(11,8),
  status ENUM('available', 'rented', 'offline') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (landlord_id) REFERENCES users(id),
  FOREIGN KEY (slot_id) REFERENCES slots(id)
);

-- NOTE: the `lawyer_fee` column has been deprecated and is no longer part of
-- the application logic. If you are upgrading an existing database, execute
-- the following SQL to remove it:
--
--   ALTER TABLE houses DROP COLUMN lawyer_fee;
--
-- Alternatively keep it commented out above to preserve historical data but
-- ensure your queries no longer reference it.

-- Hotels table
CREATE TABLE hotels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  landlord_id INT,
  slot_id INT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  price_per_night DECIMAL(10,2),
  amenities TEXT, -- JSON array of amenities
  images JSON, -- array of image paths
  video VARCHAR(255),
  status ENUM('available', 'booked', 'offline') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (landlord_id) REFERENCES users(id),
  FOREIGN KEY (slot_id) REFERENCES slots(id)
);

-- Tenant Category table, written by admin, read by tenants when selecting tenant category for their house. also used by hotels for their target tenant categories
CREATE TABLE tenant_category (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories for special resources, write by admin, read by tenants when selecting amenities and resources for their house. also used by hotels for their amenities
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

-- Category items, write by admin read by tenants when selecting amenities and resources for their house. also used by hotels for their amenities
CREATE TABLE category_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT,
  name VARCHAR(255) NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- House resources, write by tenants when selecting amenities and resources for their house, read by admin and landlords when viewing house details
CREATE TABLE house_resources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  house_id INT NOT NULL,
  Array_Selected_item_id TEXT  NOT NULL,
  FOREIGN KEY (house_id) REFERENCES houses(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- House documents (normalized table for document management), write by landlords when uploading documents for their house, read by admin and landlords and Tenant  when viewing house details
CREATE TABLE house_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  house_id INT NOT NULL,
  landlord_id INT NOT NULL,
  doc_type ENUM('terms', 'lawyer', 'tenancy') NOT NULL,
  summary TEXT,
  file_path VARCHAR(255),
  file_name VARCHAR(255),
  file_size INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE CASCADE,
  FOREIGN KEY (landlord_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_house_id (house_id),
  INDEX idx_doc_type (doc_type)
);

-- Hotel resources
CREATE TABLE hotel_resources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hotel_id INT  NOT NULL,
  Array_Selected_item_id TEXT  NOT NULL,
  FOREIGN KEY (hotel_id) REFERENCES hotels(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

-- Hotel bookings
CREATE TABLE hotel_bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  hotel_id INT,
  checkin_date DATE,
  checkout_date DATE,
  total_price DECIMAL(10,2),
  status ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (hotel_id) REFERENCES hotels(id)
);

-- Check-ins
CREATE TABLE checkins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  house_id INT,
  checkin_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  image VARCHAR(255), -- path to captured image
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (house_id) REFERENCES houses(id)
);

-- Payments
CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  house_id INT,
  hotel_booking_id INT,
  amount DECIMAL(10,2),
  gateway ENUM('paystack', 'flutterwave', 'wallet'),
  status ENUM('pending', 'completed', 'failed'),
  transaction_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (house_id) REFERENCES houses(id),
  FOREIGN KEY (hotel_booking_id) REFERENCES hotel_bookings(id)
);

-- Payouts
CREATE TABLE payouts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  landlord_id INT,
  amount DECIMAL(10,2),
  status ENUM('pending', 'completed'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (landlord_id) REFERENCES users(id)
);

-- Surveys
CREATE TABLE surveys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  checkin_id INT,
  rating INT,
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (checkin_id) REFERENCES checkins(id)
);

-- Ads
CREATE TABLE ads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  content TEXT,
  image VARCHAR(255),
  active BOOLEAN DEFAULT TRUE
);



-- Chat messages
CREATE TABLE chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT,
  receiver_id INT,
  message TEXT,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (receiver_id) REFERENCES users(id)
);
-- Insert default super admin
INSERT INTO users (email, password, role, name) VALUES ('admin@houseagency.com', 'admin123', 'super_admin', 'Super Admin');


