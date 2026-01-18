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

export default function AboutUs() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <AnimatedSection delay={0.1}>
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            About PropertyRental
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We're building the future of property rental management—one booking at a time.
          </p>
        </div>
      </AnimatedSection>

      {/* Mission Section */}
      <AnimatedSection delay={0.2}>
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            At PropertyRental, we believe that managing rental properties should be simple, 
            profitable, and stress-free. Our mission is to empower property owners, delight guests, 
            and enable platform administrators with cutting-edge technology that automates the 
            complexities of short-term rental management.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            We're not just another booking platform—we're a complete ecosystem designed to 
            maximize revenue, minimize workload, and create exceptional experiences for everyone 
            involved in the rental process.
          </p>
        </div>
      </AnimatedSection>

      {/* Vision Section */}
      <AnimatedSection delay={0.3}>
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Vision</h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            We envision a world where property rental management is fully automated, where 
            property owners can focus on what they love—providing amazing experiences—while 
            our platform handles the rest.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            By combining enterprise-grade infrastructure with intuitive design, we're creating 
            a platform that scales from a single property to thousands, all while maintaining 
            the personal touch that makes each rental special.
          </p>
        </div>
      </AnimatedSection>

      {/* Values Section */}
      <AnimatedSection delay={0.4}>
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Values</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-primary-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Innovation First</h3>
              <p className="text-gray-700">
                We continuously push the boundaries of what's possible in property management, 
                leveraging the latest technologies to solve real problems.
              </p>
            </div>
            <div className="bg-primary-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">User-Centric Design</h3>
              <p className="text-gray-700">
                Every feature we build starts with understanding our users' needs. We prioritize 
                simplicity and usability in everything we create.
              </p>
            </div>
            <div className="bg-primary-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Trust & Security</h3>
              <p className="text-gray-700">
                We take security seriously. Your data and your guests' information are protected 
                with bank-level encryption and industry-leading security practices.
              </p>
            </div>
            <div className="bg-primary-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Transparency</h3>
              <p className="text-gray-700">
                We believe in clear communication, honest pricing, and transparent processes. 
                No hidden fees, no surprises—just straightforward value.
              </p>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Stats Section */}
      <AnimatedSection delay={0.5}>
        <div className="mb-12 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-6 text-center">By The Numbers</h2>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-primary-100">Property Owners</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50,000+</div>
              <div className="text-primary-100">Active Listings</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-primary-100">Uptime SLA</div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Team Section */}
      <AnimatedSection delay={0.6}>
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Built by Experts</h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            Our team combines decades of experience in property management, software engineering, 
            and customer service. We understand the challenges you face because we've been there.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            From our engineers building scalable infrastructure to our support team ensuring 
            your success, every member of PropertyRental is committed to making property 
            rental management effortless.
          </p>
        </div>
      </AnimatedSection>

      {/* CTA Section */}
      <AnimatedSection delay={0.7}>
        <div className="text-center bg-gray-50 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Join Us on This Journey</h2>
          <p className="text-lg text-gray-700 mb-6">
            Whether you're a property owner looking to maximize revenue, a guest seeking the 
            perfect stay, or a platform administrator building a marketplace, we're here to help.
          </p>
          <a
            href="/register"
            className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Get Started Today
          </a>
        </div>
      </AnimatedSection>
    </div>
  )
}
