import express from 'express';
import llmRouter from './routes/llmRoutes.js';
import dotenv from 'dotenv';
import fileUpload from 'express-fileupload';

// config file location
dotenv.config({ path: './config.env' });

const app = express();

app.use(fileUpload());

// body-parser, reading data from body into req.body
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/v1/llm', llmRouter);

app.listen(3000, () => {
	console.log('server listening on port 3000');
});
