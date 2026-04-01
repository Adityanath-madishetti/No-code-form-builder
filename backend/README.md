# Backend — Form Builder API

Express 5 REST API with MongoDB (Mongoose 9) and JWT authentication.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/formbuilder` |
| `JWT_SECRET` | Secret for signing JWTs | `your-secret-key` |

## Project Structure

```
src/
├── server.js              # Entry point (connects DB, starts server)
├── app.js                 # Express app (middleware, routes)
├── config/                # Environment config
├── db/                    # MongoDB connection
├── middleware/
│   ├── auth.js            # verifyToken, optionalAuth (JWT)
│   └── errorHandler.js    # Centralized error handler
├── models/
│   ├── User.js            # User schema (email, uid, role)
│   ├── Form.js            # Form header (formId, title, isActive)
│   ├── FormVersion.js     # Versioned form content (pages, components)
│   └── Submission.js      # User submissions (responses per page)
├── controllers/
│   ├── authController.js  # Login (email upsert + JWT)
│   ├── userController.js  # User CRUD
│   ├── formController.js  # Form CRUD, publish, public access
│   ├── formVersionController.js  # Version CRUD, clone
│   └── submissionController.js   # Submit, list, user history
├── routes/                # Route definitions
├── tests/                 # Test files
└── utils/                 # Utility helpers
```

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/login` | — | Login/register with email, returns JWT |

### Forms

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/forms` | ✅ | Create a new form |
| `GET` | `/api/forms` | ✅ | List user's forms |
| `GET` | `/api/forms/:formId` | ✅ Owner | Get form header |
| `PATCH` | `/api/forms/:formId` | ✅ Owner | Update title/status |
| `DELETE` | `/api/forms/:formId` | ✅ Owner | Soft-delete form |
| `POST` | `/api/forms/:formId/publish` | ✅ Owner | Publish form (sets isActive, marks version non-draft) |
| `GET` | `/api/forms/:formId/public` | ✅ Any | Get published version for filling |

### Versions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/forms/:formId/versions` | ✅ | List all versions |
| `GET` | `/api/forms/:formId/versions/latest` | ✅ | Get latest version |
| `GET` | `/api/forms/:formId/versions/:version` | ✅ | Get a specific version |
| `POST` | `/api/forms/:formId/versions` | ✅ | Clone latest → new version |
| `PUT` | `/api/forms/:formId/versions/:version` | ✅ | Update a version |

### Submissions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/forms/:formId/submissions` | Optional | Submit a form response |
| `GET` | `/api/forms/:formId/submissions` | ✅ Owner | List submissions for a form |
| `GET` | `/api/forms/:formId/submissions/:id` | ✅ Owner | Get a single submission |
| `GET` | `/api/submissions/mine` | ✅ | List logged-in user's submissions |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm start` | Start in production mode |
