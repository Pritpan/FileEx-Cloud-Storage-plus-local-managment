# FileEx - Project Context Summary

**Use this document to establish context when starting a new chat session.**

## 1. Project Overview
**FileEx** is a cloud storage platform (similar to Google Drive/Dropbox) with a monolithic Node.js/Express backend and a React frontend. The application uses a unified file/folder architecture (both stored in the same database table).

## 2. Tech Stack
*   **Backend:** Node.js, Express, Prisma ORM, MySQL, AWS S3 (AWS SDK v3), JSON Web Tokens (dual-token strategy).
*   **Frontend:** React 18.3.1, Vite 6, Tailwind CSS v4, shadcn/ui, React Router DOM, Axios, Zustand (global state), TanStack React Query (server state), React Hook Form, Zod, Lucide React.

## 3. Backend State (Fully Implemented)
The backend API is complete and architecturally stable. 
*   **Authentication:** Registration, Login, dual-token JWT (access token in memory, refresh token in HTTP-only cookie).
*   **Files & Folders:** Unified model (`type = 'FILE' | 'FOLDER'`). Supports creating folders, renaming, moving, listing, and a two-phase S3 upload flow (presigned PUT URLs).
*   **Trash Management:** Soft-delete via `deletedAt`. Supports listing trash, recursive restoration, and permanent deletion (which clears S3 and reclaims quota).
*   **Search:** Case-insensitive partial matching on `displayName`.
*   **Storage Quotas:** `StorageStats` table accurately tracks `usedStorage` vs `storageLimit` using transactions.

## 4. Frontend State (Foundation Complete)
The frontend architecture and infrastructure have been fully initialized according to strict feature-based rules.
*   **Structure:** Cleanly separated into `components/` (ui, common, layout), `features/` (auth, explorer, storage, trash, settings), `hooks/`, `layouts/`, `lib/`, `routes/`, `store/`, and `utils/`.
*   **Routing:** `AppRouter.jsx` manages public/protected zones via `ProtectedRoute.jsx` and `PublicRoute.jsx`.
*   **State Management:** Zustand stores are initialized (`auth.store.js`, `ui.store.js`, `explorer.store.js`). React Query is configured (`queryClient.js`).
*   **API Configuration:** Axios instance (`lib/axios.js`) is fully configured to use `VITE_API_URL`, handle `withCredentials: true`, and perform silent token refreshes on `401` errors. Endpoints are centralized in `constants/api.js`.
*   **No Business Logic Yet:** The frontend is a clean slate ready for feature implementations.

## 5. Immediate Next Steps
The next logical phase of development is to start implementing the **Frontend Business Features**, beginning with:
1.  **Auth Feature:** Building the `LoginPage.jsx` and `RegisterPage.jsx` inside `features/auth/pages/`, connecting them to React Hook Form/Zod, and wiring them into `AppRouter.jsx`.
2.  **Layouts:** Building the `DashboardLayout` (Sidebar + Header).
3.  **File Explorer:** Implementing the grid/list views, navigation breadcrumbs, and upload logic.
