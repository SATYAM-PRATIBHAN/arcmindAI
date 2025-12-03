"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-28 lg:py-42 text-gray-800">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-4xl font-semibold mb-4"
      >
        Privacy Policy
      </motion.h1>

      <p className="text-sm text-gray-500 mb-12">
        Last updated: November 2, 2025
      </p>

      <section className="space-y-8 leading-relaxed">
        <p>
          Welcome to <strong>ArcMind AI</strong>, a platform that helps you
          generate, visualize, and download intelligent system architecture
          designs using AI. This Privacy Policy explains how we handle your data
          when you use our website and related services.
        </p>

        <div>
          <h2 className="text-xl font-semibold mb-2">
            1. Information We Collect
          </h2>
          <p>We collect limited information to improve your experience:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>
              <strong>Account details</strong> (email, name) — when you sign up
              or contact us.
            </li>
            <li>
              <strong>Usage data</strong> — includes analytics like pages
              visited, session duration, and general browser/device info.
            </li>
            <li>
              <strong>Generated content</strong> — any text or architectural
              diagrams you create are stored securely so you can view them later
              in your <strong>History</strong> section.
            </li>
          </ul>
          <p className="mt-2">
            We <strong>do not sell</strong> or share your personal data for
            advertising.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">
            2. How We Use Your Data
          </h2>
          <ul className="list-disc list-inside space-y-1">
            <li>
              Provide and improve ArcMind AI features (e.g., history,
              downloads).
            </li>
            <li>
              Maintain system performance and prevent misuse (via rate limiting
              and analytics).
            </li>
            <li>
              Send occasional platform or policy updates (only if you opt in).
            </li>
          </ul>
          <p className="mt-2">
            All stored data is used solely to make ArcMind AI more reliable and
            user-friendly.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">
            3. Data Storage and Security
          </h2>
          <p>We use modern and secure infrastructure, including:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>
              <strong>Redis</strong> and <strong>MongoDB</strong> for caching
              and data management.
            </li>
            <li>
              <strong>Vercel</strong> and <strong>Prometheus</strong> for
              hosting and performance monitoring.
            </li>
            <li>Encrypted HTTPS connections for all API communication.</li>
          </ul>
          <p className="mt-2">
            We retain only necessary information — you can request deletion
            anytime by contacting us.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">
            4. Cookies and Tracking
          </h2>
          <p>ArcMind AI uses minimal cookies to:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Keep you signed in.</li>
            <li>Save your app preferences.</li>
            <li>Collect anonymous analytics for performance monitoring.</li>
          </ul>
          <p className="mt-2">
            You can disable cookies in your browser, but some features may not
            work properly.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">
            5. Third-Party Services
          </h2>
          <p>We may use trusted third-party tools like:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>
              <strong>Email delivery</strong> (for user notifications)
            </li>
            <li>
              <strong>Analytics</strong> (for performance tracking)
            </li>
            <li>
              <strong>Authentication providers</strong> (if you log in via
              OAuth)
            </li>
          </ul>
          <p className="mt-2">
            These providers follow their own privacy and security practices in
            compliance with modern data standards.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">6. Children’s Privacy</h2>
          <p>
            ArcMind AI is not designed for users under 13 years old. We do not
            knowingly collect data from minors. If such data is discovered, we
            will delete it immediately.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">
            7. Changes to This Policy
          </h2>
          <p>
            We may update this Privacy Policy periodically. Any changes will be
            reflected here with an updated date. Continued use of the platform
            means you accept these updates.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">8. Contact Us</h2>
          <p>
            For questions or data-related requests, reach us at:{" "}
            <Link
              href={`mailto:${process.env.ADMIN_EMAIL}`}
              className="text-gray-700 underline hover:text-gray-900"
            >
              {process.env.ADMIN_EMAIL}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
