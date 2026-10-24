import Head from "next/head";

const LAST_UPDATED = "October 25, 2026";

const sections = [
  {
    title: "1. Information We Collect",
    body: [
      "Account information such as your name, email address, password (stored hashed), and profile details.",
      "Learning and activity data such as enrolled courses, progress, certifications, orders, and messages sent through our chat features.",
      "Payment information is processed by our third-party payment providers; we do not store full card details.",
      "Technical data such as IP address, device and browser type, and cookies used for authentication and session management.",
    ],
  },
  {
    title: "2. How We Use Your Information",
    body: [
      "To create and manage your account and provide our courses and services.",
      "To process orders and payments, and issue certificates.",
      "To send notifications, verification emails, and service-related communications.",
      "To maintain security, prevent fraud, and improve our platform.",
    ],
  },
  {
    title: "3. Cookies",
    body: [
      "We use cookies to keep you signed in, refresh your session, and remember preferences. You can disable cookies in your browser, but some features may not work properly.",
    ],
  },
  {
    title: "4. Sharing of Information",
    body: [
      "We do not sell your personal information. We share data only with service providers (such as payment and email providers) who help us operate the platform, when required by law, or with your consent.",
    ],
  },
  {
    title: "5. Data Retention and Security",
    body: [
      "We retain your information for as long as your account is active or as needed to provide services and meet legal obligations. We apply reasonable technical and organizational safeguards, but no method of transmission is completely secure.",
    ],
  },
  {
    title: "6. Your Rights",
    body: [
      "You may access, update, or request deletion of your personal information at any time through your profile settings or by contacting us.",
    ],
  },
  {
    title: "7. Children's Privacy",
    body: [
      "Our services are not directed to children under 13, and we do not knowingly collect their personal information.",
    ],
  },
  {
    title: "8. Changes to This Policy",
    body: [
      "We may update this policy from time to time. Changes will be posted on this page with an updated date.",
    ],
  },
  {
    title: "9. Contact Us",
    body: [
      "If you have questions about this Privacy Policy, please reach out via our Contact Us page.",
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy | Upskill</title>
      </Head>
      <section className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-secondary">
            Last updated: {LAST_UPDATED}
          </p>
          <p className="mt-6 text-base leading-relaxed text-secondary">
            Your privacy matters to us. This policy explains what information we
            collect, how we use it, and the choices you have.
          </p>

          <div className="mt-10 space-y-8">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-xl font-bold text-on-surface sm:text-2xl">
                  {section.title}
                </h2>
                {section.body.length > 1 ? (
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-secondary">
                    {section.body.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 leading-relaxed text-secondary">
                    {section.body[0]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
