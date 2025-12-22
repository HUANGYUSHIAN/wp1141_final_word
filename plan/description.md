# Project Description

## Architecture

### Root Pages
- `/` - Landing page
- `/login` - Authentication page with Google OAuth and test login
- `/edit` - Profile editing page

### Student Pages (`/student`)
- `/student` - Student dashboard
- `/student/vocabulary` - Vocabulary book management (create, edit, delete, browse, AI generation, Excel upload)
- `/student/review` - Vocabulary review interface with flashcard system
- `/student/test` - Vocabulary test with multiple question types and scoring
- `/student/game` - Game center (Wordle, Snake, AI King) with point rewards
- `/student/grammar` - Grammar tutor with AI-powered chat assistance
- `/student/store` - Coupon browsing and lottery system
- `/student/setting` - User settings and LLM usage statistics
- `/student/feedback` - Feedback submission form

### Supplier Pages (`/supplier`)
- `/supplier` - Supplier dashboard
- `/supplier/coupon` - Coupon management (create, edit, delete, view owners)
- `/supplier/store` - Store management (create, edit, delete)
- `/supplier/setting` - Supplier settings
- `/supplier/feedback` - Feedback viewing

### Admin Pages (`/admin`)
- `/admin` - Admin dashboard
- `/admin/user` - User management (view, edit, delete, create, lock/unlock)
- `/admin/vocabulary` - Vocabulary book management (view, edit, delete, create)
- `/admin/vocabulary/upload` - Excel upload for vocabulary books
- `/admin/coupon` - Coupon management (view, edit, delete, create)
- `/admin/feedback` - Feedback management and response
- `/admin/setting` - System settings (LLM quota, lottery parameters, game parameters)
- `/admin/statistics` - Analytics dashboard with PostHog integration

### API Routes (`/api`)
- `/api/auth/[...nextauth]` - NextAuth.js authentication endpoints
- `/api/user` - User profile management
- `/api/user/select-role` - Role selection for new users
- `/api/student/*` - Student-specific APIs (vocabularies, games, grammar, coupons, LLM usage)
- `/api/supplier/*` - Supplier-specific APIs (coupons, stores)
- `/api/admin/*` - Admin-specific APIs (users, vocabularies, coupons, settings, statistics)
- `/api/feedback/*` - Feedback submission and management
- `/api/places/search` - Place search functionality

## Technologies

### AI & Machine Learning
- OpenAI API (GPT-4o-mini)
- PostHog Analytics
- Web Speech API (Speech Synthesis)

### Backend & Database
- Next.js App Router
- Next.js API Routes
- Prisma ORM
- MongoDB
- NextAuth.js (JWT Strategy)

### Authentication & Authorization
- Google OAuth 2.0 (PKCE Flow)
- NextAuth.js Session Management
- Middleware Route Protection

### Frontend Framework & UI
- React 19
- TypeScript
- Material-UI (MUI)
- Emotion (CSS-in-JS)

### Data Processing
- PapaParse (CSV/Excel parsing)
- XLSX (Excel file handling)
- Franc (Language detection)

### Utilities
- React Confetti
- React Use (Hooks library)
- Dotenv (Environment variables)

