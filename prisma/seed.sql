SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE otp_challenges;
TRUNCATE TABLE payments;
TRUNCATE TABLE subscriptions;
TRUNCATE TABLE tickets;
TRUNCATE TABLE plan_variants;
TRUNCATE TABLE plans;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;

-- USERS
INSERT INTO users (id, name, email, phone, password, role, auth_type)
VALUES
  ('usr_001', 'Ravi Patel', 'ravi@connect2one.in', '9974955501', '$2b$10$nTf72SMu6il01MIUMXlcXOYl8cQ3oyXvRScrQ.rbMsMYEnO4UKc9i', 'USER', 'PASSWORD'),
  ('usr_002', 'Meera Shah', 'meera@connect2one.in', '9974955503', '$2b$10$GdFgOjEIEjIlRNmBfo.rK.rfndsvL.tc97Obtbu6Dp6Y24RgZ8xAa', 'USER', 'PASSWORD'),
  ('tech_001', 'Tech User', 'joffreylannister19@gmail.com', '9974955588', '$2b$10$fN9lPomUm.HaqqPbyEfJcOZZEWtA0jWokErzl7MZa9Dqounw/zFQO', 'TECHNICIAN', 'OTP'),
  ('adm_001', 'Admin User', 'rathorjatin70@gmail.com', '9974955599', NULL, 'ADMIN', 'OTP'),
  ('adm_002', 'Care Admin', 'care@connect2one.in', '9974955502', NULL, 'ADMIN', 'OTP');

-- PLANS
INSERT INTO plans (id, name, description)
VALUES
  ('plan_premium', 'Premium', 'VIP priority service with 4-24 working hour support.'),
  ('plan_budget', 'Budget', 'Balanced plans with faster priority support within 24-48 hours.'),
  ('plan_eco', 'Eco', 'Affordable daily-use plans ideal for homes and students.');

-- PLAN VARIANTS
INSERT INTO plan_variants (id, plan_id, speed_mbps, duration_months, price)
VALUES
  ('pv_pre_40_3', 'plan_premium', 40, 3, 3999.00),
  ('pv_pre_40_6', 'plan_premium', 40, 6, 5999.00),
  ('pv_pre_40_12', 'plan_premium', 40, 12, 7999.00),
  ('pv_pre_60_3', 'plan_premium', 60, 3, 4999.00),
  ('pv_pre_60_6', 'plan_premium', 60, 6, 7499.00),
  ('pv_pre_60_12', 'plan_premium', 60, 12, 9999.00),
  ('pv_pre_80_3', 'plan_premium', 80, 3, 5499.00),
  ('pv_pre_80_6', 'plan_premium', 80, 6, 8199.00),
  ('pv_pre_80_12', 'plan_premium', 80, 12, 11199.00),
  ('pv_pre_100_3', 'plan_premium', 100, 3, 5999.00),
  ('pv_pre_100_6', 'plan_premium', 100, 6, 8999.00),
  ('pv_pre_100_12', 'plan_premium', 100, 12, 12499.00),

    ('pv_pre_150_3', 'plan_premium', 150, 3, 7999.00),
  ('pv_pre_150_6', 'plan_premium', 150, 6, 10499.00),
  ('pv_pre_150_12', 'plan_premium', 150, 12, 12999.00),
  ('pv_pre_200_3', 'plan_premium', 200, 3, 9599.00),
  ('pv_pre_200_6', 'plan_premium', 200, 6, 12999.00),
  ('pv_pre_200_12', 'plan_premium', 200, 12, 15999.00),
  ('pv_pre_300_3', 'plan_premium', 300, 3, 14499.00),
  ('pv_pre_300_6', 'plan_premium', 300, 6, 18999.00),
  ('pv_pre_300_12', 'plan_premium', 300, 12, 22999.00),


  ('pv_bud_40_3', 'plan_budget', 40, 3, 3499.00),
  ('pv_bud_40_6', 'plan_budget', 40, 6, 4899.00),
  ('pv_bud_40_12', 'plan_budget', 40, 12, 5999.00),
  ('pv_bud_60_3', 'plan_budget', 60, 3, 4199.00),
  ('pv_bud_60_6', 'plan_budget', 60, 6, 5799.00),
  ('pv_bud_60_12', 'plan_budget', 60, 12, 7199.00),
  ('pv_bud_80_3', 'plan_budget', 80, 3, 4599.00),
  ('pv_bud_80_6', 'plan_budget', 80, 6, 6199.00),
  ('pv_bud_80_12', 'plan_budget', 80, 12, 7999.00),
  ('pv_bud_100_3', 'plan_budget', 100, 3, 4999.00),
  ('pv_bud_100_6', 'plan_budget', 100, 6, 6499.00),
  ('pv_bud_100_12', 'plan_budget', 100, 12, 8499.00),

  ('pv_bud_150_3', 'plan_budget', 150, 3, 6799.00),
  ('pv_bud_150_6', 'plan_budget', 150, 6, 8999.00),
  ('pv_bud_150_12', 'plan_budget', 150, 12, 10999.00),
  ('pv_bud_200_3', 'plan_budget', 200, 3, 8199.00),
  ('pv_bud_200_6', 'plan_budget', 200, 6, 10999.00),
  ('pv_bud_200_12', 'plan_budget', 200, 12, 13499.00),
  ('pv_bud_300_3', 'plan_budget', 300, 3, 12499.00),
  ('pv_bud_300_6', 'plan_budget', 300, 6, 16499.00),
  ('pv_bud_300_12', 'plan_budget', 300, 12, 19999.00),

  ('pv_eco_40_3', 'plan_eco', 40, 3, 2899.00),
  ('pv_eco_40_6', 'plan_eco', 40, 6, 3899.00),
  ('pv_eco_40_12', 'plan_eco', 40, 12, 4999.00),
  ('pv_eco_60_3', 'plan_eco', 60, 3, 3399.00),
  ('pv_eco_60_6', 'plan_eco', 60, 6, 4699.00),
  ('pv_eco_60_12', 'plan_eco', 60, 12, 5799.00),
  ('pv_eco_80_3', 'plan_eco', 80, 3, 3699.00),
  ('pv_eco_80_6', 'plan_eco', 80, 6, 5099.00),
  ('pv_eco_80_12', 'plan_eco', 80, 12, 6299.00),
  ('pv_eco_100_3', 'plan_eco', 100, 3, 4099.00),
  ('pv_eco_100_6', 'plan_eco', 100, 6, 5499.00),
  ('pv_eco_100_12', 'plan_eco', 100, 12, 6999.00);

  ('pv_eco_150_3', 'plan_eco', 150, 3, 5999.00),
  ('pv_eco_150_6', 'plan_eco', 150, 6, 7999.00),
  ('pv_eco_150_12', 'plan_eco', 150, 12, 9999.00),
  ('pv_eco_200_3', 'plan_eco', 200, 3, 6999.00),
  ('pv_eco_200_6', 'plan_eco', 200, 6, 9499.00),
  ('pv_eco_200_12', 'plan_eco', 200, 12, 11999.00),
  ('pv_eco_300_3', 'plan_eco', 300, 3, 10499.00),
  ('pv_eco_300_6', 'plan_eco', 300, 6, 13999.00),
  ('pv_eco_300_12', 'plan_eco', 300, 12, 17999.00),

-- SUBSCRIPTIONS
INSERT INTO subscriptions (id, user_id, plan_variant_id, start_date, end_date, status)
VALUES
  ('sub_001', 'usr_001', 'pv_eco_60_3', DATE_SUB(CURDATE(), INTERVAL 20 DAY), DATE_ADD(CURDATE(), INTERVAL 70 DAY), 'active'),
  ('sub_002', 'usr_002', 'pv_bud_80_6', DATE_SUB(CURDATE(), INTERVAL 300 DAY), DATE_SUB(CURDATE(), INTERVAL 120 DAY), 'expired');

-- PAYMENTS
INSERT INTO payments (id, subscription_id, user_id, amount, razorpay_payment_id, razorpay_order_id, status, payment_date)
VALUES
  ('pay_001', 'sub_001', 'usr_001', 3399.00, 'pay_001', 'order_001', 'success', DATE_SUB(NOW(), INTERVAL 20 DAY)),
  ('pay_002', 'sub_001', 'usr_001', 3899.00, NULL, 'order_002', 'pending', NULL),
  ('pay_003', 'sub_002', 'usr_002', 6199.00, 'pay_003', 'order_003', 'failed', DATE_SUB(NOW(), INTERVAL 122 DAY));

-- COMPLAINTS
INSERT INTO tickets (id, tracking_code, user_id, source, reporter_name, reporter_phone, reporter_email, reporter_address, city, state, pin_code, issue_type, explicit_description, status)
VALUES
  ('cmp_001', 'C2O-8K4P2Q', 'usr_001', 'AUTHENTICATED', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Internet_speed', 'Connection speed drops every evening between 7 PM and 10 PM.', 'OPEN'),
  ('cmp_002', 'C2O-3L9X1R', 'usr_002', 'AUTHENTICATED', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Downtime_outage', 'No internet since morning after heavy rain.', 'IN_PROGRESS'),
  ('cmp_003', 'C2O-7N4B8M', NULL, 'GUEST', 'Karan Desai', '9974955577', 'karan.guest@example.com', 'Tavra Main Road, Bharuch', 'Bharuch', 'Gujarat', '392001', 'New_connection_delay', 'Requested a new connection 5 days ago and installation has not happened yet.', 'OPEN'),
  ('cmp_004', 'C2O-1H6J9K', 'usr_001', 'AUTHENTICATED', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Billing_error', 'Billing was corrected by support team.', 'RESOLVED');

-- OTP CHALLENGES
INSERT INTO otp_challenges (
  id,
  user_id,
  ticket_id,
  purpose,
  target_type,
  target,
  otp_hash,
  attempts,
  max_attempts,
  expires_at,
  consumed_at,
  request_ip,
  user_agent
)
VALUES
  (
    'otp_001',
    'usr_001',
    NULL,
    'FORGOT_PASSWORD',
    'EMAIL',
    'ravi@connect2one.in',
    'sha256$demo_hash_forgot_001',
    1,
    5,
    DATE_ADD(NOW(), INTERVAL 1 DAY),
    NULL,
    '127.0.0.1',
    'Seed Script'
  ),
  (
    'otp_002',
    'adm_001',
    NULL,
    'ADMIN_LOGIN',
    'EMAIL',
    'rathorjatin70@gmail.com',
    'sha256$demo_hash_admin_001',
    0,
    5,
    DATE_ADD(NOW(), INTERVAL 1 DAY),
    NOW(),
    '127.0.0.1',
    'Seed Script'
  ),
  (
    'otp_003',
    'usr_002',
    (
      SELECT id
      FROM tickets
      WHERE issue_type = 'Downtime/outage'
      ORDER BY id DESC
      LIMIT 1
    ),
    'TICKET_RESOLVE',
    'PHONE',
    '9974955503',
    'sha256$demo_hash_complaint_001',
    2,
    5,
    DATE_ADD(NOW(), INTERVAL 1 DAY),
    NULL,
    '127.0.0.1',
    'Seed Script'
  );

-- sanity check counts
SELECT 'users' AS table_name, COUNT(*) AS total FROM users
UNION ALL
SELECT 'plans', COUNT(*) FROM plans
UNION ALL
SELECT 'plan_variants', COUNT(*) FROM plan_variants
UNION ALL
SELECT 'subscriptions', COUNT(*) FROM subscriptions
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
UNION ALL
SELECT 'complaints', COUNT(*) FROM tickets
UNION ALL
SELECT 'otp_challenges', COUNT(*) FROM otp_challenges;
