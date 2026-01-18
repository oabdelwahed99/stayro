import { useIntersectionObserver } from '../hooks/useIntersectionObserver'

const AnimatedSection = ({ children, className = "", delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) => {
  const { elementRef, hasIntersected } = useIntersectionObserver<HTMLElement>({ threshold: 0.1 })

  return (
    <div
      ref={elementRef}
      className={`${className} ${hasIntersected ? 'animate-fade-in-up opacity-100' : 'opacity-0'}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  )
}

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <AnimatedSection delay={0.1}>
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Privacy Policy
          </h1>
          <p className="text-gray-600 mb-4">
            <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-lg text-gray-700">
            At PropertyRental, we take your privacy seriously. This Privacy Policy explains how we collect, 
            use, disclose, and safeguard your information when you use our platform.
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.2}>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold mb-2">Personal Information</h3>
              <p>We collect information that you provide directly to us, including:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Name, email address, phone number, and mailing address</li>
                <li>Payment information (processed securely through third-party payment processors)</li>
                <li>Property information and photos for listings</li>
                <li>Booking and transaction history</li>
                <li>Communication preferences</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Automatically Collected Information</h3>
              <p>When you use our platform, we automatically collect:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Usage data (pages visited, time spent, features used)</li>
                <li>Location data (if you enable location services)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.3}>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
          <p className="text-gray-700 mb-3">We use the information we collect to:</p>
          <ul className="list-disc list-inside ml-4 space-y-2 text-gray-700">
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send related information</li>
            <li>Send you technical notices, updates, and support messages</li>
            <li>Respond to your comments, questions, and requests</li>
            <li>Communicate with you about products, services, and promotional offers</li>
            <li>Monitor and analyze trends, usage, and activities</li>
            <li>Detect, prevent, and address technical issues and fraudulent activity</li>
            <li>Personalize your experience and provide relevant content</li>
          </ul>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.4}>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Information Sharing and Disclosure</h2>
          <p className="text-gray-700 mb-3">We do not sell your personal information. We may share your information in the following circumstances:</p>
          <ul className="list-disc list-inside ml-4 space-y-2 text-gray-700">
            <li><strong>With Property Owners/Guests:</strong> To facilitate bookings, we share necessary information between property owners and guests</li>
            <li><strong>Service Providers:</strong> With third-party vendors who perform services on our behalf (payment processing, hosting, analytics)</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information</li>
          </ul>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.5}>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Security</h2>
          <p className="text-gray-700 mb-3">
            We implement industry-standard security measures to protect your information, including:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2 text-gray-700">
            <li>SSL/TLS encryption for data transmission</li>
            <li>Encrypted storage of sensitive information</li>
            <li>Regular security audits and assessments</li>
            <li>Access controls and authentication measures</li>
            <li>PCI-DSS compliance for payment processing</li>
          </ul>
          <p className="text-gray-700 mt-4">
            However, no method of transmission over the Internet or electronic storage is 100% secure. 
            While we strive to use commercially acceptable means to protect your information, we cannot 
            guarantee absolute security.
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.6}>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Rights and Choices</h2>
          <p className="text-gray-700 mb-3">You have the right to:</p>
          <ul className="list-disc list-inside ml-4 space-y-2 text-gray-700">
            <li><strong>Access:</strong> Request access to your personal information</li>
            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
            <li><strong>Deletion:</strong> Request deletion of your personal information</li>
            <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
            <li><strong>Data Portability:</strong> Request a copy of your data in a portable format</li>
            <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing where applicable</li>
          </ul>
          <p className="text-gray-700 mt-4">
            To exercise these rights, please contact us at privacy@propertyrental.com.
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.7}>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies and Tracking Technologies</h2>
          <p className="text-gray-700 mb-3">
            We use cookies and similar tracking technologies to track activity on our platform and store 
            certain information. You can instruct your browser to refuse all cookies or to indicate when 
            a cookie is being sent. However, if you do not accept cookies, you may not be able to use 
            some portions of our service.
          </p>
          <p className="text-gray-700">
            For more information about our use of cookies, please see our <a href="/cookie-policy" className="text-primary-600 hover:underline">Cookie Policy</a>.
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.8}>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Children's Privacy</h2>
          <p className="text-gray-700">
            Our service is not intended for individuals under the age of 18. We do not knowingly collect 
            personal information from children. If you become aware that a child has provided us with 
            personal information, please contact us immediately.
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.9}>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">8. International Data Transfers</h2>
          <p className="text-gray-700">
            Your information may be transferred to and processed in countries other than your country of 
            residence. These countries may have data protection laws that differ from those in your country. 
            We ensure appropriate safeguards are in place to protect your information in accordance with 
            this Privacy Policy.
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={1.0}>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Changes to This Privacy Policy</h2>
          <p className="text-gray-700">
            We may update this Privacy Policy from time to time. We will notify you of any changes by 
            posting the new Privacy Policy on this page and updating the "Last Updated" date. You are 
            advised to review this Privacy Policy periodically for any changes.
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={1.1}>
        <div className="bg-primary-50 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Us</h2>
          <p className="text-gray-700 mb-4">
            If you have any questions about this Privacy Policy, please contact us:
          </p>
          <ul className="space-y-2 text-gray-700">
            <li><strong>Email:</strong> privacy@propertyrental.com</li>
            <li><strong>Address:</strong> 123 Tech Street, San Francisco, CA 94105, United States</li>
            <li><strong>Phone:</strong> +1 (555) 123-4567</li>
          </ul>
        </div>
      </AnimatedSection>
    </div>
  )
}
