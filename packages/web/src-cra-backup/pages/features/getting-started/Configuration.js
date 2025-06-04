import React from 'react';

const Configuration = () =>
{
    const configOptions = [
        {
            title: 'Environment Variables',
            description: 'Configure your application environment',
            options: [
                {
                    name: 'REACT_APP_API_URL',
                    type: 'string',
                    default: 'http://localhost:3000',
                    description: 'API endpoint URL',
                },
                {
                    name: 'REACT_APP_ENV',
                    type: 'string',
                    default: 'development',
                    description: 'Environment (development/production)',
                },
            ],
        },
        {
            title: 'Theme Configuration',
            description: 'Customize the application theme',
            options: [
                {
                    name: 'primaryColor',
                    type: 'string',
                    default: '#3B82F6',
                    description: 'Primary color for the application',
                },
                {
                    name: 'fontFamily',
                    type: 'string',
                    default: 'Inter',
                    description: 'Default font family',
                },
            ],
        },
        {
            title: 'Build Configuration',
            description: 'Configure build settings',
            options: [
                {
                    name: 'outputPath',
                    type: 'string',
                    default: 'build',
                    description: 'Output directory for builds',
                },
                {
                    name: 'sourceMap',
                    type: 'boolean',
                    default: 'true',
                    description: 'Generate source maps',
                },
            ],
        },
    ];

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-4">Configuration Guide</h1>
            <div className="prose max-w-none">
                <p className="text-lg mb-6">
                    Learn how to customize the template to fit your needs. This guide covers all available
                    configuration options and how to use them effectively.
                </p>

                <div className="space-y-8">
                    { configOptions.map( ( section ) => (
                        <div key={ section.title } className="border rounded-lg p-6">
                            <h2 className="text-2xl font-semibold mb-2">{ section.title }</h2>
                            <p className="text-gray-600 mb-6">{ section.description }</p>

                            <div className="space-y-4">
                                { section.options.map( ( option ) => (
                                    <div key={ option.name } className="bg-gray-50 p-4 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-lg font-medium">{ option.name }</h3>
                                            <span className="text-sm text-gray-500">Type: { option.type }</span>
                                        </div>
                                        <p className="text-gray-600 mb-2">{ option.description }</p>
                                        <div className="bg-gray-100 p-3 rounded">
                                            <code className="text-sm font-mono">
                                                { option.name } = { option.default }
                                            </code>
                                        </div>
                                    </div>
                                ) ) }
                            </div>
                        </div>
                    ) ) }
                </div>

                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Best Practices</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-600">
                        <li>Always use environment variables for sensitive information</li>
                        <li>Keep configuration values in a centralized location</li>
                        <li>Document any custom configuration changes</li>
                        <li>Use type-safe configuration when possible</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Configuration; 