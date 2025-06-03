import React from 'react';

const Installation = () =>
{
    const requirements = [
        {
            name: 'Node.js',
            version: '>= 16.0.0',
            description: 'JavaScript runtime environment',
        },
        {
            name: 'pnpm',
            version: '>= 8.0.0',
            description: 'Fast, disk space efficient package manager',
        },
        {
            name: 'Git',
            version: '>= 2.0.0',
            description: 'Version control system',
        },
    ];

    const steps = [
        {
            title: 'Install Node.js',
            content: 'Download and install Node.js from the official website.',
            link: 'https://nodejs.org/',
        },
        {
            title: 'Install pnpm',
            content: 'Install pnpm globally using npm.',
            code: 'npm install -g pnpm',
        },
        {
            title: 'Clone the Repository',
            content: 'Clone the template repository to your local machine.',
            code: 'git clone https://github.com/yourusername/your-template.git',
        },
        {
            title: 'Install Dependencies',
            content: 'Navigate to the project directory and install dependencies.',
            code: 'cd your-template\npnpm install',
        },
    ];

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Installation Guide</h1>
            <div className="prose max-w-none">
                <p className="text-lg mb-6 text-gray-600 dark:text-gray-300">
                    Follow this comprehensive guide to set up the template on your local machine.
                    We'll walk you through all the necessary steps and requirements.
                </p>

                <div className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">System Requirements</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        { requirements.map( ( req ) => (
                            <div
                                key={ req.name }
                                className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{ req.name }</h3>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">{ req.version }</span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-300">{ req.description }</p>
                            </div>
                        ) ) }
                    </div>
                </div>

                <div className="space-y-8">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Installation Steps</h2>
                    { steps.map( ( step, index ) => (
                        <div key={ step.title } className="border-l-4 border-blue-500 pl-4">
                            <div className="flex items-center mb-2">
                                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">
                                    { index + 1 }
                                </span>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{ step.title }</h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 mb-3">{ step.content }</p>
                            { step.code && (
                                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <code className="text-sm font-mono text-gray-800 dark:text-gray-200">{ step.code }</code>
                                </div>
                            ) }
                            { step.link && (
                                <a
                                    href={ step.link }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center mt-2 transition-colors"
                                >
                                    Visit Website
                                    <svg
                                        className="w-4 h-4 ml-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={ 2 }
                                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                        />
                                    </svg>
                                </a>
                            ) }
                        </div>
                    ) ) }
                </div>

                <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Troubleshooting</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                        If you encounter any issues during installation, please check our{ ' ' }
                        <a
                            href="#"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                        >
                            troubleshooting guide
                        </a>
                        { ' ' }or open an issue on our{ ' ' }
                        <a
                            href="https://github.com/yourusername/your-template"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                        >
                            GitHub repository
                        </a>
                        .
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Installation; 