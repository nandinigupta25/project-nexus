# 🚀 Project Nexus — Project Management Dashboard

\# Intern Details

\- \*\*Intern ID:\*\* CTTS095

\- \*\*Name:\*\* Nandini Gupta

A production-ready, full-stack project management platform built with **Java 21 + Spring Boot 3** on the backend and **React + Vite + Tailwind CSS** on the frontend.

---

## 📸 Features at a Glance

| Module | Features |
|---|---|
| **Auth** | JWT login/register, refresh tokens, role-based access (Admin · PM · Member) |
| **Projects** | Create, edit, archive, delete · status/priority tracking · progress bars |
| **Tasks** | Full CRUD · assignment · due dates · subtasks · comments · attachments |
| **Kanban** | Drag-and-drop board across To Do → In Progress → Review → Completed |
| **Teams** | Create teams · add/remove members · assign managers · metrics |
| **Dashboard** | Area charts, pie charts, bar charts · live stats · recent activity |
| **Notifications** | In-app notifications for task events · unread badge |
| **Activity Log** | Per-user and per-project audit trail |
| **Profile** | Edit profile · change password |
| **Swagger UI** | Full OpenAPI 3.0 documentation at `/api/swagger-ui.html` |

---

## 🛠 Tech Stack

### Backend
- **Java 21** + **Spring Boot 3.2**
- **Spring Security** + **JWT** (jjwt 0.12)
- **Spring Data JPA** + **Hibernate** (MySQL dialect)
- **MySQL 8.2**
- **Maven** build
- **Lombok** + **MapStruct**
- **SpringDoc OpenAPI** (Swagger UI)
- **JUnit 5** + **Mockito** tests

### Frontend
- **React 18** + **Vite 5**
- **Tailwind CSS 3** (dark theme)
- **React Router v6**
- **TanStack Query v5** (data fetching)
- **Zustand** (auth state)
- **@dnd-kit** (kanban drag & drop)
- **Recharts** (analytics charts)
- **React Hook Form** + **Zod** (validation)

### DevOps
- **Docker** + **Docker Compose**
- **Nginx** (production SPA serving + API proxy)
- **H2** (in-memory DB for tests)

---

## 🏗 Project Structure

```
project-nexus/
├── backend/                        # Spring Boot application
│   ├── src/
│   │   ├── main/java/com/nexus/
│   │   │   ├── config/             # Security, OpenAPI, Audit, Seed
│   │   │   ├── controller/         # REST controllers
│   │   │   ├── dto/
│   │   │   │   ├── request/        # Request DTOs + validation
│   │   │   │   └── response/       # Response DTOs
│   │   │   ├── entity/             # JPA entities
│   │   │   ├── enums/              # Role, Status, Priority enums
│   │   │   ├── exception/          # Custom exceptions + GlobalHandler
│   │   │   ├── repository/         # Spring Data JPA repositories
│   │   │   ├── security/           # JWT filter, UserDetailsService
│   │   │   ├── service/            # Service interfaces
│   │   │   │   └── impl/           # Service implementations
│   │   │   └── util/               # SecurityUtils
│   │   └── resources/
│   │       └── application.yml
│   ├── src/test/                   # JUnit + Integration tests
│   └── Dockerfile
├── frontend/                       # React application
│   ├── src/
│   │   ├── api/                    # Axios instance + service functions
│   │   ├── components/
│   │   │   └── layout/             # DashboardLayout with sidebar
│   │   ├── pages/                  # All page components
│   │   ├── store/                  # Zustand auth store
│   │   ├── App.jsx                 # Routes
│   │   ├── main.jsx                # Entry point
│   │   └── index.css               # Tailwind + custom components
│   ├── Dockerfile
│   └── nginx.conf
├── docker/
│   └── mysql/init.sql
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- **Java 21** (`java -version`)
- **Maven 3.9+** (`mvn -version`)
- **Node.js 20+** (`node -v`)
- **MySQL 8+** running locally or via Docker

---

### Option A — Docker (Recommended)

```bash
# 1. Clone the repo
git clone https://github.com/your-org/project-nexus.git
cd project-nexus

# 2. Copy and configure environment
cp .env.example .env

# 3. Start all services (db + backend + frontend)
docker-compose up -d

# 4. (Optional) include phpMyAdmin for DB inspection
docker-compose --profile dev up -d

# 5. Watch logs
docker-compose logs -f backend
```

| Service | URL |
|---|---|
| Frontend | http://localhost |
| Backend API | http://localhost:8080/api |
| Swagger UI | http://localhost:8080/api/swagger-ui.html |
| phpMyAdmin | http://localhost:8081 (dev profile) |

---

### Option B — Manual (VS Code)

#### 1. Start MySQL

```bash
# Via Docker (easiest)
docker run -d --name nexus-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=project_nexus \
  -p 3306:3306 \
  mysql:8.2
```

#### 2. Configure Backend

Edit `backend/src/main/resources/application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/project_nexus?...
    username: root
    password: root   # your MySQL root password
```

#### 3. Run Backend

```bash
cd backend
mvn spring-boot:run
# Backend starts at http://localhost:8080
# Seed data auto-loads on first run
```

#### 4. Run Frontend

```bash
cd frontend
npm install
npm run dev
# Frontend starts at http://localhost:5173
```

---

## 🔐 Default Credentials (Seeded on First Run)

| Role | Email | Password |
|---|---|---|
| **Admin** | admin@nexus.com | Admin@1234 |
| **Project Manager** | pm@nexus.com | Manager@1234 |
| **Developer** | dev1@nexus.com | Member@1234 |
| **Developer** | dev2@nexus.com | Member@1234 |
| **Designer** | designer@nexus.com | Member@1234 |

---

## 📡 API Endpoints

Full interactive docs available at `http://localhost:8080/api/swagger-ui.html`.

### Authentication
```
POST   /api/auth/login            Login and get JWT tokens
POST   /api/auth/register         Register new account
POST   /api/auth/refresh          Refresh access token
POST   /api/auth/logout           Logout (logs activity)
POST   /api/auth/change-password  Change password
```

### Projects
```
GET    /api/projects              List all projects (paginated)
POST   /api/projects              Create project
GET    /api/projects/{id}         Get project details
PUT    /api/projects/{id}         Update project
DELETE /api/projects/{id}         Delete project (Admin)
PATCH  /api/projects/{id}/archive Archive project
GET    /api/projects/search?q=    Search projects
GET    /api/projects/status/{s}   Filter by status
GET    /api/projects/my           Current user's projects
PATCH  /api/projects/{id}/progress Update progress %
```

### Tasks
```
GET    /api/tasks/project/{id}    Project's tasks
POST   /api/tasks                 Create task
GET    /api/tasks/{id}            Task details
PUT    /api/tasks/{id}            Update task
DELETE /api/tasks/{id}            Delete task
GET    /api/tasks/my              My assigned tasks
GET    /api/tasks/kanban/{pid}    Kanban board data
PATCH  /api/tasks/move            Move task (kanban)
GET    /api/tasks/search?q=       Search tasks
```

### Teams
```
GET    /api/teams                 List teams
POST   /api/teams                 Create team
GET    /api/teams/{id}            Team details
PUT    /api/teams/{id}            Update team
DELETE /api/teams/{id}            Delete team (Admin)
POST   /api/teams/{id}/members/{uid}    Add member
DELETE /api/teams/{id}/members/{uid}    Remove member
PATCH  /api/teams/{id}/manager/{uid}    Assign manager
```

### Comments & Notifications
```
GET    /api/tasks/{id}/comments   Get task comments
POST   /api/tasks/{id}/comments   Add comment
PUT    /api/tasks/{id}/comments/{cid}  Edit comment
DELETE /api/tasks/{id}/comments/{cid} Delete comment
GET    /api/notifications         My notifications
GET    /api/notifications/unread-count  Unread count
PATCH  /api/notifications/{id}/read     Mark read
PATCH  /api/notifications/read-all      Mark all read
```

### Dashboard & Activity
```
GET    /api/dashboard/stats       Aggregated analytics
GET    /api/activity-logs         All logs (Admin)
GET    /api/activity-logs/me      My activity
GET    /api/activity-logs/project/{id}  Project activity
```

---

## 🧪 Running Tests

```bash
cd backend

# Run all tests
mvn test

# Run only unit tests
mvn test -Dtest="*Test"

# Run only integration tests
mvn test -Dtest="*IntegrationTest"

# Generate coverage report
mvn verify
# Report at: target/site/jacoco/index.html
```

---

## 🗄 Database Schema

### Core Tables
| Table | Description |
|---|---|
| `users` | Accounts with role (ADMIN / PROJECT_MANAGER / TEAM_MEMBER) |
| `teams` | Groups of users with a designated manager |
| `team_members` | Many-to-many: teams ↔ users |
| `projects` | Projects with status, priority, dates, budget |
| `project_members` | Many-to-many: projects ↔ users |
| `tasks` | Tasks nested under projects, with status + priority |
| `comments` | Threaded comments on tasks |
| `attachments` | File uploads linked to tasks |
| `notifications` | In-app notification inbox per user |
| `activity_logs` | Full audit trail of all actions |

### Key Relationships
- **User → Teams**: Many-to-Many via `team_members`
- **User → Projects**: Many-to-Many via `project_members`
- **Project → Tasks**: One-to-Many
- **Task → Comments**: One-to-Many (threaded with `parent_comment_id`)
- **Task → Attachments**: One-to-Many
- **Task → Task**: Self-referential (subtasks via `parent_task_id`)

---

## 🔧 Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DB_USERNAME` | root | MySQL username |
| `DB_PASSWORD` | root | MySQL password |
| `JWT_SECRET` | (long string) | JWT signing secret — **change in production** |
| `CORS_ORIGINS` | http://localhost:5173 | Allowed CORS origins |
| `UPLOAD_DIR` | uploads | File upload directory |
| `VITE_API_URL` | /api | Frontend API base URL |

---

## 📦 Building for Production

```bash
# Backend JAR
cd backend && mvn clean package -DskipTests
# Output: target/project-nexus-1.0.0.jar

# Frontend static build
cd frontend && npm run build
# Output: dist/

# Full Docker production build
docker-compose build
docker-compose up -d
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
  Built with ❤️ using Java 21, Spring Boot 3, React 18, and Tailwind CSS
</div>
