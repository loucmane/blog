import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import About from './pages/About';
import FeaturesLayout from './components/FeaturesLayout';
import Overview from './pages/features/Overview';
import Components from './pages/features/Components';
import Architecture from './pages/features/Architecture';
import GettingStarted from './pages/features/GettingStarted';
import QuickStart from './pages/features/getting-started/QuickStart';
import Installation from './pages/features/getting-started/Installation';
import Configuration from './pages/features/getting-started/Configuration';
import { ThemeProvider } from './context/ThemeContext';

function App()
{
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
          <Navigation />
          <main className="py-8">
            <Routes>
              <Route path="/" element={ <Home /> } />
              <Route path="/about" element={ <About /> } />
              <Route path="/features" element={ <FeaturesLayout /> }>
                <Route index element={ <Overview /> } />
                <Route path="getting-started" element={ <GettingStarted /> } />
                <Route path="getting-started/quick-start" element={ <QuickStart /> } />
                <Route path="getting-started/installation" element={ <Installation /> } />
                <Route path="getting-started/configuration" element={ <Configuration /> } />
                <Route path="components" element={ <Components /> } />
                <Route path="architecture" element={ <Architecture /> } />
              </Route>
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
