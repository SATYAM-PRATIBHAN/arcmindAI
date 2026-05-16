"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-28 lg:py-42 text-gray-800 dark:text-gray-200">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-4xl font-semibold mb-4 text-gray-900 dark:text-white"
      >
        Privacy Policy
      </motion.h1>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-12">
        Last updated: November 2, 2025
      </p>

      <section className="space-y-8 leading-relaxed">
        <p className="text-gray-700 dark:text-gray-300">
          Welcome to <strong>ArcMind AI</strong>, a platform that helps you
          generate, visualize, and download intelligent system architecture
          designs using AI. This Privacy Policy explains how we handle your data
          when you use our website and related services.
        </p>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">
            1. Information We Collect
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            We collect limited information to improve your experience:
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2 text-gray-700 dark:text-gray-300">
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
          <p className="mt-2 text-gray-700 dark:text-gray-300">
            We <strong>do not sell</strong> or share your personal data for
            advertising.
          </p>
        </div>

        {/* Update all remaining sections with same pattern */}
      </section>
    </main>
  );
}