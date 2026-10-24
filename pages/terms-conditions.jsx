import Head from "next/head";

const LAST_UPDATED = "October 25, 2026";

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: [
      "By accessing or using Upskill, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the platform.",
    ],
  },
  {
    title: "2. Accounts",
    body: [
      "You must provide accurate information when registering and keep your credentials secure.",
      "You are responsible for all activity under your account.",
      "We may suspend or terminate accounts that violate these terms.",
    ],
  },
  {
    title: "3. Courses and Purchases",
    body: [
      "Purchasing a course grants you a personal, non-transferable, non-exclusive license to access its content for your own learning.",
      "Prices and availability may change at any time. Payments are processed by third-party providers.",
      "Refunds are handled according to our refund practices at the time of purchase.",
    ],
  },
  {
    title: "4. Acceptable Use",
    body: [
      "Do not copy, redistribute, resell, or publicly share course content without permission.",
      "Do not attempt to disrupt, hack, or gain unauthorized access to the platform.",
      "Do not post unlawful, harassing, or infringing content, including in chat features.",
    ],
  },
  {
    title: "5. Educator Content",
    body: [
      "Educators retain ownership of the content they create and grant Upskill a license to host, display, and distribute it on the platform. Educators are responsible for ensuring their content does not infringe third-party rights.",
    ],
  },
  {
    title: "6. Intellectual Property",
    body: [
      "The Upskill name, logo, and platform software are owned by us or our licensors and are protected by applicable intellectual property laws.",
    ],
  },
  {
    title: "7. Certificates",
    body: [
      "Certificates are issued on completion of course requirements and may be revoked if obtained through fraud or violation of these terms.",
    ],
  },
  {
    title: "8. Disclaimers and Limitation of Liability",
    body: [
      "The platform is provided \"as is\" without warranties of any kind. To the extent permitted by law, Upskill is not liable for indirect, incidental, or consequential damages arising from your use of the platform.",
    ],
  },
  {
    title: "9. Changes to These Terms",
    body: [
      "We may update these terms from time to time. Continued use of the platform after changes means you accept the updated terms.",
    ],
  },
  {
    title: "10. Contact Us",
    body: [
      "For questions about these Terms and Conditions, please reach out via our Contact Us page. See also our Privacy Policy for how we handle your data.",
    ],
  },
];

export default function TermsConditions() {
  return (
    <>
      <Head>
        <title>Terms &amp; Conditions | Upskill</title>
      </Head>
      <section className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface sm:text-5xl">
            Terms &amp; Conditions
          </h1>
          <p className="mt-3 text-sm text-secondary">
            Last updated: {LAST_UPDATED}
          </p>
          <p className="mt-6 text-base leading-relaxed text-secondary">
            Please read these terms carefully before using our platform.
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
