// Example feature data
const features = [
    {
        id: 1,
        name: 'UI Components',
        description: 'A comprehensive set of reusable UI components',
        category: 'frontend'
    },
    {
        id: 2,
        name: 'Monorepo Architecture',
        description: 'Modern monorepo structure for scalable applications',
        category: 'architecture'
    },
    {
        id: 3,
        name: 'API Routes',
        description: 'RESTful API endpoints with Express.js',
        category: 'backend'
    }
];

export const getFeatures = ( req, res ) =>
{
    try
    {
        const { category } = req.query;

        if ( category )
        {
            const filteredFeatures = features.filter( feature =>
                feature.category.toLowerCase() === category.toLowerCase()
            );
            return res.json( filteredFeatures );
        }

        res.json( features );
    } catch ( error )
    {
        res.status( 500 ).json( { error: 'Failed to fetch features' } );
    }
};

export const getFeatureById = ( req, res ) =>
{
    try
    {
        const { id } = req.params;
        const feature = features.find( f => f.id === parseInt( id ) );

        if ( !feature )
        {
            return res.status( 404 ).json( { error: 'Feature not found' } );
        }

        res.json( feature );
    } catch ( error )
    {
        res.status( 500 ).json( { error: 'Failed to fetch feature' } );
    }
}; 