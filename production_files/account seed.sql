
-- Insert default landlord users
INSERT INTO users (email, password, role, name, phone)
VALUES 
('landlord1@houseagency.com', 'landlord123', 'landlord', 'John Landlord', '+2348012345678'),
('landlord2@houseagency.com', 'landlord123', 'landlord', 'Mary Landlord', '+2348098765432');

-- Insert default public users
INSERT INTO users (email, password, role, name, phone)
VALUES 
('public1@houseagency.com', 'public123', 'public', 'Alice Public', '+2347012345678'),
('public2@houseagency.com', 'public123', 'public', 'Bob Public', '+2347098765432');
