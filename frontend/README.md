# Frontend – Healthcare Platform

## Overview

This is the frontend application for the Healthcare Platform. It is built using React with TypeScript and Vite as the development server and build tool.

The frontend communicates with the FastAPI backend for authentication and user-related functionality.

---

## Technology Stack

- React
- TypeScript
- Vite
- Fetch API
- JWT-based authentication

---

## Running the Frontend

From inside the `frontend` directory:

npm install  
npm run dev

The development server runs at:

http://localhost:5173

---

## Features

- User registration
- User login
- JWT token storage in localStorage
- Role-based routing
- Protected route handling
- Integration with backend API endpoints

---

## Backend Requirement

The frontend expects the backend server to be running at:

http://127.0.0.1:8000

CORS is configured in the backend to allow requests from:

http://localhost:5173

---

## Project Structure

frontend/
│
├── src/               Application source code  
├── public/            Static assets  
├── package.json       Project dependencies  
└── vite.config.ts     Vite configuration  

---

## Notes

- The `node_modules` directory should not be included when sharing the project.
- Dependencies are installed using `npm install`.
- This project uses the Vite development server for local development.