# RentMate

RentMate is a full-stack shared rental and expense management system for students and roommates. It uses vanilla HTML/CSS/JavaScript on the frontend, with Node.js, Express, MongoDB, and Mongoose on the backend.

## Features

- Secure registration and login using hashed passwords and JWT-protected APIs
- Create a house, share a generated joining code, and view house members
- Configure total rent and due date; automatically create monthly member payment records
- Add shared expenses and dynamically calculate individual settlement amounts
- Mark settlements paid, report maintenance issues, and manage rotating chores
- House-wide notifications and a summary dashboard

## Run locally

1. Install and start MongoDB locally, or prepare a MongoDB Atlas connection string.
2. Copy `.env.example` to `.env` and supply `MONGODB_URI` and a long `JWT_SECRET` value.
3. Install packages with `npm install`.
4. Start the app with `npm start`.
5. Open `http://localhost:5000`.

Use `npm run dev` during development for automatic server restarts.

## Project layout

- `public/` contains responsive HTML pages, CSS, and browser-side Fetch API logic.
- `server/models/` contains the eight Mongoose data models.
- `server/controllers/` contains the application logic for authentication, houses, and core features.
- `server/routes/` contains REST API route definitions.
- `server/middleware/` contains JWT protection middleware.

## Notes for demonstration

Create a house from **My House**, then share its joining code with accounts created for other group members. Set the monthly rent in house settings. When an expense is added, RentMate creates pending settlements for every selected member except the payer.
