# AI FitFinder

AI-powered clothing size recommendations. Users pick a category and brand, upload (or capture) body photos, and get a brand-specific size with a confidence score, measurement breakdown, and shoppable products.

## Stack

| Layer | Tech |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS v4, Framer Motion, Zustand, SWR, React Hook Form + Zod |
| Backend | FastAPI, Motor (MongoDB), JWT auth, bcrypt, MediaPipe Pose + OpenCV |
| Storage | MongoDB, Cloudinary (optional photo storage) |
| Deploy | Docker, docker-compose, Nginx |

## Quick start (local)

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # then set JWT_SECRET (and optional keys)
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

You need MongoDB running locally (`mongodb://localhost:27017`) or a MongoDB Atlas URI in `MONGO_URI`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api` to `http://localhost:8000`.

## Docker

```bash
cp backend/.env.example backend/.env   # set JWT_SECRET
docker compose up --build
```

- App: http://localhost
- API: http://localhost:8000/docs

## CI/CD (GitHub Actions)

| Workflow | Runs on | What it does |
| --- | --- | --- |
| `.github/workflows/ci.yml` | pull requests, pushes to other branches | Backend: ruff + pytest + import check. Frontend: typecheck + build. Builds both Docker images. |
| `.github/workflows/cd.yml` | push to `main`, `v*` tags | Runs CI, publishes images to GitHub Container Registry (`ghcr.io/<owner>/<repo>/backend` and `/frontend`), then optionally deploys over SSH. |

Dependabot (`.github/dependabot.yml`) opens weekly update PRs for pip, npm, Docker and Actions.

**Run the backend checks locally**

```bash
cd backend && pip install -r requirements.txt -r requirements-dev.txt
ruff check . && pytest
```

**Enable deployment (optional)** - in the repo's *Settings > Secrets and variables > Actions*:

- Variable `DEPLOY_ENABLED` = `true`
- Secrets `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` (private key), `DEPLOY_PATH` (folder on the server)
- Put `backend/.env` in `DEPLOY_PATH` on the server. The deploy job copies `docker-compose.prod.yml` there and runs `docker compose pull && up -d`.
- Optional variable `VITE_GOOGLE_CLIENT_ID` for the frontend build.

The server needs Docker with the compose plugin, and the packages must be readable by it (make the GHCR packages public, or log in on the server with a token that has `read:packages`).

## Environment variables

**backend/.env**

| Name | Required | Description |
| --- | --- | --- |
| `MONGO_URI` | yes | MongoDB connection string |
| `MONGO_DB` | yes | Database name |
| `JWT_SECRET` | yes | Long random string (`openssl rand -hex 32`) |
| `ACCESS_TOKEN_MINUTES` | no | Normal session length |
| `REMEMBER_ME_DAYS` | no | "Remember me" session length |
| `CORS_ORIGINS` | yes | JSON list of allowed frontend origins |
| `FRONTEND_URL` | yes | Used in password-reset links |
| `CLOUDINARY_*` | no | Enables saving uploaded photos |
| `GOOGLE_CLIENT_ID` | no | Enables Google sign-in |

**frontend/.env**

| Name | Description |
| --- | --- |
| `VITE_API_URL` | API base URL (default `/api`) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID |

## User flow

Login → Home (audience + category) → Brands → Upload/Camera → Processing → Result → Shopping → Profile

## How sizing works

1. **Pose detection** — MediaPipe extracts 33 body landmarks from each photo.
2. **Measurement estimation** — landmark distances are scaled to centimetres using the user's height, and front/side widths are combined with an ellipse model to estimate chest, waist and hip circumferences.
3. **Size matching** — measurements are compared with the selected brand's size chart; the closest size wins, and the confidence score blends chart fit with photo quality.

## Project structure

```
AI-FitFinder/
├── backend/app/
│   ├── ai/              pose detection + sizing engine
│   ├── auth/            register, login, Google, password reset
│   ├── brands/          brand catalog + size charts
│   ├── upload/          photo analysis endpoint
│   ├── recommendation/  size recommendation endpoint
│   ├── shopping/        product search + purchase tracking
│   ├── history/         measurement + recommendation history
│   ├── users/           profile + favorites
│   ├── core/            config + security
│   ├── database/        MongoDB client
│   └── models/          Pydantic schemas
└── frontend/src/
    ├── pages/           one folder per route
    ├── components/      reusable UI
    ├── services/        API clients
    ├── store/           Zustand stores
    ├── hooks/           SWR + camera hooks
    ├── routes/          route guards
    └── layouts/         app + auth layouts
```

## Production notes

- Product links are generated search URLs per store. For live catalogs, swap `backend/app/shopping/routes.py` for real affiliate/partner APIs.
- Password-reset emails are logged to the console in development. Connect an email provider (e.g. Resend, SES) in `auth/routes.py` before going live.
- Size charts in `brands/data.py` are representative. Verify them against each brand's official chart.
