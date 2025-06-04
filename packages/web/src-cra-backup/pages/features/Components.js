import React from 'react';
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

const Components = () =>
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
                    UI Components
                </motion.h1>
                <motion.p
                    variants={ itemVariants }
                    className="text-xl mb-12 text-gray-600 dark:text-gray-300 leading-relaxed"
                >
                    Our template includes a comprehensive set of reusable UI components built with React and TypeScript.
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
                            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Button Component</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                A versatile button component with multiple variants and states.
                            </p>
                            <div className="space-y-4">
                                <motion.button
                                    whileHover={ { scale: 1.02 } }
                                    whileTap={ { scale: 0.98 } }
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Primary Button
                                </motion.button>
                                <motion.button
                                    whileHover={ { scale: 1.02 } }
                                    whileTap={ { scale: 0.98 } }
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Secondary Button
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={ { scale: 1.02 } }
                        transition={ { type: "spring", bounce: 0.2 } }
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
                    >
                        <div className="p-6">
                            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Navigation</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                A responsive navigation component with active state handling.
                            </p>
                            <div className="space-y-4">
                                <motion.div
                                    whileHover={ { scale: 1.02 } }
                                    className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg"
                                >
                                    <span className="text-gray-800 dark:text-gray-200">Home</span>
                                </motion.div>
                                <motion.div
                                    whileHover={ { scale: 1.02 } }
                                    className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg"
                                >
                                    <span className="text-blue-800 dark:text-blue-400">Features</span>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={ { scale: 1.02 } }
                        transition={ { type: "spring", bounce: 0.2 } }
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
                    >
                        <div className="p-6">
                            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Card Component</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                A flexible card component for displaying content.
                            </p>
                            <motion.div
                                whileHover={ { scale: 1.02 } }
                                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                            >
                                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Card Title</h3>
                                <p className="text-gray-600 dark:text-gray-300">Card content goes here.</p>
                            </motion.div>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={ { scale: 1.02 } }
                        transition={ { type: "spring", bounce: 0.2 } }
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
                    >
                        <div className="p-6">
                            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Form Components</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                Input and form components with validation support.
                            </p>
                            <div className="space-y-4">
                                <motion.div
                                    whileHover={ { scale: 1.02 } }
                                    className="relative"
                                >
                                    <input
                                        type="text"
                                        placeholder="Enter text..."
                                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </motion.div>
                                <motion.div
                                    whileHover={ { scale: 1.02 } }
                                    className="relative"
                                >
                                    <select className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        <option>Option 1</option>
                                        <option>Option 2</option>
                                        <option>Option 3</option>
                                    </select>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Components; 