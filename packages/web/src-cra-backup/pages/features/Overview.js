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

const Overview = () =>
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
                    Features Overview
                </motion.h1>
                <motion.p
                    variants={ itemVariants }
                    className="text-xl mb-12 text-gray-600 dark:text-gray-300 leading-relaxed"
                >
                    Our template provides a comprehensive set of features to help you build modern web applications.
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
                            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Component Library</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                A collection of reusable UI components built with React and TypeScript.
                            </p>
                            <motion.div
                                whileHover={ { x: 5 } }
                                transition={ { type: "spring", bounce: 0.2 } }
                            >
                                <Link
                                    to="/features/components"
                                    className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium"
                                >
                                    View Components
                                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 2 } d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </motion.div>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={ { scale: 1.02 } }
                        transition={ { type: "spring", bounce: 0.2 } }
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
                    >
                        <div className="p-6">
                            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Architecture</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                Learn about our monorepo structure and best practices for scaling your application.
                            </p>
                            <motion.div
                                whileHover={ { x: 5 } }
                                transition={ { type: "spring", bounce: 0.2 } }
                            >
                                <Link
                                    to="/features/architecture"
                                    className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium"
                                >
                                    View Architecture
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

export default Overview; 