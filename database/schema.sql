CREATE DATABASE IF NOT EXISTS attendx;
USE attendx;

DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','student') NOT NULL DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL UNIQUE,
  roll_no VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  department VARCHAR(100) NOT NULL DEFAULT 'CSE',
  semester INT NOT NULL DEFAULT 8,
  phone VARCHAR(20),
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  semester INT NOT NULL DEFAULT 8
);

CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  subject_id INT NOT NULL,
  attendance_date DATE NOT NULL,
  status ENUM('present','absent') NOT NULL,
  marked_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_attendance(student_id, subject_id, attendance_date),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Demo credentials:
-- Admin: admin@attendx.local / password123
-- Student: aarav@example.com / password123
INSERT INTO users (name,email,password_hash,role) VALUES
('System Admin','admin@attendx.local','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','admin'),
('Aarav Sharma','aarav@example.com','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','student'),
('Priya Verma','priya@example.com','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','student');

INSERT INTO students (user_id,roll_no,name,email,department,semester,phone) VALUES
(2,'CSE001','Aarav Sharma','aarav@example.com','CSE',8,'9000000001'),
(3,'CSE002','Priya Verma','priya@example.com','CSE',8,'9000000002'),
(NULL,'CSE003','Rohan Patel','rohan@example.com','CSE',8,'9000000003'),
(NULL,'CSE004','Neha Singh','neha@example.com','CSE',8,'9000000004'),
(NULL,'CSE005','Kunal Jain','kunal@example.com','CSE',8,'9000000005');

INSERT INTO subjects(code,name,semester) VALUES
('CS801','Advanced Computer Networks',8),
('CS802','Cloud Computing',8),
('CS803','Data Analytics',8),
('CS804','Project',8);

-- Sample attendance for the last 10 days.
INSERT INTO attendance(student_id,subject_id,attendance_date,status,marked_by)
SELECT s.id, sub.id, DATE_SUB(CURDATE(), INTERVAL d.n DAY),
       CASE
         WHEN MOD(s.id + sub.id + d.n, 7) IN (0,1) THEN 'absent'
         ELSE 'present'
       END,
       1
FROM students s
CROSS JOIN subjects sub
CROSS JOIN (
  SELECT 0 n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL
  SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL
  SELECT 8 UNION ALL SELECT 9
) d;
