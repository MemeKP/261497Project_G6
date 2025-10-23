<div align="center">
  <img src="https://ik.imagekit.io/496kiwiBird/261497project/logo.png?updatedAt=1761234425256" alt="Enso POS Logo" width="250"/>
</div>

# 🍜 Enso: Japanese Restaurant

## Project Overview

**Enso POS** is a modern, full-stack system designed specifically for Japanese restaurants focusing on efficient table management, group ordering, and flexible payment processing (including bill splitting).

The system streamlines the dining process from table assignment to final payment, providing real-time revenue tracking and a seamless experience for both staff (Admin Dashboard) and customers (Mobile/Web Ordering).

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
| **Styling** | [Tailwind CSS / Custom CSS/ ChartJS] 

### Backend (API)
| Layer | Technology | 
| :--- | :--- |
| **Runtime** | **Node.js** (Express)
| **Language** | **TypeScript**
| **ORM** | **Drizzle ORM** 

### Database
| Layer | Technology | 
| :--- | :--- |
| **Database** | **PostgreSQL (v15+)** 
| **Containerization** | **Docker** / **Docker Compose** 

---

## Getting Started (Local Development)

Follow these steps to set up and run the project locally using Docker.

### Step 1: Clone the Repository

```bash
git clone https://github.com/MemeKP/261497Project_G6.git
```

### Step 2: Build and Run Containers
```bash
docker-compose --env-file ./frontend/.env.local --env-file ./backend/.env.local up -d --force-recreate --build
```


