# House Agency Website

A production-level web application for a house agency built with Node.js, MySQL, HTML, CSS, and JavaScript.

## Features

- User registration and authentication (JWT and sessions)
- House listing and rental
- Check-in system with image capture
- Payment integration (Paystack and Flutterwave)
- Admin panel for managing houses, payouts, and resources
- Responsive UI with white, gold, blue, and black theme

## Setup

1. Install dependencies: `npm install`
2. Set up MySQL database: Run `database.sql`
3. Configure payment gateway keys in the code
4. Start the server: `npm start`
5. Access at http://localhost:3001

## Default Admin

- Email: admin@houseagency.com
- Password: admin

## Usage

- Public users can browse houses, check-in, and pay
- Landlords can upload houses and manage listings
- Admins can oversee operations and process payouts

## Security

- Password hashing with bcryptjs
- JWT for API authentication
- Session management
- Input validation and sanitization