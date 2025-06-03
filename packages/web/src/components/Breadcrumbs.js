import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Breadcrumbs = () =>
{
    const location = useLocation();
    const pathnames = location.pathname.split( '/' ).filter( ( x ) => x );

    const getBreadcrumbName = ( path ) =>
    {
        const names = {
            features: 'Features',
            components: 'Components',
            architecture: 'Architecture',
            'getting-started': 'Getting Started',
            'quick-start': 'Quick Start',
            installation: 'Installation',
            configuration: 'Configuration',
        };
        return names[path] || path.charAt( 0 ).toUpperCase() + path.slice( 1 );
    };

    return (
        <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li className="inline-flex items-center">
                    <Link
                        to="/"
                        className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 inline-flex items-center transition-colors"
                    >
                        <svg
                            className="w-4 h-4 mr-2"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                        Home
                    </Link>
                </li>
                { pathnames.map( ( value, index ) =>
                {
                    const to = `/${pathnames.slice( 0, index + 1 ).join( '/' )}`;
                    const isLast = index === pathnames.length - 1;

                    return (
                        <li key={ to }>
                            <div className="flex items-center">
                                <svg
                                    className="w-6 h-6 text-gray-400 dark:text-gray-500"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                { isLast ? (
                                    <span className="ml-1 text-gray-500 dark:text-gray-400 md:ml-2">
                                        { getBreadcrumbName( value ) }
                                    </span>
                                ) : (
                                    <Link
                                        to={ to }
                                        className="ml-1 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 md:ml-2 transition-colors"
                                    >
                                        { getBreadcrumbName( value ) }
                                    </Link>
                                ) }
                            </div>
                        </li>
                    );
                } ) }
            </ol>
        </nav>
    );
};

export default Breadcrumbs; 