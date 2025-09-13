# Multi-Tenant SaaS Notes Application

## Objective
Develop and deploy a multi-tenant SaaS Notes Application hosted on Vercel. The application allows multiple tenants (companies) to securely manage their users and notes, while enforcing role-based access and subscription limits.

---

## Requirements

### 1. Multi-Tenancy
- Support at least two tenants: **Acme** and **Globex**.
- Ensure strict isolation: data belonging to one tenant must never be accessible to another.
- Approach used: **[document your approach here, e.g., shared schema with tenant ID, schema-per-tenant, or database-per-tenant]**.

### 2. Authentication and Authorization
- JWT-based login.
- Roles:
  - **Admin**: can invite users and upgrade subscriptions.
  - **Member**: can only create, view, edit, and delete notes.
- Mandatory test accounts (password: `password`):
  - `admin@acme.test` (Admin, tenant: Acme)
  - `user@acme.test` (Member, tenant: Acme)
  - `admin@globex.test` (Admin, tenant: Globex)
  - `user@globex.test` (Member, tenant: Globex)

### 3. Subscription Feature Gating
- **Free Plan**: Tenant limited to 3 notes.
- **Pro Plan**: Unlimited notes.
- Upgrade endpoint: `POST /tenants/:slug/upgrade` (Admin only).  
  After upgrade, note limit is lifted immediately.

### 4. Notes API (CRUD)
- POST `/notes` – Create a note
- GET `/notes` – List all notes for the current tenant
- GET `/notes/:id` – Retrieve a specific note
- PUT `/notes/:id` – Update a note
- DELETE `/notes/:id` – Delete a note
- Tenant isolation and role enforcement applied on all endpoints.

### 5. Deployment
- Backend and frontend hosted on **Vercel**.
- CORS enabled for scripts and dashboards.
- Health endpoint: `GET /health → { "status": "ok" }`.

### 6. Frontend
- Minimal frontend hosted on **Vercel**.
- Supports:
  - Login using predefined accounts.
  - Listing/creating/deleting notes.
  - Showing “Upgrade to Pro” when Free tenant reaches note limit.

---




## Author
**Prajakta Ukirde**  
Email: prajaktaukirde576@gmail.com
