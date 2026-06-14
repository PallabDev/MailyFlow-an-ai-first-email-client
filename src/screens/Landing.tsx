"use client";

import Navbar from "../components/sections/Navbar";
import Hero from "../components/sections/Hero";
import Problems from "../components/sections/Problems";
import HowItWorks from "../components/sections/HowItWorks";
import Simulation from "../components/sections/Simulation";
import Features from "../components/sections/Features";
import Marquee from "../components/sections/Marquee";
import Playground from "../components/sections/Playground";
import DeepDive from "../components/sections/DeepDive";
import Pricing from "../components/sections/Pricing";
import Testimonials from "../components/sections/Testimonials";
import Stats from "../components/sections/Stats";
import FAQ from "../components/sections/FAQ";
import FinalCTA from "../components/sections/FinalCTA";
import Footer from "../components/sections/Footer";

export default function Landing() {
  return (
    <div className="relative">
      <Navbar />
      <main>
        <Hero />
        <Problems />
        <HowItWorks />
        <Simulation />
        <Features />
        <Marquee />
        <Playground />
        <DeepDive />
        <Pricing />
        <Testimonials />
        <Stats />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
