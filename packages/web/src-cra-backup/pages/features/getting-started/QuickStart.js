import React from 'react';

const QuickStart = () =>
{
    const steps = [
        {
            title: 'Clone the Repository',
            code: 'git clone https://github.com/yourusername/your-template.git',
            description: 'Start by cloning the repository to your local machine.',
        },
        {
            title: 'Install Dependencies',
            code: 'pnpm install',
            description: 'Install all required dependencies using pnpm.',
        },
        {
            title: 'Start Development Server',
            code: 'pnpm dev',
            description: 'Launch the development server to see your changes in real-time.',
        },
        {
            title: 'Build for Production',
            code: 'pnpm build',
            description: 'Create an optimized production build of your application.',
        },
    ];

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-4">Quick Start Guide</h1>
            <div className="prose max-w-none">
                <p className="text-lg mb-6">
                    Follow these simple steps to get started with our template. We'll guide you through the
                    installation process and help you make your first changes.
                </p>

                <div className="space-y-8">
                    { steps.map( ( step, index ) => (
                        <div key={ step.title } className="border-l-4 border-blue-500 pl-4">
                            <div className="flex items-center mb-2">
                                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">
                                    { index + 1 }
                                </span>
                                <h2 className="text-xl font-semibold">{ step.title }</h2>
                            </div>
                            <p className="text-gray-600 mb-3">{ step.description }</p>
                            <div className="bg-gray-100 p-4 rounded-lg">
                                <code className="text-sm font-mono">{ step.code }</code>
                            </div>
                        </div>
                    ) ) }
                </div>

                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Next Steps</h3>
                    <p className="text-gray-600">
                        Now that you have the template set up, explore the documentation to learn more about
                        customization options, available components, and best practices.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default QuickStart; 