# Upskill UI

<img src="./public/logo.png" alt="Upskill Logo" width="200" />

Upskill UI is the frontend for an e-learning platform built with Next.js. It supports learner, instructor, and admin workflows including course discovery, enrollment, learning progress, cart/checkout, instructor course management, and account security features such as 2FA.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Authentication and Route Guards](#authentication-and-route-guards)
- [Payments](#payments)

## Overview

This project uses the Next.js Pages Router and integrates with an external API backend via environment-configured endpoints. A prebuild step prepares local static assets used by the UI before development/build runs.

## Features

- Course browsing, category navigation, and search-oriented discovery
- Cart and checkout flow with PayPal support
- Course learning experience with video/article lecture previews and progress updates
- Instructor dashboard for course creation, curriculum management, pricing, and student view
- User profile management (basic info, avatar, security, payout settings)
- Admin area with role-aware access control
- JWT cookie-based authentication with middleware route protection

## Screenshots

<img src="./screenshots/homepage.png" alt="Homepage Screenshot" width="600" />

## Tech Stack

- **Framework:** Next.js 15 (Pages Router), React 19
- **State/Data:** SWR, Zustand, Axios
- **UI/Editor/Media:** TinyMCE, Monaco Editor, video players (Video.js, Plyr, HLS.js, Vidstack)
- **Auth/Security:** JOSE (JWT verification), middleware route guards
- **Styling:** Tailwind CSS 4, global CSS

## Prerequisites

- Node.js 20+ (recommended)
- npm 10+ (recommended)
- A running backend API for Upskill

## Getting Started

```bash
git clone https://github.com/localnetwork/upskill-ui.git
cd upskill-ui
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000` in your browser.

## Environment Variables

Create `.env.local` in the project root:

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Yes | Base API URL used by frontend requests (example: `http://localhost:4000/api`) |
| `NEXT_PUBLIC_API_DOMAIN` | Yes | API domain used for media URLs and Next image allowlist (example: `http://localhost:4000`) |
| `NEXT_PUBLIC_TOKEN` | Yes | Auth token cookie key (example: `upskill-token`) |
| `NEXT_PUBLIC_JWT_SECRET` | Yes | JWT secret used by middleware verification |
| `NEXT_PUBLIC_REFRESH_TOKEN` | Optional | Refresh token cookie key override |
| `NEXT_PUBLIC_TINYMCE_API_KEY` | Optional | TinyMCE API key for rich text editors |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | Optional | PayPal client ID used in payout settings UI |
| `PAYPAL_CLIENT_ID` | Optional | Server-side PayPal client ID used by API route callbacks |
| `PAYPAL_CLIENT_SECRET` | Optional | Server-side PayPal client secret used by API route callbacks |

The repository includes `.env.example` with starter values for the core frontend variables.

## Available Scripts

- `npm run dev` - Runs prebuild script and starts the dev server with Turbopack
- `npm run build` - Runs prebuild script and creates a production build
- `npm run start` - Starts the production server
- `npm run lint` - Runs ESLint

## Project Structure

```text
pages/          Next.js routes (public, learner, instructor, admin, api callbacks)
components/     Reusable UI components and domain entities
lib/api/        API request wrappers and interceptors
lib/store/      Zustand stores and persistent state
lib/services/   Utility/service helpers
lib/preBuildScripts/  Prebuild data generation scripts
middleware.js   Route guards and auth/role checks
styles/         Global styles
public/         Static assets
screenshots/    Documentation screenshots
```

## Authentication and Route Guards

- Middleware checks authentication cookie(s) and verifies JWT payload when available.
- Protected routes (e.g. profile, checkout, cart, admin) redirect unauthenticated users to login.
- Auth pages (login/register/verify-2fa) redirect authenticated users away.
- Admin routes require an admin role and redirect unauthorized users to home.

## Payments

- Checkout flow is integrated with backend-driven payment processing.
- PayPal callback handling exists under `pages/api/paypal/callback/index.js`.
- Ensure payment-related environment variables are set before testing payout/checkout flows.
