import express from "express";
import subjectsRouter from "./routes/subjects";
import cors from "cors";
import 'dotenv/config';

const app = express();
const PORT = 8000;

if (!process.env.FRONTEND_URL) {
    console.warn('Warning: FRONTEND_URL not set. CORS may not work as expected.');
}

app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use(express.json());

app.use('/api/subjects', subjectsRouter);

app.get('/', (req, res) => {
    res.send("Hello, Welcome to the classroom API");
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});