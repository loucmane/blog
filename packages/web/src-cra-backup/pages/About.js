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

const About = () =>
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
                    About This Template
                </motion.h1>
                <motion.p
                    variants={ itemVariants }
                    className="text-xl mb-12 text-gray-600 dark:text-gray-300 leading-relaxed"
                >
                    This template is designed to help you quickly start new React projects with a modern,
                    scalable architecture. Built with best practices in mind, it provides a solid foundation
                    for building complex web applications.
                </motion.p>

                <motion.div
                    variants={ itemVariants }
                    className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12"
                >
                    <motion.div
                        whileHover={ { scale: 1.02 } }
                        transition={ { type: "spring", bounce: 0.2 } }
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
                    >
                        <div className="p-6">
                            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Project Structure</h2>
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto font-mono">
                                    { `legendary-monorepo-template/
├── packages/
│   ├── web/        # React app
│   └── ui/         # Shared UI components
├── pnpm-workspace.yaml
└── package.json`}
                                </pre>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={ { scale: 1.02 } }
                        transition={ { type: "spring", bounce: 0.2 } }
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
                    >
                        <div className="p-6">
                            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Key Features</h2>
                            <ul className="space-y-4">
                                { [
                                    'Monorepo structure using pnpm workspaces',
                                    'Shared UI component library',
                                    'React Router for navigation',
                                    'Modern development tooling',
                                    'Scalable project structure'
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
                                            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-3 mt-0.5"
                                        >
                                            { index + 1 }
                                        </motion.span>
                                        <span className="text-gray-600 dark:text-gray-300">{ feature }</span>
                                    </motion.li>
                                ) ) }
                            </ul>
                        </div>
                    </motion.div>
                </motion.div>

                <motion.div
                    variants={ itemVariants }
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
                >
                    <div className="p-6">
                        <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Getting Started</h2>
                        <div className="space-y-6">
                            { [
                                {
                                    step: 1,
                                    title: 'Clone the repository',
                                    description: 'Start by cloning the template repository to your local machine.'
                                },
                                {
                                    step: 2,
                                    title: 'Install dependencies',
                                    description: 'Use pnpm to install all required dependencies.',
                                    command: 'pnpm install'
                                },
                                {
                                    step: 3,
                                    title: 'Start development server',
                                    description: 'Launch the development server to begin working.',
                                    command: 'pnpm dev'
                                },
                                {
                                    step: 4,
                                    title: 'Begin building',
                                    description: 'Start building your application using the provided components and structure.'
                                }
                            ].map( ( item, index ) => (
                                <motion.div
                                    key={ item.step }
                                    initial={ { opacity: 0, y: 20 } }
                                    animate={ { opacity: 1, y: 0 } }
                                    transition={ { delay: index * 0.1 } }
                                    className="flex items-start"
                                >
                                    <motion.span
                                        whileHover={ { scale: 1.1 } }
                                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold mr-4"
                                    >
                                        { item.step }
                                    </motion.span>
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                                            { item.title }
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-300 mb-2">
                                            { item.description }
                                        </p>
                                        { item.command && (
                                            <motion.code
                                                whileHover={ { scale: 1.02 } }
                                                className="block px-4 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-blue-600 dark:text-blue-400 font-mono text-sm"
                                            >
                                                { item.command }
                                            </motion.code>
                                        ) }
                                    </div>
                                </motion.div>
                            ) ) }
                        </div>
                        <motion.div
                            initial={ { opacity: 0 } }
                            animate={ { opacity: 1 } }
                            transition={ { delay: 0.8 } }
                            className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"
                        >
                            <Link
                                to="/features"
                                className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium"
                            >
                                <motion.span
                                    whileHover={ { x: 5 } }
                                    transition={ { type: "spring", bounce: 0.2 } }
                                    className="flex items-center"
                                >
                                    Explore Features
                                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 2 } d="M9 5l7 7-7 7" />
                                    </svg>
                                </motion.span>
                            </Link>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default About; 