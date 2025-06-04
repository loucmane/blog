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

const GettingStarted = () =>
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
                    Getting Started
                </motion.h1>
                <motion.p
                    variants={ itemVariants }
                    className="text-xl mb-12 text-gray-600 dark:text-gray-300 leading-relaxed"
                >
                    Follow these steps to get started with our template and begin building your application.
                </motion.p>

                <motion.div
                    variants={ itemVariants }
                    className="space-y-8"
                >
                    <motion.div
                        whileHover={ { scale: 1.02 } }
                        transition={ { type: "spring", bounce: 0.2 } }
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
                    >
                        <div className="p-6">
                            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Installation</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                Clone the repository and install dependencies using pnpm.
                            </p>
                            <motion.div
                                whileHover={ { scale: 1.01 } }
                                className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
                            >
                                <pre className="text-sm text-gray-800 dark:text-gray-200 font-mono">
                                    git clone https://github.com/your-username/legendary-monorepo-template.git
                                    cd legendary-monorepo-template
                                    pnpm install
                                </pre>
                            </motion.div>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={ { scale: 1.02 } }
                        transition={ { type: "spring", bounce: 0.2 } }
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
                    >
                        <div className="p-6">
                            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Development</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                Start the development server and begin building your application.
                            </p>
                            <motion.div
                                whileHover={ { scale: 1.01 } }
                                className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
                            >
                                <pre className="text-sm text-gray-800 dark:text-gray-200 font-mono">
                                    pnpm dev
                                </pre>
                            </motion.div>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={ { scale: 1.02 } }
                        transition={ { type: "spring", bounce: 0.2 } }
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
                    >
                        <div className="p-6">
                            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Project Structure</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                Understand the organization of your project and where to add new features.
                            </p>
                            <div className="space-y-4">
                                { [
                                    'Add new pages in the web/src/pages directory',
                                    'Create reusable components in web/src/components',
                                    'Share UI components through the ui package',
                                    'Configure routing in web/src/App.js'
                                ].map( ( step, index ) => (
                                    <motion.div
                                        key={ index }
                                        initial={ { opacity: 0, x: -20 } }
                                        animate={ { opacity: 1, x: 0 } }
                                        transition={ { delay: index * 0.1 } }
                                        className="flex items-start"
                                    >
                                        <motion.span
                                            whileHover={ { scale: 1.1 } }
                                            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-3 mt-0.5"
                                        >
                                            { index + 1 }
                                        </motion.span>
                                        <span className="text-gray-600 dark:text-gray-300">{ step }</span>
                                    </motion.div>
                                ) ) }
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default GettingStarted; 