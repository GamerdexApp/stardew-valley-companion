import { Footer } from "@/comps/shell/Footer";
import { Faq } from "./Faq";
import { Features } from "./Features";
import { Hero } from "./Hero";
import { LandingHeader } from "./LandingHeader";
import { Steps } from "./Steps";

export function LandingPage() {
	return (
		<div className="bg-bg text-ink min-h-dvh">
			<LandingHeader />
			<main>
				<Hero />
				<Features />
				<Steps />
				<Faq />
			</main>
			<Footer />
		</div>
	);
}
