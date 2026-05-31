import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-3xl prose prose-neutral dark:prose-invert">
          <h1 className="text-4xl font-display font-bold mb-4">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: April 2026</p>

          <h2 className="font-display font-semibold text-xl mt-8">1. Information we collect</h2>
          <p className="text-muted-foreground">
            We collect the information you provide when you create an account (name, email),
            and the operational data you enter into Domicilo (properties, tenants, transactions,
            settings). Authentication is handled securely through our infrastructure provider.
          </p>

          <h2 className="font-display font-semibold text-xl mt-6">2. How we use it</h2>
          <p className="text-muted-foreground">
            Your data is used solely to provide the Domicilo service to you. We do not sell
            personal data, and we never share tenant or transaction data with third parties
            for advertising.
          </p>

          <h2 className="font-display font-semibold text-xl mt-6">3. Data security</h2>
          <p className="text-muted-foreground">
            All data is encrypted in transit and at rest. Row-level security policies ensure
            you can only access records belonging to your account.
          </p>

          <h2 className="font-display font-semibold text-xl mt-6">4. Your rights</h2>
          <p className="text-muted-foreground">
            You may export, edit, or delete your data at any time from your dashboard.
            For complete account removal, contact us via the contact page.
          </p>

          <h2 className="font-display font-semibold text-xl mt-6">5. Contact</h2>
          <p className="text-muted-foreground">
            Questions about privacy? Reach us through the contact page.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
