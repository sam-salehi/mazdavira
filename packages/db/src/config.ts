import { config } from 'dotenv';
import neo4j from 'neo4j-driver';
import path, { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from the .env file in the parent directory
// config({ path: '../.env' });


// // Check for required environment variables
// if (!process.env.NEO_HOST || !process.env.NEO_PASS) {
//     throw new Error("Missing required environment variables: NEO_HOST or NEO_PASS");
// }


const driver = neo4j.driver(
    "bolt://localhost:7687",
    neo4j.auth.basic('neo4j',"Dixizutratamiwebltug12!"),
    { disableLosslessIntegers: true }
);

export default driver