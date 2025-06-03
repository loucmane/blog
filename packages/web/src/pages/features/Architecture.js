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

const Architecture = () =>
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
                    Architecture
                </motion.h1>
                <motion.p
                    variants={ itemVariants }
                    className="text-xl mb-12 text-gray-600 dark:text-gray-300 leading-relaxed"
                >
                    Our template uses a modern monorepo architecture to help you build scalable applications.
                </motion.p>

                <motion.section
                    variants={ itemVariants }
                    className="mb-12"
                >
                    <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Monorepo Structure</h2>
                    <motion.div
                        whileHover={ { scale: 1.01 } }
                        transition={ { type: "spring", bounce: 0.2 } }
                        className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-200 dark:border-gray-600"
                    >
                        <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto font-mono">
                            { `legendary-monorepo-template/
├── packages/
│   ├── web/              # React application
│   │   ├── src/
│   │   │   ├── pages/   # Route components
│   │   │   ├── components/ # Shared components
│   │   │   └── App.js
│   │   └── package.json
│   │
│   └── ui/              # Shared UI library
│       ├── src/
│       │   ├── Button/
│       │   ├── Navigation/
│       │   └── index.ts
│       └── package.json
│
├── pnpm-workspace.yaml
└── package.json`}
                        </pre>
                    </motion.div>
                </motion.section>

                <motion.section
                    variants={ itemVariants }
                >
                    <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Key Benefits</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        { [
                            {
                                title: 'Code Sharing',
                                description: 'Share components, utilities, and types across multiple applications.'
                            },
                            {
                                title: 'Consistent Development',
                                description: 'Maintain consistent tooling, dependencies, and development practices.'
                            },
                            {
                                title: 'Efficient Workflow',
                                description: 'Use pnpm workspaces for fast, efficient package management.'
                            },
                            {
                                title: 'Scalable Structure',
                                description: 'Easily add new packages and applications as your project grows.'
                            }
                        ].map( ( benefit, index ) => (
                            <motion.div
                                key={ index }
                                initial={ { opacity: 0, y: 20 } }
                                animate={ { opacity: 1, y: 0 } }
                                transition={ { delay: index * 0.1 } }
                                whileHover={ { scale: 1.02 } }
                                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
                            >
                                <div className="p-6">
                                    <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                                        { benefit.title }
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        { benefit.description }
                                    </p>
                                </div>
                            </motion.div>
                        ) ) }
                    </div>
                </motion.section>
            </div>
        </motion.div>
    );
};

export default Architecture; 