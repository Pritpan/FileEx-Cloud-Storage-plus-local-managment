import './index.css';

import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Hero } from './sections/Hero';
import { Features } from './sections/Features';
import { Concept } from './sections/Concept';
import { HowItWorks } from './sections/HowItWorks';
import { DownloadSection } from './sections/DownloadSection';
import { Footer } from './components/Footer';

export default function App() {
  return (
    <ThemeProvider>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Navbar />
      <main id="main-content">
        <Hero />
        <Features />
        <Concept />
        <HowItWorks />
        <DownloadSection />
      </main>
      <Footer />
    </ThemeProvider>
  );
}
