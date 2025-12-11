"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-28 lg:py-42 text-gray-800">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-4xl font-semibold mb-4"
      >
        Terms and Conditions
      </motion.h1>

      <p className="text-sm text-gray-500 mb-12">
        Last updated: December 11, 2024
      </p>

      <section className="space-y-8 leading-relaxed">
        <p>
          Welcome to <strong>ArcMind AI</strong>. By accessing or using our
          platform, you agree to be bound by these Terms and Conditions. Please
          read them carefully before using our services.
        </p>

        <div>
          <h2 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h2>
          <p>
            By creating an account, accessing, or using ArcMind AI, you
            acknowledge that you have read, understood, and agree to be bound by
            these Terms and Conditions, as well as our{" "}
            <Link
              href="/privacy"
              className="text-gray-700 underline hover:text-gray-900"
            >
              Privacy Policy
            </Link>
            . If you do not agree with any part of these terms, you may not use
            our services.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">
            2. Description of Service
          </h2>
          <p>
            ArcMind AI is an AI-powered platform that helps users generate,
            visualize, and download intelligent system architecture designs. Our
            services include:
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>AI-generated system architecture diagrams</li>
            <li>GitHub repository analysis and visualization</li>
            <li>Interactive diagram editing and customization</li>
            <li>Export and download capabilities</li>
            <li>Doubt resolution and AI assistance</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">
            3. User Accounts and Responsibilities
          </h2>
          <p>
            To use certain features of ArcMind AI, you must create an account.
            You agree to:
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>
              Provide accurate, current, and complete information during
              registration
            </li>
            <li>
              Maintain the security of your password and account credentials
            </li>
            <li>
              Accept responsibility for all activities that occur under your
              account
            </li>
            <li>
              Notify us immediately of any unauthorized use of your account
            </li>
            <li>
              Not share your account credentials with others or allow others to
              access your account
            </li>
          </ul>
          <p className="mt-2">
            You must be at least 13 years old to use ArcMind AI. Users under 18
            should have parental or guardian consent.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">
            4. AI-Generated Content Disclaimer
          </h2>
          <p>
            ArcMind AI uses artificial intelligence to generate system
            architecture designs and provide assistance. You acknowledge and
            agree that:
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>
              AI-generated content is provided "as is" without warranties of any
              kind
            </li>
            <li>
              Generated designs should be reviewed and validated before
              implementation
            </li>
            <li>
              We are not responsible for decisions made based on AI-generated
              content
            </li>
            <li>
              AI outputs may contain errors, inaccuracies, or incomplete
              information
            </li>
            <li>
              You are solely responsible for verifying the accuracy and
              suitability of generated content
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">
            5. Subscription Plans and Payments
          </h2>
          <p>
            ArcMind AI offers both free and paid subscription plans. By
            subscribing to a paid plan, you agree to:
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Pay all fees associated with your chosen subscription plan</li>
            <li>Provide accurate and complete payment information</li>
            <li>
              Authorize us to charge your payment method on a recurring basis
            </li>
            <li>
              Accept that subscription fees are non-refundable except as
              required by law
            </li>
          </ul>
          <p className="mt-2">
            <strong>Free Plan Limitations:</strong> Free users are subject to
            usage limits, including but not limited to 5 doubt chat questions
            per generation. Upgrade to Pro or Enterprise for unlimited access.
          </p>
          <p className="mt-2">
            <strong>Cancellation:</strong> You may cancel your subscription at
            any time. Cancellation will take effect at the end of your current
            billing period.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">
            6. Intellectual Property Rights
          </h2>
          <p>
            <strong>Our Content:</strong> All content, features, and
            functionality of ArcMind AI, including but not limited to text,
            graphics, logos, icons, images, and software, are owned by ArcMind
            AI and are protected by copyright, trademark, and other intellectual
            property laws.
          </p>
          <p className="mt-2">
            <strong>Your Content:</strong> You retain ownership of any content
            you create using ArcMind AI. By using our service, you grant us a
            limited license to store, process, and display your content solely
            for the purpose of providing our services to you.
          </p>
          <p className="mt-2">
            <strong>Generated Diagrams:</strong> Diagrams and designs generated
            by our AI are provided for your use. However, we retain the right to
            use anonymized, aggregated data to improve our services.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">7. Prohibited Uses</h2>
          <p>You agree not to use ArcMind AI to:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>
              Violate any applicable laws, regulations, or third-party rights
            </li>
            <li>Engage in any fraudulent, abusive, or harmful activities</li>
            <li>
              Attempt to gain unauthorized access to our systems or other users'
              accounts
            </li>
            <li>
              Reverse engineer, decompile, or disassemble any part of our
              platform
            </li>
            <li>
              Use automated systems (bots, scrapers) without our explicit
              permission
            </li>
            <li>Upload malicious code, viruses, or any harmful software</li>
            <li>
              Resell, redistribute, or commercialize our services without
              authorization
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">
            8. Limitation of Liability
          </h2>
          <p>
            To the fullest extent permitted by law, ArcMind AI and its
            affiliates, officers, employees, and agents shall not be liable for:
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>
              Any indirect, incidental, special, consequential, or punitive
              damages
            </li>
            <li>
              Loss of profits, data, use, goodwill, or other intangible losses
            </li>
            <li>
              Damages resulting from your use or inability to use our services
            </li>
            <li>Errors, mistakes, or inaccuracies in AI-generated content</li>
            <li>
              Unauthorized access to or alteration of your transmissions or data
            </li>
          </ul>
          <p className="mt-2">
            Our total liability for any claim arising from your use of ArcMind
            AI shall not exceed the amount you paid us in the 12 months
            preceding the claim.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">
            9. Privacy and Data Protection
          </h2>
          <p>
            Your privacy is important to us. Our collection, use, and protection
            of your personal information is governed by our{" "}
            <Link
              href="/privacy"
              className="text-gray-700 underline hover:text-gray-900"
            >
              Privacy Policy
            </Link>
            . By using ArcMind AI, you consent to our data practices as
            described in the Privacy Policy.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">
            10. Service Modifications and Termination
          </h2>
          <p>
            We reserve the right to modify, suspend, or discontinue any part of
            ArcMind AI at any time, with or without notice. We may also
            terminate or suspend your account and access to our services:
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>If you violate these Terms and Conditions</li>
            <li>If we suspect fraudulent or abusive activity</li>
            <li>For any other reason at our sole discretion</li>
          </ul>
          <p className="mt-2">
            Upon termination, your right to use ArcMind AI will immediately
            cease. We may delete your account and all associated data.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">
            11. Disclaimer of Warranties
          </h2>
          <p>
            ArcMind AI is provided "as is" and "as available" without warranties
            of any kind, either express or implied, including but not limited
            to:
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>
              Warranties of merchantability or fitness for a particular purpose
            </li>
            <li>Warranties of non-infringement</li>
            <li>
              Warranties that the service will be uninterrupted or error-free
            </li>
            <li>
              Warranties regarding the accuracy or reliability of AI-generated
              content
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">12. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless ArcMind AI and its
            affiliates from any claims, damages, losses, liabilities, and
            expenses (including legal fees) arising from:
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Your use of our services</li>
            <li>Your violation of these Terms and Conditions</li>
            <li>Your violation of any third-party rights</li>
            <li>Any content you submit or generate using our platform</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">13. Governing Law</h2>
          <p>
            These Terms and Conditions shall be governed by and construed in
            accordance with the laws of India, without regard to its conflict of
            law provisions. Any disputes arising from these terms shall be
            subject to the exclusive jurisdiction of the courts in India.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">14. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms and Conditions at any
            time. We will notify users of any material changes by updating the
            "Last updated" date at the top of this page. Your continued use of
            ArcMind AI after such changes constitutes your acceptance of the new
            terms.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">15. Severability</h2>
          <p>
            If any provision of these Terms and Conditions is found to be
            invalid or unenforceable, the remaining provisions shall continue in
            full force and effect.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">16. Contact Us</h2>
          <p>
            If you have any questions about these Terms and Conditions, please
            contact us at:{" "}
            <Link
              href={`mailto:${process.env.ADMIN_EMAIL}`}
              className="text-gray-700 underline hover:text-gray-900"
            >
              {process.env.ADMIN_EMAIL}
            </Link>
          </p>
          <p className="mt-2">
            You can also reach us through our{" "}
            <Link
              href="/contact"
              className="text-gray-700 underline hover:text-gray-900"
            >
              Contact Page
            </Link>
            .
          </p>
        </div>

        <div className="pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            By using ArcMind AI, you acknowledge that you have read, understood,
            and agree to be bound by these Terms and Conditions.
          </p>
        </div>
      </section>
    </main>
  );
}
