import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import routes
import apiRoutes from './routes/api.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use( cors() );
app.use( helmet() );
app.use( morgan( 'dev' ) );
app.use( express.json() );
app.use( express.urlencoded( { extended: true } ) );

// Root route
app.get( '/', ( req, res ) =>
{
    res.json( {
        message: 'Welcome to the Legendary Test API',
        version: '1.0.0',
        endpoints: {
            root: '/',
            health: '/health',
            api: {
                features: '/api/features',
                featureById: '/api/features/:id',
                protected: '/api/protected'
            }
        }
    } );
} );

// Routes
app.use( '/api', apiRoutes );

// Health check endpoint
app.get( '/health', ( req, res ) =>
{
    res.json( { status: 'ok', timestamp: new Date().toISOString() } );
} );

// Error handling middleware
app.use( ( err, req, res, next ) =>
{
    console.error( err.stack );
    res.status( 500 ).json( {
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    } );
} );

// Start server
app.listen( PORT, () =>
{
    console.log( `🚀 Server is running on http://localhost:${PORT}` );
    console.log( `📝 API Documentation available at http://localhost:${PORT}/api` );
    console.log( `🔍 Health check available at http://localhost:${PORT}/health` );
} ); 