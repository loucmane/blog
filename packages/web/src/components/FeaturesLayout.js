import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Breadcrumbs from './Breadcrumbs';
import PageTransition from './PageTransition';

const FeaturesLayout = () =>
{
    const location = useLocation();

    const isActive = ( path ) =>
    {
        return location.pathname.startsWith( path );
    };

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Sidebar */ }
            <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm">
                <nav className="p-4">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Features</h2>
                    <ul className="space-y-2">
                        <li>
                            <NavLink
                                to="/features"
                                end
                                className={ ( { isActive } ) =>
                                    `block px-4 py-2 rounded-lg transition-colors ${isActive
                                        ? 'bg-blue-500 text-white'
                                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`
                                }
                            >
                                Overview
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/features/getting-started"
                                className={ ( { isActive } ) =>
                                    `block px-4 py-2 rounded-lg transition-colors ${isActive
                                        ? 'bg-blue-500 text-white'
                                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`
                                }
                            >
                                Getting Started
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/features/components"
                                className={ ( { isActive } ) =>
                                    `block px-4 py-2 rounded-lg transition-colors ${isActive
                                        ? 'bg-blue-500 text-white'
                                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`
                                }
                            >
                                Components
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/features/architecture"
                                className={ ( { isActive } ) =>
                                    `block px-4 py-2 rounded-lg transition-colors ${isActive
                                        ? 'bg-blue-500 text-white'
                                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`
                                }
                            >
                                Architecture
                            </NavLink>
                        </li>
                    </ul>
                </nav>
            </div>

            {/* Main Content */ }
            <div className="flex-1">
                <div className="p-4">
                    <Breadcrumbs />
                    <AnimatePresence mode="wait">
                        <PageTransition key={ location.pathname }>
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                <Outlet />
                            </div>
                        </PageTransition>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default FeaturesLayout; 