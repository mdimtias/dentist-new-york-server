## **Dentist New Work Server Project**
***This project aims to create a server with a REST API using Express.js and MongoDB. The server will be used for a dental clinic's operations.***

## Installation
```bash
  git clone https://github.com/mdimtias/dentist-new-york-server.git

```
Install dependencies:
```bash
  npm install 
```

## Configuration
Create a .env file in the project root directory.
Set the following environment variables in the .env file:
PORT: The port number for the server (default: 5000).
URL: The MongoDB connection URL.
JWT_ACCESS_TOKEN_SECRET: Secret key for JSON Web Token (JWT) authentication.
EMAIL_SEND_KEY: mailgun send key. 
EMAIL_SEND_DOMAIN: mailgun domain key.
STRIPE_SECRET: stripe secret key. 

## Database Setup
    1. Ensure MongoDB is installed and running.
    2. Create a new database for the project.
    3. Update the DB_URL environment variable in the .env file with the MongoDB connection URL.
  

## Usage
Start the server: 
```bash 
npm start 
```

The server will be running at  
```bash
  http://localhost:<PORT> 
```
where <PORT> is the value set in the .env file.

## API Endpoints
#### The following REST API endpoints are available:

* `GET /appointmentOptions:` Get a list of all treatment data.
* `GET /booking`: Get a list of all booking data.
* `GET /booking/:id`: Get details of a specific booking data by id.
* `POST /bookings`: Create a new booking.
* `GET /doctors`: Get a list of all doctor data.
* `POST /doctor/:id`: Create a new doctors.
* `DELETE /doctors/:id`: Delete a specific doctor.

## Authentication
Authentication is implemented using JSON Web Tokens (JWT). To access protected endpoints, include the JWT in the request headers:

 ```
 Authorization: Bearer <JWT> 
 ```