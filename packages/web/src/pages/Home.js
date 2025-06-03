import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            bounce: 0.2,
            duration: 0.6
        }
    }
};

const Home = () =>
{
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={ containerVariants }
            className="container mx-auto px-4 py-8"
        >
            <div className="max-w-4xl mx-auto">
                <motion.h1
                    variants={ itemVariants }
                    className="text-4xl font-bold mb-6 text-gray-900 dark:text-white"
                >
                    Welcome to Our App
                </motion.h1>
                <motion.p
                    variants={ itemVariants }
                    className="text-xl mb-12 text-gray-600 dark:text-gray-300 leading-relaxed"
                >
                    This is a modern React application built with a monorepo structure.
                </motion.p>

                <motion.div
                    variants={ itemVariants }
                    className="grid grid-cols-1 md:grid-cols-2 gap-8"
                >
                    <motion.div
                        whileHover={ { scale: 1.02 } }
                        transition={ { type: "spring", bounce: 0.2 } }
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
                    >
                        <div className="p-6">
                            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Features</h2>
                            <ul className="space-y-3">
                                { [
                                    'Monorepo structure with pnpm workspaces',
                                    'Shared UI components',
                                    'React Router for navigation',
                                    'Modern development setup'
                                ].map( ( feature, index ) => (
                                    <motion.li
                                        key={ index }
                                        initial={ { opacity: 0, x: -20 } }
                                        animate={ { opacity: 1, x: 0 } }
                                        transition={ { delay: index * 0.1 } }
                                        className="flex items-start"
                                    >
                                        <motion.span
                                            whileHover={ { scale: 1.1 } }
                                            className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-3 mt-0.5"
                                        >
                                            •
                                        </motion.span>
                                        <span className="text-gray-600 dark:text-gray-300">{ feature }</span>
                                    </motion.li>
                                ) ) }
                            </ul>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={ { scale: 1.02 } }
                        transition={ { type: "spring", bounce: 0.2 } }
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
                    >
                        <div className="p-6">
                            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Getting Started</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                Check out the About page to learn more about this template.
                            </p>
                            <motion.div
                                whileHover={ { x: 5 } }
                                transition={ { type: "spring", bounce: 0.2 } }
                            >
                                <Link
                                    to="/about"
                                    className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium"
                                >
                                    Learn More
                                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 2 } d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Home; 