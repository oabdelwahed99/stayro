import { useState } from 'react'
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

const FAQItem = ({ question, answer, delay }: { question: string, answer: string, delay: number }) => {
  const [isOpen, setIsOpen] = useState(false)
  const { elementRef, hasIntersected } = useIntersectionObserver<HTMLDivElement>({ threshold: 0.1 })

  return (
    <div
      ref={elementRef}
      className={`bg-white rounded-lg shadow-md p-6 transition-all duration-300 ${hasIntersected ? 'animate-fade-in-up opacity-100' : 'opacity-0'}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left"
      >
        <h3 className="text-lg font-semibold text-gray-900 pr-4">{question}</h3>
        <svg
          className={`w-6 h-6 text-primary-600 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="mt-4 text-gray-700 leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  )
}

export default function Support() {
  const faqs = [
    {
      question: "How do I create a property listing?",
      answer: "Creating a listing is simple! After signing up as a property owner, navigate to your dashboard and click 'Create New Property'. Fill in the property details, upload photos, set your pricing and availability, and publish. Your listing will be live within minutes after admin approval."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, Mastercard, American Express) and debit cards. Payments are processed securely through our PCI-DSS compliant payment gateway. All transactions are encrypted and secure."
    },
    {
      question: "How do I cancel a booking?",
      answer: "Property owners can cancel bookings from their dashboard. Go to 'My Bookings', find the booking you want to cancel, and click 'Cancel'. Please note that cancellation policies may apply based on your property settings. Guests can also cancel bookings from their dashboard, subject to the property's cancellation policy."
    },
    {
      question: "What happens if I have a problem with my booking?",
      answer: "If you encounter any issues with your booking, please contact our support team immediately. You can reach us via email at support@propertyrental.com or call +1 (555) 123-4567. We have a dedicated team available 24/7 to assist with any problems."
    },
    {
      question: "How do I update my property pricing?",
      answer: "Log into your owner dashboard, go to 'My Properties', select the property you want to update, and click 'Edit'. You can update pricing, availability, and other details at any time. Changes take effect immediately."
    },
    {
      question: "Is my payment information secure?",
      answer: "Absolutely. We use bank-level encryption (SSL/TLS) to protect all payment information. We are PCI-DSS compliant and never store your full credit card details. All payment processing is handled by our secure, certified payment partners."
    },
    {
      question: "How do I contact property owners?",
      answer: "After making a booking, you'll receive the property owner's contact information in your booking confirmation email. You can also message them directly through our platform's messaging system from your dashboard."
    },
    {
      question: "What are the platform fees?",
      answer: "Our pricing is transparent with no hidden fees. Property owners pay a small commission only on successful bookings. Guests pay the listed price plus any applicable taxes. There are no setup fees, monthly fees, or hidden charges. See our pricing page for detailed information."
    }
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <AnimatedSection delay={0.1}>
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Support Center
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions or get in touch with our support team.
          </p>
        </div>
      </AnimatedSection>

      {/* Quick Links */}
      <AnimatedSection delay={0.2}>
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <a
            href="/contact"
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center group"
          >
            <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 transition-colors">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Email Support</h3>
            <p className="text-sm text-gray-600">Get help via email</p>
          </a>

          <a
            href="tel:+15551234567"
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center group"
          >
            <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 transition-colors">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Phone Support</h3>
            <p className="text-sm text-gray-600">Call us directly</p>
          </a>

          <a
            href="/register"
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center group"
          >
            <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 transition-colors">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Get Started</h3>
            <p className="text-sm text-gray-600">Create your account</p>
          </a>
        </div>
      </AnimatedSection>

      {/* FAQ Section */}
      <AnimatedSection delay={0.3}>
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                delay={0.1 * (index + 1)}
              />
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Still Need Help */}
      <AnimatedSection delay={0.4}>
        <div className="bg-primary-50 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Still Need Help?</h2>
          <p className="text-gray-700 mb-6">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <a
            href="/contact"
            className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Contact Support
          </a>
        </div>
      </AnimatedSection>
    </div>
  )
}
