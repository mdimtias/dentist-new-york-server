# New Work Server Project
*** This project aims to create a server with a REST API using Express.js and MongoDB. The server will be used for a dental clinic's operations. ***

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
  

