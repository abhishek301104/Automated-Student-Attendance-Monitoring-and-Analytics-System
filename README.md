# ATTENDX — Major Project Version 2

Student Attendance Monitoring and Analytics System built with **Node.js, Express, MySQL, HTML, CSS and JavaScript**.

## Major-project features
- Admin and student login
- JWT-based authentication
- Role-based dashboard
- Student CRUD/search
- Subject management through MySQL
- Bulk daily attendance marking
- Attendance records and filters
- Overall attendance KPIs
- Attendance trend chart
- Risk distribution
- Defaulter detection below 75%
- Low-attendance notification generation
- Student self-service attendance/history
- Excel report export
- PDF report export
- Responsive mobile interface
- PWA manifest for app-like browser experience

## 1. Requirements
Install:
1. Node.js LTS
2. MySQL Server + MySQL Workbench
3. VS Code

## 2. Open project
Extract the ZIP and open this folder in VS Code.

## 3. Install packages
In VS Code Terminal:
```bash
npm install
```

## 4. Create database
Open `database/schema.sql` in MySQL Workbench and execute the whole file.

If your MySQL user has a password, keep it ready for `.env`.

## 5. Create `.env`
Copy `.env.example` to `.env` and set:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
DB_NAME=attendx
JWT_SECRET=use_a_long_random_secret
```

If your MySQL root password is blank, use:
```env
DB_PASSWORD=
```

## 6. Start
```bash
npm start
```
Open:
`http://localhost:3000`

For development:
```bash
npm run dev
```

## Demo accounts
Admin:
- Email: `admin@attendx.local`
- Password: `password123`

Student:
- Email: `aarav@example.com`
- Password: `password123`

## Phone testing
Keep laptop and phone on the same Wi-Fi.

Windows:
```bash
ipconfig
```
Find IPv4 Address, for example `192.168.1.10`.

On the phone open:
`http://192.168.1.10:3000`

If Windows Firewall blocks it, allow Node.js on Private networks.

## Suggested viva explanation
"The project is a web-based Student Attendance Monitoring and Analytics System. The backend is developed using Node.js and Express, MySQL stores users, students, subjects and attendance records, and the frontend uses HTML, CSS and JavaScript. JWT authentication provides role-based access for admin and student users. The admin can manage students, mark attendance, analyze trends, identify students below 75%, generate alerts and export Excel/PDF reports. Students can log in to view subject-wise attendance and history. The responsive interface also supports mobile use."

## Important production notes
This is a complete academic/demo project, not a production deployment. Before production, add stronger password policy, HTTPS, refresh-token/session strategy, CSRF protection where applicable, rate limiting, audit logging, validation, backups and secure secret management.
