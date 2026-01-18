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

-- Slots table
CREATE TABLE slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('house', 'hotel', 'shop', 'car', 'bicycle', 'motocycle', 'baby', 'general', 'land') NOT NULL,
  slot_title VARCHAR(255) NOT NULL,  slot_description TEXT,  capacity INT NOT NULL,
  duration INT NOT NULL, -- in days
  price DECIMAL(10,2) NOT NULL,
   tax DECIMAL(10,2)  NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
  location VARCHAR(255),
  price DECIMAL(10,2),
  room_sizes TEXT,
  lawyer_fee DECIMAL(10,2),
  agent_fee DECIMAL(10,2),
  interior_quality TEXT,
  exterior_quality TEXT,
  images JSON, -- array of image paths
  video VARCHAR(255),
  status ENUM('available', 'rented', 'offline') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (landlord_id) REFERENCES users(id),
  FOREIGN KEY (slot_id) REFERENCES slots(id)
);

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

-- Categories for special resources
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

-- Category items
CREATE TABLE category_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT,
  name VARCHAR(255) NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- House resources
CREATE TABLE house_resources (
  house_id INT,
  item_id INT,
  PRIMARY KEY (house_id, item_id),
  FOREIGN KEY (house_id) REFERENCES houses(id),
  FOREIGN KEY (item_id) REFERENCES category_items(id)
);

-- Hotel resources
CREATE TABLE hotel_resources (
  hotel_id INT,
  item_id INT,
  PRIMARY KEY (hotel_id, item_id),
  FOREIGN KEY (hotel_id) REFERENCES hotels(id),
  FOREIGN KEY (item_id) REFERENCES category_items(id)
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

-- Insert default categories
INSERT INTO categories (name) VALUES ('Amenities'), ('Hospital'), ('Network'), ('Education'), ('Security'), ('Business'), ('Others');

-- Insert default super admin
INSERT INTO users (email, password, role, name) VALUES ('admin@houseagency.com', 'admin123', 'super_admin', 'Super Admin');

