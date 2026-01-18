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

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <AnimatedSection delay={0.1}>
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Terms of Service
          </h1>
          <p className="text-gray-600 mb-4">
            <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-lg text-gray-700">
            Please read these Terms of Service carefully before using PropertyRental. By accessing or using 
            our platform, you agree to be bound by these terms.
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.2}>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-700">
            By accessing and using PropertyRental, you accept and agree to be bound by the terms and 
            provision of this agreement. If you do not agree to abide by the above, please do not use 
            this service.
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.3}>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
          <p className="text-gray-700 mb-3">
            PropertyRental is an online platform that connects property owners with guests seeking 
            short-term rental accommodations. Our services include:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2 text-gray-700">
            <li>Property listing and management tools</li>
            <li>Booking and reservation management</li>
            <li>Payment processing services</li>
            <li>Communication tools between owners and guests</li>
            <li>Platform administration and moderation</li>
          </ul>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.4}>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
          <div className="space-y-3 text-gray-700">
            <p>
              <strong>Registration:</strong> To use certain features of our platform, you must register 
              for an account. You agree to provide accurate, current, and complete information during 
              registration and to update such information to keep it accurate, current, and complete.
            </p>
            <p>
              <strong>Account Security:</strong> You are responsible for maintaining the confidentiality 
              of your account credentials and for all activities that occur under your account. You agree 
              to notify us immediately of any unauthorized use of your account.
            </p>
            <p>
              <strong>Account Types:</strong> We offer different account types (Property Owner, Guest, 
              Administrator) with varying permissions and responsibilities. You agree to use your account 
              only for its intended purpose.
            </p>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.5}>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Property Listings</h2>
          <div className="space-y-3 text-gray-700">
            <p>
              <strong>Accurate Information:</strong> Property owners are responsible for providing accurate, 
              complete, and up-to-date information about their properties, including pricing, availability, 
              amenities, and property conditions.
            </p>
            <p>
              <strong>Property Approval:</strong> All property listings are subject to review and approval 
              by our administration team. We reserve the right to reject, suspend, or remove any listing 
              that violates our policies or terms.
            </p>
            <p>
              <strong>Property Compliance:</strong> Property owners must ensure their properties comply 
              with all applicable laws, regulations, and local requirements, including zoning, licensing, 
              and safety standards.
            </p>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.6}>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Bookings and Payments</h2>
          <div className="space-y-3 text-gray-700">
            <p>
              <strong>Booking Process:</strong> When a guest makes a booking, they enter into a direct 
              contract with the property owner. PropertyRental acts as an intermediary platform facilitating 
              the transaction.
            </p>
            <p>
              <strong>Payment Processing:</strong> Payments are processed securely through our payment 
              partners. We collect payments on behalf of property owners and distribute funds according 
              to our payment schedule.
            </p>
            <p>
              <strong>Fees:</strong> Property owners agree to pay platform fees as specified in our pricing 
              terms. Guests pay the listed property price plus applicable taxes and fees.
            </p>
            <p>
              <strong>Cancellations:</strong> Cancellation policies are set by property owners and must be 
              clearly stated in property listings. Both parties must adhere to the agreed cancellation terms.
            </p>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.7}>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">6. User Conduct</h2>
          <p className="text-gray-700 mb-3">You agree not to:</p>
          <ul className="list-disc list-inside ml-4 space-y-2 text-gray-700">
            <li>Use the platform for any illegal or unauthorized purpose</li>
            <li>Violate any laws in your jurisdiction</li>
            <li>Infringe upon the rights of others</li>
            <li>Post false, misleading, or fraudulent information</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Interfere with or disrupt the platform's operation</li>
            <li>Attempt to gain unauthorized access to any portion of the platform</li>
            <li>Use automated systems to access the platform without permission</li>
            <li>Copy, modify, or distribute our content without authorization</li>
          </ul>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.8}>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property</h2>
          <p className="text-gray-700 mb-3">
            The platform and its original content, features, and functionality are owned by PropertyRental 
            and are protected by international copyright, trademark, patent, trade secret, and other 
            intellectual property laws.
          </p>
          <p className="text-gray-700">
            You retain ownership of content you post on the platform, but grant us a worldwide, 
            non-exclusive, royalty-free license to use, reproduce, modify, and distribute such content 
            for the purpose of operating and promoting the platform.
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.9}>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Disclaimers and Limitation of Liability</h2>
          <div className="space-y-3 text-gray-700">
            <p>
              <strong>Platform "As Is":</strong> The platform is provided "as is" and "as available" 
              without warranties of any kind, either express or implied.
            </p>
            <p>
              <strong>No Guarantees:</strong> We do not guarantee the accuracy, completeness, or usefulness 
              of any information on the platform. We are not responsible for the conduct of users or third parties.
            </p>
            <p>
              <strong>Property Disputes:</strong> We are not a party to transactions between property owners 
              and guests. We are not responsible for disputes, claims, losses, or damages arising from 
              bookings or property use.
            </p>
            <p>
              <strong>Limitation of Liability:</strong> To the maximum extent permitted by law, PropertyRental 
              shall not be liable for any indirect, incidental, special, consequential, or punitive damages, 
              or any loss of profits or revenues.
            </p>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={1.0}>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Indemnification</h2>
          <p className="text-gray-700">
            You agree to indemnify and hold harmless PropertyRental, its officers, directors, employees, 
            and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) 
            arising out of your use of the platform, violation of these terms, or infringement of any 
            rights of another party.
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={1.1}>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Termination</h2>
          <p className="text-gray-700 mb-3">
            We may terminate or suspend your account and access to the platform immediately, without prior 
            notice, for any reason, including breach of these Terms of Service.
          </p>
          <p className="text-gray-700">
            Upon termination, your right to use the platform will cease immediately. All provisions of 
            these terms that by their nature should survive termination shall survive, including ownership 
            provisions, warranty disclaimers, and limitations of liability.
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={1.2}>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to Terms</h2>
          <p className="text-gray-700">
            We reserve the right to modify these terms at any time. We will notify users of any material 
            changes by posting the new Terms of Service on this page and updating the "Last Updated" date. 
            Your continued use of the platform after such modifications constitutes acceptance of the updated terms.
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={1.3}>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Governing Law</h2>
          <p className="text-gray-700">
            These Terms of Service shall be governed by and construed in accordance with the laws of the 
            State of California, United States, without regard to its conflict of law provisions. Any 
            disputes arising from these terms shall be subject to the exclusive jurisdiction of the 
            courts in San Francisco, California.
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={1.4}>
        <div className="bg-primary-50 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Information</h2>
          <p className="text-gray-700 mb-4">
            If you have any questions about these Terms of Service, please contact us:
          </p>
          <ul className="space-y-2 text-gray-700">
            <li><strong>Email:</strong> legal@propertyrental.com</li>
            <li><strong>Address:</strong> 123 Tech Street, San Francisco, CA 94105, United States</li>
            <li><strong>Phone:</strong> +1 (555) 123-4567</li>
          </ul>
        </div>
      </AnimatedSection>
    </div>
  )
}
