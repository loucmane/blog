export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Animal Protection Foundation
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Welcome to our mission of protecting and rescuing animals in need.
        </p>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-gray-600">
              Dedicated to providing shelter, medical care, and loving homes for animals in crisis.
            </p>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Get Involved</h2>
            <p className="text-gray-600">
              Join our community of supporters and help make a difference in animals&apos; lives.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}