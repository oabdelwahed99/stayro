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

export default function CookiePolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <AnimatedSection delay={0.1}>
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Cookie Policy
          </h1>
          <p className="text-gray-600 mb-4">
            <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-lg text-gray-700">
            This Cookie Policy explains how PropertyRental uses cookies and similar tracking technologies 
            on our platform. By using our platform, you consent to the use of cookies as described in 
            this policy.
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.2}>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">What Are Cookies?</h2>
          <p className="text-gray-700 mb-3">
            Cookies are small text files that are placed on your device when you visit a website. They 
            are widely used to make websites work more efficiently and provide information to website 
            owners. Cookies allow a website to recognize your device and store some information about 
            your preferences or past actions.
          </p>
          <p className="text-gray-700">
            We use both "session cookies" (which expire when you close your browser) and "persistent 
            cookies" (which remain on your device until they expire or are deleted).
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.3}>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Cookies</h2>
          <p className="text-gray-700 mb-4">
            We use cookies for the following purposes:
          </p>
          
          <div className="space-y-6">
            <div className="bg-primary-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Essential Cookies</h3>
              <p className="text-gray-700 mb-2">
                These cookies are necessary for the platform to function properly. They enable core 
                functionality such as security, network management, and accessibility.
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                <li>Authentication and login status</li>
                <li>Session management</li>
                <li>Security and fraud prevention</li>
                <li>Load balancing</li>
              </ul>
            </div>

            <div className="bg-primary-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Performance Cookies</h3>
              <p className="text-gray-700 mb-2">
                These cookies help us understand how visitors interact with our platform by collecting 
                and reporting information anonymously.
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                <li>Page views and navigation patterns</li>
                <li>Time spent on pages</li>
                <li>Error messages and performance issues</li>
                <li>Feature usage statistics</li>
              </ul>
            </div>

            <div className="bg-primary-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Functionality Cookies</h3>
              <p className="text-gray-700 mb-2">
                These cookies allow the platform to remember choices you make and provide enhanced, 
                personalized features.
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                <li>Language preferences</li>
                <li>Region and location settings</li>
                <li>User interface preferences</li>
                <li>Search history and filters</li>
              </ul>
            </div>

            <div className="bg-primary-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Targeting/Advertising Cookies</h3>
              <p className="text-gray-700 mb-2">
                These cookies are used to deliver advertisements relevant to you and your interests. 
                They also help measure the effectiveness of advertising campaigns.
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                <li>Ad targeting and personalization</li>
                <li>Campaign performance measurement</li>
                <li>Cross-site tracking (with your consent)</li>
              </ul>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.4}>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Third-Party Cookies</h2>
          <p className="text-gray-700 mb-3">
            In addition to our own cookies, we may also use various third-party cookies to report usage 
            statistics, deliver advertisements, and provide enhanced functionality. These include:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2 text-gray-700">
            <li><strong>Analytics Services:</strong> Google Analytics and similar services to understand platform usage</li>
            <li><strong>Payment Processors:</strong> Cookies from payment providers to process transactions securely</li>
            <li><strong>Advertising Networks:</strong> Cookies from advertising partners to deliver relevant ads</li>
            <li><strong>Social Media:</strong> Cookies from social media platforms when you interact with social features</li>
          </ul>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.5}>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Managing Cookies</h2>
          <p className="text-gray-700 mb-4">
            You have several options for managing cookies:
          </p>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Browser Settings</h3>
              <p className="text-gray-700 mb-2">
                Most web browsers allow you to control cookies through their settings. You can:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                <li>Block all cookies</li>
                <li>Block third-party cookies only</li>
                <li>Delete existing cookies</li>
                <li>Set your browser to notify you when cookies are being set</li>
              </ul>
              <p className="text-gray-700 mt-2 text-sm">
                Note: Blocking cookies may impact your ability to use certain features of our platform.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Platform Cookie Settings</h3>
              <p className="text-gray-700">
                You can manage your cookie preferences through our platform settings. However, please 
                note that essential cookies cannot be disabled as they are necessary for the platform 
                to function.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Opt-Out Tools</h3>
              <p className="text-gray-700">
                You can opt out of certain third-party cookies by visiting:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700 mt-2">
                <li><a href="http://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">Digital Advertising Alliance</a></li>
                <li><a href="http://www.youronlinechoices.eu/" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">Your Online Choices (EU)</a></li>
                <li><a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">Google Analytics Opt-out</a></li>
              </ul>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.6}>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookie Duration</h2>
          <div className="space-y-3 text-gray-700">
            <p>
              <strong>Session Cookies:</strong> These temporary cookies are deleted when you close your 
              browser. They are essential for the platform to function during your visit.
            </p>
            <p>
              <strong>Persistent Cookies:</strong> These cookies remain on your device for a set period 
              or until you delete them. They help us recognize you when you return to our platform and 
              remember your preferences.
            </p>
            <p>
              The duration of persistent cookies varies depending on their purpose, ranging from a few 
              days to several years.
            </p>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.7}>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Do Not Track Signals</h2>
          <p className="text-gray-700">
            Some browsers include a "Do Not Track" (DNT) feature that signals to websites you visit that 
            you do not want to have your online activity tracked. Currently, there is no standard for how 
            DNT signals should be interpreted. Our platform does not currently respond to DNT browser 
            signals or mechanisms.
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.8}>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Updates to This Policy</h2>
          <p className="text-gray-700">
            We may update this Cookie Policy from time to time to reflect changes in our practices or 
            for other operational, legal, or regulatory reasons. We will notify you of any material 
            changes by posting the new Cookie Policy on this page and updating the "Last Updated" date.
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.9}>
        <div className="bg-primary-50 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
          <p className="text-gray-700 mb-4">
            If you have any questions about our use of cookies, please contact us:
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
