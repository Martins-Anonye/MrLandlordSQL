-- Seed for slot_service with new columns: number_of_rooms, area_type, area_description
INSERT INTO slot_service (slot_id, service_id, service_name, tax, number_of_rooms, area_type, area_description)
VALUES
  -- House / Apartment Types (slot_id = 1)
  (1, 1101, 'Studio (1-Bedroom Flat)', 6000.00, 1, 'Urban', 'Central location with easy access to public transport'),
  (1, 1102, '2-Bedroom Flat', 8000.00, 2, 'Urban', 'Comfortable apartment in residential area'),
  (1, 1103, '3-Bedroom Flat', 12000.00, 3, 'Suburban', 'Spacious flat with modern amenities'),
  (1, 1104, '4-Bedroom Flat / House', 18000.00, 4, 'Suburban', 'Large family home with garden space'),
  (1, 1105, '5+ Bedroom House / Mansion', 30000.00, 5, 'Rural', 'Luxury property on expansive grounds'),
  (1, 1110, 'Serviced Apartment (monthly)', 20000.00, 2, 'Urban', 'Fully furnished with housekeeping'),
  (1, 1111, 'Furnished Unit Upgrade (per room)', 15000.00, 1, 'Peri-Urban', 'Premium furnishings and fixtures'),
  (1, 1201, 'Cleaning Service (monthly)', 2500.00, NULL, 'Urban', 'Professional house cleaning'),
  (1, 1202, 'Security / Patrol (monthly)', 3000.00, NULL, 'Remote', '24/7 security surveillance'),
  (1, 1203, 'Garden / Yard Maintenance (monthly)', 4000.00, NULL, 'Rural', 'Landscaping and maintenance'),

  -- Shops (slot_id = 2)
  (2, 2101, 'Small Shop Space (up to 20 sqm)', 2500.00, NULL, 'Urban', 'Prime retail location'),
  (2, 2102, 'Medium Shop Space (20-50 sqm)', 5000.00, NULL, 'Suburban', 'Commercial space with foot traffic'),
  (2, 2103, 'Large Shop Space (50+ sqm)', 10000.00, NULL, 'Urban', 'Warehouse retail space'),
  (2, 2201, 'Electricity Metering (monthly)', 1500.00, NULL, 'Urban', 'Separate metering for billing'),
  (2, 2202, 'Shop Front Branding (one-time)', 2500.00, NULL, 'Urban', 'Custom signage and branding'),
  (2, 2203, 'Daily Cleaning (shop)', 1200.00, NULL, 'Urban', 'Daily commercial cleaning'),
  (2, 2204, 'Storage Backroom Access (monthly)', 3000.00, NULL, 'Suburban', 'Secure storage space'),

  -- Car Parking (slot_id = 3)
  (3, 3101, 'Single Car Parking (monthly)', 500.00, NULL, 'Urban', 'Street level parking'),
  (3, 3102, 'Covered Car Slot (monthly)', 1500.00, NULL, 'Urban', 'Protected parking structure'),
  (3, 3103, 'EV Charging (per use)', 100.00, NULL, 'Urban', 'Electric vehicle charging station'),
  (3, 3201, 'Monthly Parking Insurance', 3500.00, NULL, 'Urban', 'Comprehensive parking coverage'),
  (3, 3202, 'Car Wash Access (per use)', 250.00, NULL, 'Urban', 'On-site car wash facility'),

  -- Bicycle Storage (slot_id = 4)
  (4, 4101, 'Bike Storage (per bike/month)', 50.00, NULL, 'Urban', 'Secure bicycle storage'),
  (4, 4102, 'Secure Lock Rental (monthly)', 200.00, NULL, 'Urban', 'Premium lock rental'),
  (4, 4103, 'Covered Storage Upgrade', 150.00, NULL, 'Suburban', 'Weather-protected storage'),

  -- Motorcycle Parking (slot_id = 5)
  (5, 5101, 'Motorcycle Parking (monthly)', 300.00, NULL, 'Urban', 'Dedicated motorcycle spot'),
  (5, 5102, 'Sheltered Spot (monthly)', 700.00, NULL, 'Suburban', 'Covered parking area'),
  (5, 5103, 'Helmet Storage (monthly)', 100.00, NULL, 'Urban', 'Secure helmet storage'),

  -- Baby Daycare (slot_id = 6)
  (6, 6101, 'Daycare Slot (per child/month)', 5000.00, NULL, 'Suburban', 'Full-time child care'),
  (6, 6102, 'Meals Included (per child/month)', 1200.00, NULL, 'Suburban', 'Nutritious meals provided'),
  (6, 6103, 'Extra Care Attendant (per hour)', 2500.00, NULL, 'Suburban', 'One-on-one care support'),
  (6, 6104, 'Health Check (monthly)', 3000.00, NULL, 'Suburban', 'Medical checkup included'),

  -- General Storage (slot_id = 7)
  (7, 7101, 'Small Storage Unit (monthly)', 2000.00, NULL, 'Peri-Urban', 'Compact storage space'),
  (7, 7102, 'Medium Storage Unit (monthly)', 4000.00, NULL, 'Peri-Urban', 'Standard warehouse storage'),
  (7, 7103, 'Large Storage Unit (monthly)', 8000.00, NULL, 'Peri-Urban', 'Large commercial storage'),
  (7, 7201, 'Storage Insurance (annual)', 4000.00, NULL, 'Peri-Urban', 'Full coverage insurance'),
  (7, 7202, 'Climate Control Add-on (monthly)', 1200.00, NULL, 'Peri-Urban', 'Temperature regulated storage'),

  -- Land Market (slot_id = 8)
  (8, 8101, 'Short-term Land Lease (per month)', 50000.00, NULL, 'Remote', 'Flexible monthly lease'),
  (8, 8102, 'Long-term Land Lease (per year)', 500000.00, NULL, 'Remote', 'Annual lease agreement'),
  (8, 8201, 'Irrigation Setup (one-time)', 15000.00, NULL, 'Rural', 'Agricultural irrigation system'),
  (8, 8202, 'Land Survey Service (one-time)', 10000.00, NULL, 'Remote', 'Professional land surveying'),
  (8, 8203, 'Security Fence Installation (one-time)', 25000.00, NULL, 'Remote', 'Perimeter fencing and gates');
