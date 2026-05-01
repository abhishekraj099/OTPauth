const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const config = require('./config');
const { globalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth.routes');

const app = express();

app.use(helmet());
app.use(compression());
app.use(cors({
	origin: config.app.allowedOrigins,
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(globalLimiter);
app.use(morgan(config.isProduction ? 'combined' : 'dev'));

const swaggerOptions = {
	definition: {
		openapi: '3.0.0',
		info: { title: 'Email OTP Auth API', version: '1.0.0', description: 'Production Email OTP Authentication System' },
		servers: [{ url: `http://localhost:${config.port}/api/v1` }],
		components: {
			securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
		},
	},
	apis: ['./src/routes/*.js'],
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerJsdoc(swaggerOptions)));
app.get('/health', (req, res) => res.json({ status: 'ok', env: config.env, timestamp: new Date() }));
app.use('/api/v1/auth', authRoutes);
app.use(errorHandler);

module.exports = app;
