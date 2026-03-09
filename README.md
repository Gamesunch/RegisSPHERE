# RegisSPHERE

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

RegisSPHERE is a modern, comprehensive student portal and university management system designed to streamline the academic experience. Built with a focus on usability and clarity, the application offers students a centralized platform to manage their profile, perform course enrollments, track their class schedules, and monitor their academic performance.

## Core Features

- **Dynamic Localization**: Built-in, instant switching between English and Thai languages across the entire application interface.
- **Secure Authentication**: Robust user registration and login flows utilizing JWT for session management and Bcrypt for password hashing. Includes specific Student, Professor, and Admin roles.
- **Student Dashboard**: A central hub providing an overview of the student's status with quick navigation to primary academic modules.
- **Professor Portal**: Dedicated dashboard for professors to view their assigned courses, manage class rosters, and oversee course details.
- **University News & Announcements**: Global university news system alongside course-specific announcement feeds to keep students and staff informed.
- **Profile Management**: A dedicated settings module allowing users to upload custom profile pictures safely and edit biographical details.
- **Course Enrollment**: An interactive catalog allowing students to search for available courses, view detailed metrics (credits, schedules, capacity, professor), and manage live enrollments or drops.
- **Academic Scheduling**: A detailed "My Courses" interface segmented into logical tabs:
    - **Enrolled Courses**: Overview of current enrollments.
    - **Study Timetable**: An automatically generated, visual grid calendar of the student's week, complete with a functionality to export the timetable as a PNG image.
    - **Exam Schedule**: Clear breakdowns of midterm and final exam dates for enrolled subjects.
- **Grades and Progress Tracking**: A dedicated module to view academic results, offering sorting by Academic Year, visual grade badges, and automatic calculations for Semester GPA and Cumulative GPAX.
- **Modern Minimalist Interface**: Clean UI built on a unified color system, leveraging Framer Motion for sophisticated animations and glassmorphism principles.

## Technology Stack

The application infrastructure utilizes a modern full-stack web architecture:

| Component | Technologies Utilized |
| :--- | :--- |
| **Frontend Runtime** | React 19, Vite |
| **Frontend Libraries** | React Router DOM for routing, Framer Motion for animation, Lucide React for iconography, html2canvas for image export |
| **Backend Runtime** | Node.js, Express 5 |
| **Backend Modules** | JSON Web Tokens (auth), Bcrypt (encryption), Multer (file uploads), pg (database connectivity) |
| **Database Structure** | PostgreSQL hosted via Supabase |
| **Styling Protocol** | Vanilla CSS using global custom variable properties |

## System Flow Architecture

```mermaid
graph TD
    User((Client Request)) <-->|React GUI| Vite[Vite Build/Dev Server]
    Vite <-->|RESTful API | Express[Express Node.js Server]
    Express <-->|Database Queries| PG[(PostgreSQL / Supabase)]
    Express ---|JWT Verification| Middleware[Auth / Authorization Middleware]
    Express ---|File System| Multer[Local File Uploads / Profile Pictures]
```

## Project Structure

The repository is modularly split into the frontend client and the backend server.

```text
COOP/
├── backend/                # Node.js + Express backend server
│   ├── src/
│   │   ├── config/         # Database and connection settings
│   │   ├── controllers/    # API business logic
│   │   ├── middlewares/    # Authentication interceptors
│   │   ├── routes/         # API endpoint definitions
│   │   └── app.js          # Core Express application setup
│   ├── .env                # Local environment variables (ignored in Git)
│   ├── check_schema.js     # Database initialization script
│   ├── migrate_grades.js   # Grades migration script
│   └── seed_courses.js     # Sample data generation script
├── frontend/               # React client application
│   ├── src/
│   │   ├── components/     # Reusable React components (e.g., Form controls)
│   │   ├── context/        # Global React Contexts (e.g., Language translations)
│   │   ├── pages/          # Full-page view components (Dashboard, Grades, etc.)
│   │   ├── translations.js # Centralized EN/TH translation dictionary
│   │   ├── App.jsx         # Primary router and application structure
│   │   └── index.css       # Global stylesheet and CSS variables
│   └── vite.config.js      # Build configurations for Vite
└── README.md               # Primary project documentation
```

## Setup and Installation

### Prerequisites
Ensure your local development environment has the following dependencies:
- Node.js (Version 18.x or higher)
- npm (Node Package Manager)

### 1. Repository Setup
Clone the repository and access the root directory:
```bash
git clone https://github.com/your-username/university-coop.git
cd university-coop
```

### 2. Backend Initialization
Access the backend directory, install packages, and prepare the environment:
```bash
cd backend
npm install
```
Create a `.env` file within the `backend/` directory and apply the following variables:
```env
PORT=5000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_secure_randomjwt_string
```

Run database migrations to initialize tables and sample data (ensure `DATABASE_URL` is active):
```bash
node check_schema.js
node seed_courses.js
node migrate_exam.js
node migrate_grades.js
```

### 3. Frontend Initialization
Return to the root directory, transition to the frontend directory, and install packages:
```bash
cd ../frontend
npm install
```

### 4. Running the Development Environments
The architecture requires both the server and client running concurrently. Utilize two separate terminal instances.

**Initialize Backend Server:**
```bash
cd backend
npm run dev
```

**Initialize Frontend Client:**
```bash
cd frontend
npm run dev
```

The frontend application will be served at `http://localhost:5173/`, seamlessly proxying backend requests to `http://localhost:5000/`.

## Key REST API Endpoints

The modular backend structure exposes the following capabilities:

| Domain | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Authentication** | `POST` | `/api/auth/register` | Account creation |
| **Authentication** | `POST` | `/api/auth/login` | Session initiation |
| **Profile** | `GET` | `/api/profile` | Retrieve user details |
| **Profile** | `PUT` | `/api/profile` | Update user context (Bio) |
| **Profile** | `POST` | `/api/profile/picture` | Handle image buffer uploads via Multer |
| **Courses** | `GET` | `/api/courses` | Retrieve available course catalog |
| **Enrollment** | `POST` | `/api/enrollments` | Process new student enrollment |
| **Enrollment** | `GET` | `/api/enrollments/mine` | Retrieve active student enrollments |
| **Enrollment** | `DELETE` | `/api/enrollments/:id` | Drop specified course |
| **Grades** | `GET` | `/api/grades/mine` | Aggregated GPA, academic year, and grading data |

## License
This software project is restricted under the ISC License.
