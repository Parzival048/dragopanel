import {
  Navbar,
  Hero,
  Features,
  Pricing,
  Contact,
  Footer
} from '@/components/landing/LandingComponents'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#030712] overflow-hidden">
      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      <Contact />
      <Footer />
    </main>
  )
}
