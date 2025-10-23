<div align="center">
  <img src="https://ik.imagekit.io/496kiwiBird/261497project/logo.png?updatedAt=1761234425256" alt="Enso Logo" width="250"/>
</div>

# 🍜 Enso: Japanese Restaurant

## Project Overview

**Enso** is a modern, full-stack system designed specifically for Japanese restaurants focusing on efficient table management, group ordering, and flexible payment processing (including bill splitting).

The system streamlines the dining process from table assignment to final payment, providing real-time revenue tracking and a seamless experience for both staff (Admin Dashboard) and customers (Mobile Ordering).

---

## Team Members

| Name | Role | GitHub |
| :--- | :--- | :--- |
| Nunnapat sirithanachokpaisan 650610776 | **Backend:** Auth system | bbambiiisadeer |
| Chotima mankit 660610748 | **Frontend:** Customer Payment & Ordering Interface (Login, Register, Bill Pages) | quartins |
| Thanchanok Naensin 660610763 | **Backend:** Core Logic (Orders, Order Items, Billing, Database Management) | jjjaoant |
| Panita Donmuang 660610772 | **Frontend:** Admin Dashboard & Admin Management, Menu Management, Customer Detail Pages | MemeKP |

---

## Technology Stack
### Frontend
| Layer | Technology |
| :--- | :--- |
| **Framework** | **React** / **Vite**
| **Styling** | Tailwind CSS / Custom CSS/ ChartJS/ Lucide React/ Motion

### Backend (API)
| Layer | Technology | 
| :--- | :--- |
| **Runtime** | **Node.js** (Express)
| **Language** | **TypeScript**
| **ORM** | **Drizzle ORM** 

### Database
| Layer | Technology | 
| :--- | :--- |
| **Database** | **PostgreSQL** 
| **Containerization** | **Docker** / **Docker Compose** 

---

## Getting Started

Follow these steps to set up and run the project locally using Docker.

### Step 1: Clone the Repository

```bash
git clone https://github.com/MemeKP/261497Project_G6.git
```

### Step 2: Install Dependencies & Configure Environment
```bash
cd frontend && pnpm install
cp .env.local .env
cp frontend/.env.local frontend/.env 
cd backend && npm install
cp .env.local .env
cp backend/.env.local backend/.env 
# IMPORTANT: Fill in required secrets in .env files before running.
```

### Step 3: Build and Run Containers
This command builds the images, starts all services (DB, Backend, Frontend), runs Drizzle Migrations, and executes the initial Seed Data script automatically.
```bash
docker-compose --env-file ./frontend/.env --env-file ./backend/.env up -d --force-recreate --build
```

### Access the Application
Once the containers are running (Status Up), the application can be accessed via the following endpoints on port 5173
| User Type | Entry Path | Description |
| :--- | :--- | :--- |
| Admin Panel | http://localhost:5173/admin/dashboard | Requires Admin Login to access management features. |
| Customer Ordering | http://localhost:5173/tables/{sessionId} | Used by customers to join a dining session, view the menu, and place orders. |
| API Backend | http://localhost:3000 | The base URL for API endpoints |

### Final presentation
[View Final Project presentation (PDF)](./docs/Restaurant%20food%20Ordering%20Platform%20with%20Bill%20Splitting%20Feature.pdf)


