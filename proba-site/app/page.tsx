import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Collection } from "@/components/sections/Collection";
import { Contact } from "@/components/sections/Contact";
import { Expertise } from "@/components/sections/Expertise";
import { Faq } from "@/components/sections/Faq";
import { Hero } from "@/components/sections/Hero";
import { Litmus } from "@/components/sections/Litmus";
import { Manifesto } from "@/components/sections/Manifesto";
import { Notes } from "@/components/sections/Notes";
import { Process } from "@/components/sections/Process";
import { Projects } from "@/components/sections/Projects";
import { Team } from "@/components/sections/Team";
import { siteConfig } from "@/config/site.config";
import { buildJsonLd } from "@/lib/jsonld";

export default function Home() {
  return (
    <>
      <Header />
      <main id="main">
        <Hero />
        <Manifesto />
        <Notes />
        <Litmus />
        <Collection />
        <Process />
        <Expertise />
        {siteConfig.features.showProjects && <Projects />}
        <Team />
        <Faq />
        <Contact />
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd()).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
