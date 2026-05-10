"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useState } from "react";

export default function SentryExamplePage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCaptureMessage = () => {
    Sentry.captureMessage("Test message from Sentry example page", "info");
    setErrorMessage("Message sent to Sentry!");
    setTimeout(() => setErrorMessage(null), 3000);
  };

  const handleCaptureException = () => {
    try {
      throw new Error("Test error from Sentry example page");
    } catch (error) {
      Sentry.captureException(error);
      setErrorMessage("Exception sent to Sentry!");
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleThrowError = () => {
    throw new Error("Unhandled error - this will be caught by Sentry");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sentry Error Tracking Test Page
          </h1>
          <p className="text-gray-600 mb-8">
            Use the buttons below to test Sentry error tracking and monitoring.
          </p>

          {errorMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800">{errorMessage}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Capture Message
              </h2>
              <p className="text-gray-600 mb-4">
                Sends an informational message to Sentry without throwing an error.
              </p>
              <button
                onClick={handleCaptureMessage}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Send Test Message
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Capture Exception
              </h2>
              <p className="text-gray-600 mb-4">
                Catches an error and sends it to Sentry for tracking.
              </p>
              <button
                onClick={handleCaptureException}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
              >
                Send Test Exception
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Unhandled Error
              </h2>
              <p className="text-gray-600 mb-4">
                Throws an unhandled error that will be automatically caught by
                Sentry&apos;s error boundary.
              </p>
              <button
                onClick={handleThrowError}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Throw Unhandled Error
              </button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Instructions
            </h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>
                Click any button above to test Sentry error tracking
              </li>
              <li>
                Check your Sentry dashboard to see the captured errors and
                messages
              </li>
              <li>
                The &quot;Unhandled Error&quot; button will trigger an error boundary
                (you may see an error page)
              </li>
            </ul>
          </div>

          <div className="mt-6">
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
