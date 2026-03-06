
-- Insert default categories
INSERT INTO categories (name) VALUES ('Amenities'), ('Hospital'), ('Network'), ('Education'), ('Security'), ('Business'), ('Others');

-- Insert default category items
INSERT INTO category_items (category_id, name) VALUES 
  (1, 'WiFi'), (1, 'Pool'), (1, 'Gym'), (1, 'Parking'), (1, 'Air Conditioning'),
  (2, 'Pharmacy'), (2, 'Clinic'), (2, 'Hospital'),
  (3, 'Electricity'), (3, 'Water'), (3, 'Internet'),
  (4, 'School'), (4, 'Library'), (4, 'University'),
  (5, 'Security Guard'), (5, 'CCTV'), (5, 'Gate'),
  (6, 'Restaurant'), (6, 'Shop'), (6, 'Office'),
  (7, 'Laundry'), (7, 'Pet Friendly');

