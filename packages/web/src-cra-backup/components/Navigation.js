import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import ThemeSwitcher from './ThemeSwitcher';

const Navigation = () =>
{
    return (
        <motion.nav
            initial={ { y: -20, opacity: 0 } }
            animate={ { y: 0, opacity: 1 } }
            transition={ { duration: 0.3, ease: [0.4, 0, 0.2, 1] } }
            className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm"
        >
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-8">
                        <NavLink
                            to="/"
                            className="flex items-center text-gray-900 dark:text-white transition-colors"
                        >
                            <motion.span
                                whileHover={ { scale: 1.02 } }
                                className="text-xl font-bold"
                            >
                                Legendary Template
                            </motion.span>
                        </NavLink>
                        <div className="hidden md:flex space-x-4">
                            { [
                                { path: '/', label: 'Home' },
                                { path: '/features', label: 'Features' },
                                { path: '/about', label: 'About' }
                            ].map( ( { path, label } ) => (
                                <NavLink
                                    key={ path }
                                    to={ path }
                                    className={ ( { isActive } ) =>
                                        `relative px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                                            ? 'text-white'
                                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                        }`
                                    }
                                >
                                    { ( { isActive } ) => (
                                        <>
                                            { isActive && (
                                                <motion.div
                                                    layoutId="nav-indicator"
                                                    className="absolute inset-0 bg-blue-500 rounded-md"
                                                    transition={ { type: "spring", bounce: 0.2, duration: 0.6 } }
                                                />
                                            ) }
                                            <span className="relative z-10">{ label }</span>
                                        </>
                                    ) }
                                </NavLink>
                            ) ) }
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <ThemeSwitcher />
                    </div>
                </div>
            </div>
        </motion.nav>
    );
};

export default Navigation; 