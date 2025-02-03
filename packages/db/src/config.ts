import { config } from 'dotenv';
import  neo4j  from 'neo4j-driver';
// import { createClient } from '@supabase/supabase-js'

// config(); // Load .env file

// // TODO: move to .env
// const supabaseUrl = "https://glrmfmspkqmxhipsuhps.supabase.co"
// const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdscm1mbXNwa3FteGhpcHN1aHBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc4NDg3NjQsImV4cCI6MjA1MzQyNDc2NH0.TTHQ-lMLIVXw6SnS6svINpv-Rz1Wzat4Ws3xXn9rWvo"
// const Supabase = createClient(supabaseUrl, supabaseKey)

// export default Supabase 


const driver = neo4j.driver(
    'bolt://localhost:7687',
    neo4j.auth.basic('neo4j', 'Dixizutratamiwebltug12!'), // (2)
    { disableLosslessIntegers: true } // (3)
  )


export default driver