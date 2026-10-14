# ATTENDX: Student Attendance Monitoring and Analytics System

![Node.js](https://img.shields.io/badge/Node.js-LTS-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-API-000000?logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?logo=mysql&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

A full-stack web application that automates student attendance tracking and turns the data into actionable analytics: live dashboards, defaulter detection below 75%, low-attendance alerts and downloadable Excel/PDF reports.

> Built with **Node.js, Express, MySQL, HTML, CSS and JavaScript**. Role-based access for **Admins** and **Students**.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Demo Accounts](#demo-accounts)
- [Testing on a Phone](#testing-on-a-phone)
- [How It Works](#how-it-works)
- [Security Notes](#security-notes)
- [Roadmap](#roadmap)
- [Author](#author)
- [License](#license)

## Features

**Admin**
- Secure login with JWT authentication and a role-based dashboard
- Student management: add, edit, delete and search
- Subject management backed by MySQL
- Bulk daily attendance marking
- Attendance records with filters
- Overall attendance KPIs, attendance trend chart and risk distribution
- Defaulter detection for students below 75% attendance
- Automatic generation of low-attendance notifications
- Excel and PDF report export

**Student**
- Personal login
- Subject-wise attendance and full attendance history

**Platform**
- Responsive, mobile-friendly interface
- PWA manifest for an app-like experience in the browser

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express |
| Database | MySQL |
| Frontend | HTML, CSS, JavaScript |
| Auth | JSON Web Tokens (JWT), role-based access |
| Reports | Excel and PDF export |

## Project Structure

```
.
├── database/        # MySQL schema (schema.sql)
├── public/          # Frontend: HTML, CSS, JavaScript, PWA manifest
├── server.js        # Express server and API
├── .env.example     # Template for environment variables
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- [Node.js LTS](https://nodejs.org/)
- [MySQL Server](https://dev.mysql.com/downloads/mysql/) and MySQL Workbench (or any MySQL client)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/abhishek301104/Automated-Student-Attendance-Monitoring-and-Analytics-System.git
cd Automated-Student-Attendance-Monitoring-and-Analytics-System
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the database

Open `database/schema.sql` in MySQL Workbench and run the whole file. This creates the `attendx` database, its tables and demo data.

### 4. Configure environment variables

```bash
cp .env.example .env       # Windows: copy .env.example .env
```

Edit `.env` with your MySQL password and a long random `JWT_SECRET`.

### 5. Run the app

```bash
npm start          # production mode
npm run dev        # development mode
```

Open **http://localhost:3000** in your browser.

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port the server listens on | `3000` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_USER` | MySQL user | `root` |
| `DB_PASSWORD` | MySQL password (leave empty if blank) | `your_password` |
| `DB_NAME` | Database name | `attendx` |
| `JWT_SECRET` | Secret used to sign tokens. Use a long random string. | `change_me_to_a_long_random_value` |

Never commit your real `.env` file. It is already listed in `.gitignore`.

## Demo Accounts

These accounts exist only for local demo purposes. Change or remove them before any real deployment.

| Role | Email | Password |
|---|---|---|
| Admin | `admin@attendx.local` | `password123` |
| Student | `aarav@example.com` | `password123` |

## Testing on a Phone

1. Keep your laptop and phone on the same Wi-Fi network.
2. Find your laptop's IPv4 address (`ipconfig` on Windows, `ifconfig` or `ip a` on macOS/Linux), for example `192.168.1.10`.
3. On your phone open `http://192.168.1.10:3000`.
4. If Windows Firewall blocks the connection, allow Node.js on Private networks.

## How It Works

1. An **admin** logs in, adds students and subjects, and marks attendance in bulk for each day.
2. Attendance is stored in **MySQL** and aggregated into per-student and per-subject percentages.
3. The **dashboard** shows overall KPIs, a trend chart and a risk distribution.
4. Students under **75%** are flagged as defaulters and low-attendance notifications are generated.
5. Admins export **Excel or PDF** reports. Students log in to view their own subject-wise attendance and history.

## Security Notes

This is an academic/demo project. Before any production deployment, add:

- A stronger password policy and removal of demo accounts
- HTTPS
- A refresh-token or session strategy
- CSRF protection where applicable
- Rate limiting on login routes
- Request validation and audit logging
- Database backups and secure secret management

## Roadmap

- [ ] Screenshots and a short demo GIF in this README
- [ ] Automated tests (API and database queries)
- [ ] Docker and Docker Compose setup for one-command startup
- [ ] Email or SMS delivery of low-attendance alerts
- [ ] Live deployment (Render, Railway or similar) with a hosted MySQL database

## Author

**Abhishek Kumar Dubey**
B.Tech, Computer Science and Engineering, Technocrats Institute of Technology, Bhopal
GitHub: [@abhishek301104](https://github.com/abhishek301104)

## License

Released under the [MIT License](LICENSE).
