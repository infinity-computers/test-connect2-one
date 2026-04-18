SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE otp_challenges;
TRUNCATE TABLE payments;
TRUNCATE TABLE subscriptions;
TRUNCATE TABLE complaints;
TRUNCATE TABLE plan_variants;
TRUNCATE TABLE plans;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;

-- USERS
INSERT INTO users (id, name, email, phone, password, role, auth_type)
VALUES
  ('usr_demo_001', 'Ravi Patel', 'user@connect2one.in', '9974955501', '$2b$12$hRkpvG8L0Tf6mWmYHkqf3Ox4mSMqIvPByf2Uj2Nq9GXlW3kQ2j6aG', 'USER', 'PASSWORD'),
  ('usr_demo_002', 'Meera Shah', 'meera@connect2one.in', '9974955503', '$2b$12$Kj2rF0g4NG9zRZ3j4qQGLeQZyCmKeZQn8hW4k7Kf7Xk7jZrB3A62K', 'USER', 'PASSWORD'),
  ('adm_demo_001', 'Admin User', 'admin@connect2one.in', '9974955599', NULL, 'ADMIN', 'OTP'),
  ('tech_demo_001', 'Tech User', 'tech@connect2one.in', '9974955588', NULL, 'TECHNICIAN', 'OTP');

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

-- SUBSCRIPTIONS
INSERT INTO subscriptions (id, user_id, plan_variant_id, start_date, end_date, status)
VALUES
  ('sub_demo_001', 'usr_demo_001', 'pv_eco_60_3', DATE_SUB(CURDATE(), INTERVAL 20 DAY), DATE_ADD(CURDATE(), INTERVAL 70 DAY), 'active'),
  ('sub_demo_002', 'usr_demo_002', 'pv_bud_80_6', DATE_SUB(CURDATE(), INTERVAL 300 DAY), DATE_SUB(CURDATE(), INTERVAL 120 DAY), 'expired');

-- PAYMENTS
INSERT INTO payments (id, subscription_id, user_id, amount, razorpay_payment_id, razorpay_order_id, status, payment_date)
VALUES
  ('pay_demo_001', 'sub_demo_001', 'usr_demo_001', 3399.00, 'pay_demo_001', 'order_demo_001', 'success', DATE_SUB(NOW(), INTERVAL 20 DAY)),
  ('pay_demo_002', 'sub_demo_001', 'usr_demo_001', 3899.00, NULL, 'order_demo_002', 'pending', NULL),
  ('pay_demo_003', 'sub_demo_002', 'usr_demo_002', 6199.00, 'pay_demo_003', 'order_demo_003', 'failed', DATE_SUB(NOW(), INTERVAL 122 DAY));

-- COMPLAINTS
INSERT INTO complaints (user_id, source, reporter_name, reporter_phone, reporter_email, reporter_address, issue_type, explicit_description, status)
VALUES
  ('usr_demo_001', 'AUTHENTICATED', NULL, NULL, NULL, NULL, 'Internet speed', 'Connection speed drops every evening between 7 PM and 10 PM.', 'OPEN'),
  ('usr_demo_002', 'AUTHENTICATED', NULL, NULL, NULL, NULL, 'Downtime/outage', 'No internet since morning after heavy rain.', 'IN_PROGRESS'),
  (NULL, 'GUEST', 'Karan Desai', '9974955577', 'karan.guest@example.com', 'Tavra Main Road, Bharuch', 'New connection delay', 'Requested a new connection 5 days ago and installation has not happened yet.', 'OPEN'),
  ('usr_demo_001', 'AUTHENTICATED', NULL, NULL, NULL, NULL, 'Billing error', 'Billing was corrected by support team.', 'RESOLVED');

-- OTP CHALLENGES
INSERT INTO otp_challenges (
  id,
  user_id,
  complaint_id,
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
    'otp_demo_001',
    'usr_demo_001',
    NULL,
    'FORGOT_PASSWORD',
    'EMAIL',
    'user@connect2one.in',
    'sha256$demo_hash_forgot_001',
    1,
    5,
    DATE_ADD(NOW(), INTERVAL 1 DAY),
    NULL,
    '127.0.0.1',
    'Seed Script'
  ),
  (
    'otp_demo_002',
    'adm_demo_001',
    NULL,
    'ADMIN_LOGIN',
    'EMAIL',
    'admin@connect2one.in',
    'sha256$demo_hash_admin_001',
    0,
    5,
    DATE_ADD(NOW(), INTERVAL 1 DAY),
    NOW(),
    '127.0.0.1',
    'Seed Script'
  ),
  (
    'otp_demo_003',
    'tech_demo_001',
    (
      SELECT id
      FROM complaints
      WHERE issue_type = 'Downtime/outage'
      ORDER BY id DESC
      LIMIT 1
    ),
    'COMPLAINT_RESOLVE',
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
SELECT 'complaints', COUNT(*) FROM complaints
UNION ALL
SELECT 'otp_challenges', COUNT(*) FROM otp_challenges;
