import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

// Activamos las variables de entorno de  nuestro archivo secreto 

dotenv.config();

// Creamos la aplicación de Express
const app = express();
app.use(cors()); // Habilita CORS para permitir solicitudes desde cualquier origen
app.use(express.json()); //permite que nuestra api entienda el formato json

// Conectamos a MongoDB usando Mongoose

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/roomsdb';

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

const roomSchema = new mongoose.Schema({

    name: String,
    category: String,
    price: Number,
    description: String,
    amenities: {type: [String], default: []} // Array de strings para las comodidades, con valor por defecto de array vacío

},
{
    collection:"Rooms" // Especificamos el nombre de la colección en MongoDB
}

)

const Rooms = mongoose.models.Rooms || mongoose.model('Rooms', roomSchema);

function getMongoDebugInfo() {
    return {
        database: currentDatabase || mongoose.connection.name,
        collection: Rooms.collection.name,
        readyState: mongoose.connection.readyState,
    };
}
  
// crearemos todas las rutas, get, post, put, delete

// Para debugear la conexión a MongoDB y ver el estado de la conexión, la base de datos actual y la colección utilizada, añadimos esta ruta:
app.get("/api/rooms-db", async(req: Request, res: Response) => {

    try {
        await connecttoMongo();
        res.json(getMongoDebugInfo());
    } catch (error) {
        console.error("Error al conectar a MongoDB:", error);
        res.status(500).json({ error: 'Error', detail:error instanceof Error ? error.message : 'Error desconocido' });
    }

})

//Get de todas las frases

app.get('/api/rooms', async (req: Request, res: Response) => {

    try {
        await connecttoMongo();
        const rooms = await Rooms.find();
        res.json(rooms)

    } catch (error) {
        console.error("Error al conectar a MongoDB:", error);
        res.status(500).json({ error: 'Error', detail:error instanceof Error ? error.message : 'Error desconocido' });
    }
})

app.post('/api/rooms', async (req: Request, res: Response) => {

    try {

        const {name, category, price, description, amenities} = req.body;
        if (!name || !category || !price || !description || amenities && !Array.isArray(amenities)) {
            res.status(400).json({ error: "you must send name, category, price and description" });

        }

        await connecttoMongo();
        const nuevoRoom = new Rooms({name, category, price, description, amenities});//Toma los datos que envia el usuario
        await nuevoRoom.save(); // Lo guarda en la ase de datos
        res.status(201).json(nuevoRoom); // 201 es ok elemento creado

    } catch (error) {
        console.error("Error al crear el room:", error);
        res.status(500).json({ error: 'Error', detail:error instanceof Error ? error.message : 'Error desconocido' });
    }
})

export default app;
   