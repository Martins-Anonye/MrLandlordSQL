-- Seed purchased_slots table
INSERT INTO purchased_slots (
  slot_id,
  landlord_id,
  payment_id,
  date_purchased,
  renewed_at,
  next_expiry,
  status
)
VALUES
  (1, 2, 10, NOW(), NULL, DATE_ADD(NOW(), INTERVAL 1 YEAR), 'active'),
  (2, 3, 11, NOW(), NOW(), DATE_ADD(NOW(), INTERVAL 6 MONTH), 'renewed'),
  (3, 4, 12, NOW(), NULL, DATE_ADD(NOW(), INTERVAL 3 MONTH), 'expired');





-- Assume landlord has id = 2 (replace with actual landlord user id)
-- Insert a purchased slot for that landlord
-- INSERT INTO purchased_slots (slot_id, landlord_id, status)
-- VALUES (
--   (SELECT id FROM slots WHERE type = 'house' LIMIT 1),
--   2,   -- replace with your landlord’s user id
--   'active'
-- );
