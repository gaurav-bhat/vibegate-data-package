import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import WaitlistForm from '@/components/WaitlistForm';
import Footer from '@/components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <WaitlistForm />
      </main>
      <Footer />
    </div>
  );
}

export default App;
