// Email configuration
// This file is now deprecated - we're using environment variables from .env file

/*
* IMPORTANT: Email credentials are now stored in the .env file
* 
* For security reasons:
* 1. Never hardcode credentials in your code files
* 2. Always use environment variables for sensitive information
* 3. Keep your .env file in .gitignore to prevent accidental exposure
* 4. Use .env.example with placeholder values for documentation
*/

// This file is kept for backward compatibility
// It now loads credentials from environment variables
require('dotenv').config();

module.exports = {
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || ''
};
