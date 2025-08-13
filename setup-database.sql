-- สคริปต์สำหรับสร้าง database และ user สำหรับ WebCam App Logging

-- สร้าง database
CREATE DATABASE IF NOT EXISTS webcamapp_logs
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- สร้าง user สำหรับ production (แนะนำ)
-- แก้ไข username และ password ตามต้องการ
CREATE USER IF NOT EXISTS 'webcamapp'@'localhost' IDENTIFIED BY 'your_secure_password_here';

-- ให้สิทธิ์การใช้งาน database
GRANT ALL PRIVILEGES ON webcamapp_logs.* TO 'webcamapp'@'localhost';

-- สำหรับ production server ที่ต่าง host
-- CREATE USER IF NOT EXISTS 'webcamapp'@'%' IDENTIFIED BY 'your_secure_password_here';
-- GRANT ALL PRIVILEGES ON webcamapp_logs.* TO 'webcamapp'@'%';

-- Flush privileges เพื่อใช้งานได้ทันที
FLUSH PRIVILEGES;

-- ใช้ database ที่สร้าง
USE webcamapp_logs;

-- แสดงข้อมูล database ที่สร้าง
SHOW TABLES;

-- คำสั่งสำหรับตรวจสอบว่าทำงานได้หรือไม่
SELECT 'Database setup completed successfully!' as status;
