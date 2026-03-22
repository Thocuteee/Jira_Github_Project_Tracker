-- Insert sample data for testing
INSERT INTO reports (report_id, group_id, user_id, report_type, generated_by, created_at) 
VALUES 
    (RANDOM_UUID(), RANDOM_UUID(), RANDOM_UUID(), 'SALES_REPORT', 'SYSTEM', CURRENT_TIMESTAMP()),
    (RANDOM_UUID(), RANDOM_UUID(), RANDOM_UUID(), 'INVENTORY_REPORT', 'USER', CURRENT_TIMESTAMP()),
    (RANDOM_UUID(), RANDOM_UUID(), RANDOM_UUID(), 'FINANCIAL_REPORT', 'ADMIN', CURRENT_TIMESTAMP());