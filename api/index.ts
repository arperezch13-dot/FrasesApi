import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Activamos las variables de entorno de  nuestro archivo secreto 

dotenv.config();

// Creamos la aplicación de Express
const app = express();
app.use(express.json()); //permite que nuestra api entienda el formato json

// Conectamos a MongoDB usando Mongoose

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/fraseapi';

if (!mongoURI) {
  throw new Error ('Falta la variable de entorno');
}

const mongoUriValidated: string = mongoURI;

let isMongoConnected = false;
let currentDatabase = ''; // Valor por defecto y se actualizara al conectar

async function connecttoMongo() {
    if (isMongoConnected) return;

    //Si existe DB_NAME, forzamos ese nombre de base en la conexión

    const dbNameFromEnv = process.env.DB_NAME;
    const connectionOptions = dbNameFromEnv ? { dbName: dbNameFromEnv } : undefined;

    await mongoose.connect(mongoUriValidated, connectionOptions);
    currentDatabase = mongoose.connection.name;

}

// Creamos el molde (Esquema para nuestras frases)

const fraseSchema = new mongoose.Schema({

    text: String,
    autor: String,
},
{
    collection:"Frasesclase"
}

)

const Frase = mongoose.models.Frases || mongoose.model('Frases', fraseSchema);

function getMongoDebugInfo() {
    return {
        database: currentDatabase || mongoose.connection.name,
        collection: Frase.collection.name,
        readyState: mongoose.connection.readyState,
    };
}
  