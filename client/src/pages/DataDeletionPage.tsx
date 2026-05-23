import SEO from "@/components/SEO";

export default function DataDeletionPage() {
  return (
    <>
      <SEO
        title="Data Deletion | A2Z BOOKSHOP"
        description="Learn how to request deletion of your personal data from A2Z BOOKSHOP."
        keywords="data deletion, delete account, remove data, GDPR, privacy, A2Z BOOKSHOP"
        url="https://a2zbookshop.com/data-deletion"
        type="website"
      />
      <div className="min-h-screen bg-gray-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          {/* Header */}
          <div className="mb-10 sm:mb-14">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
              User Data Deletion
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl">
              You have the right to request deletion of your personal data. Here's how you can do it.
            </p>
            <p className="text-sm text-gray-500 mt-2">Last updated: January 2025</p>
          </div>

          {/* Instructions */}
          <div className="space-y-6 sm:space-y-8">
            <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">How to Request Data Deletion</h2>
              <p className="text-sm sm:text-base text-gray-700 mb-4">
                If you'd like us to delete your personal data from our systems, you can submit a request using any of the following methods:
              </p>
              <ul className="space-y-3 text-sm sm:text-base text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">1.</span>
                  <span>
                    <strong>Email us</strong> at{" "}
                    <a href="mailto:support@a2zbookshop.com" className="text-primary-aqua hover:underline">
                      support@a2zbookshop.com
                    </a>{" "}
                    with the subject line "Data Deletion Request" and include your registered email address.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">2.</span>
                  <span>
                    <strong>Contact us</strong> through our{" "}
                    <a href="/contact" className="text-primary-aqua hover:underline">
                      Contact Page
                    </a>{" "}
                    and mention "Data Deletion" in your message.
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">What Data Will Be Deleted</h2>
              <p className="text-sm sm:text-base text-gray-700 mb-4">
                Upon receiving and verifying your request, we will delete the following data:
              </p>
              <ul className="space-y-2 text-sm sm:text-base text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">•</span>
                  <span>Your account profile and login credentials</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">•</span>
                  <span>Your saved addresses and payment preferences</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">•</span>
                  <span>Your wishlist and browsing history</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">•</span>
                  <span>Newsletter subscription data</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Data We May Retain</h2>
              <p className="text-sm sm:text-base text-gray-700 mb-4">
                For legal and regulatory compliance, we may retain certain information even after a deletion request:
              </p>
              <ul className="space-y-2 text-sm sm:text-base text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">•</span>
                  <span>Order transaction records (required for tax and accounting purposes)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">•</span>
                  <span>Information required to resolve disputes or enforce agreements</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Processing Time</h2>
              <p className="text-sm sm:text-base text-gray-700">
                We will process your data deletion request within <strong>30 days</strong> of receiving it. You will receive a confirmation email once your data has been deleted.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Facebook / Meta Login Users</h2>
              <p className="text-sm sm:text-base text-gray-700">
                If you signed up or logged in using Facebook, you can also remove our app's access to your data through your{" "}
                <a
                  href="https://www.facebook.com/settings?tab=applications"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-aqua hover:underline"
                >
                  Facebook App Settings
                </a>
                . After removing our app, contact us to complete the deletion of any data stored on our servers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
