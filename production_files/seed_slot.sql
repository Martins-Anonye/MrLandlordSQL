-- Seed data for slots table
INSERT INTO slots (type, slot_title, slot_description, capacity, duration, price, tax)
VALUES
  ('house', '3-Bedroom Apartment', 'Spacious apartment with modern amenities', 1, 365, 500000.00, 25000.00),
  ('shop', 'Retail Shop Space', 'Ground floor shop suitable for small businesses', 1, 180, 150000.00, 7500.00),
  ('car', 'Car Parking Slot', 'Secure car parking with CCTV surveillance', 1, 30, 10000.00, 500.00),
  ('bicycle', 'Bicycle Storage', 'Covered storage area for bicycles', 10, 30, 2000.00, 100.00),
  ('motocycle', 'Motorcycle Parking', 'Dedicated motorcycle parking slots', 5, 30, 5000.00, 250.00),
  ('baby', 'Baby Daycare Slot', 'Daycare slot for infants and toddlers', 20, 30, 30000.00, 1500.00),
  ('general', 'General Storage Unit', 'Secure storage unit for personal items', 50, 90, 50000.00, 2500.00),
  ('land', 'Land Lease Slot', 'Lease slot for agricultural or commercial land use', 1, 730, 1000000.00, 50000.00);

  
