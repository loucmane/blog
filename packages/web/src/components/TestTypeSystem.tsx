// Test component to validate our TypeScript setup and path mapping

import { BlogPost, RescueStory, EmergencyAppeal, ContentSensitivityLevel } from '@/types';
// Test content path mapping - this should resolve to ../content/*
// import contentExample from '@/content/blog/example.md'; // Uncomment when MDX is set up

interface TestComponentProps {
  content: BlogPost | RescueStory | EmergencyAppeal;
  sensitivityLevel: ContentSensitivityLevel;
}

export function TestTypeSystem({ content, sensitivityLevel }: TestComponentProps) {
  // Type discrimination based on content type
  const renderContent = () => {
    switch (content.type) {
      case 'blog':
        return (
          <div>
            <h2>{content.title}</h2>
            <p>Blog post by {content.author.name}</p>
            {content.relatedPosts && (
              <p>Related posts: {content.relatedPosts.length}</p>
            )}
          </div>
        );
      
      case 'story':
        return (
          <div>
            <h2>{content.title}</h2>
            <p>Animal: {content.animalInfo.name} ({content.animalInfo.species})</p>
            <p>Status: {content.animalInfo.currentStatus}</p>
          </div>
        );
      
      case 'appeal':
        return (
          <div>
            <h2>{content.title}</h2>
            <p>Urgency: {content.urgencyLevel}</p>
            <p>Goal: ${content.fundraisingGoal}</p>
            <p>Raised: ${content.currentAmount}</p>
          </div>
        );
    }
  };

  const getSensitivityColor = (level: ContentSensitivityLevel): string => {
    switch (level) {
      case 1:
        return 'text-green-600';
      case 2:
        return 'text-yellow-600';
      case 3:
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <article className="p-4 border rounded-lg">
      <div className={`text-sm font-medium ${getSensitivityColor(sensitivityLevel)}`}>
        Sensitivity Level: {sensitivityLevel}
      </div>
      {renderContent()}
      <footer className="mt-4 text-sm text-gray-500">
        Published: {content.publishedAt.toLocaleDateString()}
      </footer>
    </article>
  );
}

// Example usage with proper typing
export function ExampleUsage() {
  const blogPost: BlogPost = {
    id: '1',
    type: 'blog',
    title: 'Animal Welfare Best Practices',
    excerpt: 'Learn about the latest in animal care...',
    content: '# Best Practices\n\nHere are some guidelines...',
    publishedAt: new Date(),
    updatedAt: new Date(),
    tags: ['education', 'welfare'],
    category: 'Education',
    featured: true,
    slug: 'animal-welfare-best-practices',
    readingTime: 5,
    author: {
      id: 'author-1',
      name: 'Dr. Sarah Johnson',
      email: 'sarah@animalfoundation.org',
      bio: 'Veterinarian and animal welfare expert',
      role: 'Veterinarian'
    },
    seo: {
      title: 'Animal Welfare Best Practices | Animal Protection Foundation',
      description: 'Learn about the latest in animal care and welfare practices',
      keywords: ['animal welfare', 'best practices', 'veterinary care']
    },
    relatedPosts: ['2', '3']
  };

  return (
    <TestTypeSystem 
      content={blogPost} 
      sensitivityLevel={1} 
    />
  );
}