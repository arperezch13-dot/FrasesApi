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
  
// crearemos todas las rutas, get, post, put, delete

// Para debugear la conexión a MongoDB y ver el estado de la conexión, la base de datos actual y la colección utilizada, añadimos esta ruta:
app.get("/api/debug-db", async(req: Request, res: Response) => {

    try {
        await connecttoMongo();
        res.json(getMongoDebugInfo());
    } catch (error) {
        console.error("Error al conectar a MongoDB:", error);
        res.status(500).json({ error: 'Error', detail:error instanceof Error ? error.message : 'Error desconocido' });
    }

})

//Get de todas las frases

app.get('/api/frases', async (req: Request, res: Response) => {

    try {
        await connecttoMongo();
        const frases = await Frase.find();
        res.json(frases)

    } catch (error) {
        console.error("Error al conectar a MongoDB:", error);
        res.status(500).json({ error: 'Error', detail:error instanceof Error ? error.message : 'Error desconocido' });
    }
})

app.post('/api/frases', async (req: Request, res: Response) => {

    try {

        const {text, autor} = req.body;
        if (!text || !autor) {
            res.status(400).json({ error: "debes enviar texto y autor" });

        }
        await connecttoMongo();
        const nuevaFrase = new Frase({text, autor});//Toma los datos que envia el usuario
        await nuevaFrase.save(); // Lo gurada en la ase de datos
        res.status(201).json(nuevaFrase); // 201 es ok elemento creado 

    } catch (error) {
        console.error("Error al crear la frase:", error);
        res.status(500).json({ error: 'Error', detail:error instanceof Error ? error.message : 'Error desconocido' });
    }
})

export default app;
   