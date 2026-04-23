import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-3xl">
          <h1 className="text-4xl font-display font-bold mb-2">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated: April 2026</p>

          <div className="space-y-6 text-muted-foreground">
            <section>
              <h2 className="font-display font-semibold text-xl text-foreground mb-2">1. Acceptance</h2>
              <p>By creating a Domicilo account, you agree to these terms. If you do not agree, do not use the service.</p>
            </section>
            <section>
              <h2 className="font-display font-semibold text-xl text-foreground mb-2">2. Your account</h2>
              <p>You are responsible for maintaining the confidentiality of your credentials and for all activity under your account.</p>
            </section>
            <section>
              <h2 className="font-display font-semibold text-xl text-foreground mb-2">3. Acceptable use</h2>
              <p>You agree not to misuse the service, attempt unauthorized access, or use Domicilo to violate any law or third-party rights.</p>
            </section>
            <section>
              <h2 className="font-display font-semibold text-xl text-foreground mb-2">4. Subscription & billing</h2>
              <p>Paid plans are billed in advance and are non-refundable except where required by law. You may cancel at any time.</p>
            </section>
            <section>
              <h2 className="font-display font-semibold text-xl text-foreground mb-2">5. Limitation of liability</h2>
              <p>The service is provided "as is". To the maximum extent permitted by law, Domicilo shall not be liable for indirect or consequential damages.</p>
            </section>
            <section>
              <h2 className="font-display font-semibold text-xl text-foreground mb-2">6. Changes</h2>
              <p>We may update these terms. Continued use after changes constitutes acceptance.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
