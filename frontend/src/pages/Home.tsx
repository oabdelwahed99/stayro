import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useIntersectionObserver } from '../hooks/useIntersectionObserver'

// Icon Components with hover animations
const HomeIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={`${className} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)

const SearchIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={`${className} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const ShieldIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={`${className} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

const ChartIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={`${className} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const CalendarIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={`${className} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const StarIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={`${className} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
)

const UsersIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={`${className} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

// Animated Section Component
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

// Animated Card Component
const AnimatedCard = ({ children, delay = 0, index = 0 }: { children: React.ReactNode, delay?: number, index?: number }) => {
  const { elementRef, hasIntersected } = useIntersectionObserver<HTMLDivElement>({ threshold: 0.1 })
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      ref={elementRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        bg-white rounded-xl p-8 shadow-md transition-all duration-300
        hover:shadow-2xl hover:-translate-y-2 hover:scale-105
        ${hasIntersected ? 'animate-fade-in-up opacity-100' : 'opacity-0'}
      `}
      style={{ animationDelay: `${delay + index * 0.1}s` }}
    >
      {children}
    </div>
  )
}

export default function Home() {
  const { user } = useAuth()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="w-full overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-primary-50 py-20 md:py-32 overflow-hidden">
        {/* Animated background gradient */}
        <div 
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(2, 132, 199, 0.15), transparent 40%)`
          }}
        />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <AnimatedSection delay={0.1}>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight animate-fade-in-up">
                Maximize Your Rental Revenue
                <span className="block text-primary-600 animate-fade-in-up delay-200">While We Handle the Complexity</span>
              </h1>
            </AnimatedSection>
            
            <AnimatedSection delay={0.3}>
              <p className="text-xl md:text-2xl text-gray-600 mb-4 max-w-3xl mx-auto">
                The all-in-one SaaS platform that automates property management, bookings, and payments. 
                <span className="block mt-2 text-lg text-gray-700">
                  Start earning more in less time—no technical expertise required.
                </span>
              </p>
            </AnimatedSection>
            
            <AnimatedSection delay={0.4}>
              <p className="text-sm text-gray-500 mb-10 max-w-2xl mx-auto">
                Trusted by property owners, loved by guests, powered by enterprise-grade infrastructure
              </p>
            </AnimatedSection>
            
            <AnimatedSection delay={0.5}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  to={user ? "/properties" : "/register"}
                  className="group bg-primary-600 text-white px-10 py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 active:scale-95 animate-pulse-glow"
                >
                  Start Free Trial
                  <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </Link>
                {!user && (
                  <Link
                    to="/register?role=OWNER"
                    className="bg-white text-primary-600 px-10 py-4 rounded-lg font-semibold text-lg border-2 border-primary-600 hover:bg-primary-50 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 active:scale-95"
                  >
                    List Property Free
                  </Link>
                )}
              </div>
            </AnimatedSection>
            
            <AnimatedSection delay={0.6}>
              <p className="text-sm text-gray-500 mt-4">
                No credit card required • Setup in 5 minutes • Cancel anytime
              </p>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection delay={0.1}>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Get Started in Minutes, Scale Forever
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Our streamlined workflow eliminates manual work and maximizes your revenue potential
              </p>
            </div>
          </AnimatedSection>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <AnimatedCard delay={0.2} index={0}>
              <div className="text-center">
                <div className="bg-primary-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group hover:bg-primary-200 transition-colors duration-300 hover:scale-110">
                  <span className="text-3xl font-bold text-primary-600">1</span>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  List Once, Sell Everywhere
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Create professional listings in under 5 minutes. Upload photos, set dynamic pricing, 
                  and sync availability—all from one powerful dashboard that works 24/7.
                </p>
              </div>
            </AnimatedCard>

            {/* Step 2 */}
            <AnimatedCard delay={0.2} index={1}>
              <div className="text-center">
                <div className="bg-primary-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group hover:bg-primary-200 transition-colors duration-300 hover:scale-110">
                  <span className="text-3xl font-bold text-primary-600">2</span>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  Instant Bookings, Automatic Payments
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Guests find and book your properties instantly. We handle secure payments, 
                  send confirmations, and update your calendar automatically—zero manual work.
                </p>
              </div>
            </AnimatedCard>

            {/* Step 3 */}
            <AnimatedCard delay={0.2} index={2}>
              <div className="text-center">
                <div className="bg-primary-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group hover:bg-primary-200 transition-colors duration-300 hover:scale-110">
                  <span className="text-3xl font-bold text-primary-600">3</span>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  Grow with Real-Time Insights
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Monitor performance, optimize pricing, and scale your business with actionable analytics. 
                  Platform admins get complete visibility and control to drive growth.
                </p>
              </div>
            </AnimatedCard>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection delay={0.1}>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Everything You Need to Succeed
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Purpose-built tools that increase bookings, reduce workload, and maximize revenue for every user type
              </p>
            </div>
          </AnimatedSection>

          {/* Property Owners Features */}
          <div className="mb-16">
            <AnimatedSection delay={0.2}>
              <div className="text-center mb-10">
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  For Property Owners
                </h3>
                <p className="text-gray-600">Increase bookings by 40% and save 10+ hours per week with automated workflows</p>
              </div>
            </AnimatedSection>
            <div className="grid md:grid-cols-3 gap-6">
              <AnimatedCard delay={0.3} index={0} >
                <div className="group">
                  <div className="text-primary-600 mb-4 transform transition-transform duration-300 group-hover:scale-125">
                    <HomeIcon />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">
                    Professional Listings in Minutes
                  </h4>
                  <p className="text-gray-600">
                    Create conversion-optimized listings with unlimited photos, SEO-friendly descriptions, 
                    and smart pricing suggestions that maximize visibility and bookings.
                  </p>
                </div>
              </AnimatedCard>
              <AnimatedCard delay={0.3} index={1}>
                <div className="group">
                  <div className="text-primary-600 mb-4 transform transition-transform duration-300 group-hover:scale-125">
                    <CalendarIcon />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">
                    Dynamic Pricing & Auto-Sync
                  </h4>
                  <p className="text-gray-600">
                    Set smart pricing rules, sync calendars across platforms, and automate availability 
                    updates. Never double-book again with real-time synchronization.
                  </p>
                </div>
              </AnimatedCard>
              <AnimatedCard delay={0.3} index={2}>
                <div className="group">
                  <div className="text-primary-600 mb-4 transform transition-transform duration-300 group-hover:scale-125">
                    <ChartIcon />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">
                    Revenue Analytics & Insights
                  </h4>
                  <p className="text-gray-600">
                    Track revenue, occupancy rates, and guest satisfaction in real-time. 
                    Get actionable insights to optimize pricing and increase profitability.
                  </p>
                </div>
              </AnimatedCard>
            </div>
          </div>

          {/* Customers Features */}
          <div className="mb-16">
            <AnimatedSection delay={0.4}>
              <div className="text-center mb-10">
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  For Guests & Travelers
                </h3>
                <p className="text-gray-600">Find your perfect stay faster with instant booking and verified properties</p>
              </div>
            </AnimatedSection>
            <div className="grid md:grid-cols-3 gap-6">
              <AnimatedCard delay={0.5} index={0}>
                <div className="group">
                  <div className="text-primary-600 mb-4 transform transition-transform duration-300 group-hover:scale-125">
                    <SearchIcon />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">
                    Smart Search That Understands You
                  </h4>
                  <p className="text-gray-600">
                    Find your ideal property with AI-powered search, instant filters, and personalized 
                    recommendations based on your preferences and booking history.
                  </p>
                </div>
              </AnimatedCard>
              <AnimatedCard delay={0.5} index={1}>
                <div className="group">
                  <div className="text-primary-600 mb-4 transform transition-transform duration-300 group-hover:scale-125">
                    <ShieldIcon />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">
                    Book with Complete Confidence
                  </h4>
                  <p className="text-gray-600">
                    Enterprise-grade security protects your payments and data. Get instant confirmation, 
                    real-time availability, and 24/7 customer support for peace of mind.
                  </p>
                </div>
              </AnimatedCard>
              <AnimatedCard delay={0.5} index={2}>
                <div className="group">
                  <div className="text-primary-600 mb-4 transform transition-transform duration-300 group-hover:scale-125">
                    <StarIcon />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">
                    Verified Reviews & Trust Scores
                  </h4>
                  <p className="text-gray-600">
                    Make informed decisions with verified guest reviews, detailed ratings, and 
                    property trust scores. Share your experience to help fellow travelers.
                  </p>
                </div>
              </AnimatedCard>
            </div>
          </div>

          {/* Admins Features */}
          <div>
            <AnimatedSection delay={0.6}>
              <div className="text-center mb-10">
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  For Platform Administrators
                </h3>
                <p className="text-gray-600">Scale your marketplace with powerful moderation tools and real-time analytics</p>
              </div>
            </AnimatedSection>
            <div className="grid md:grid-cols-3 gap-6">
              <AnimatedCard delay={0.7} index={0}>
                <div className="group">
                  <div className="text-primary-600 mb-4 transform transition-transform duration-300 group-hover:scale-125">
                    <UsersIcon />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">
                    Automated Moderation & Quality Control
                  </h4>
                  <p className="text-gray-600">
                    Streamline approvals with AI-assisted moderation, bulk actions, and quality scoring. 
                    Maintain platform standards while scaling efficiently.
                  </p>
                </div>
              </AnimatedCard>
              <AnimatedCard delay={0.7} index={1}>
                <div className="group">
                  <div className="text-primary-600 mb-4 transform transition-transform duration-300 group-hover:scale-125">
                    <CalendarIcon />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">
                    Centralized Booking Management
                  </h4>
                  <p className="text-gray-600">
                    Oversee all transactions, resolve disputes quickly, and ensure compliance. 
                    Automated workflows reduce manual intervention by 80%.
                  </p>
                </div>
              </AnimatedCard>
              <AnimatedCard delay={0.7} index={2}>
                <div className="group">
                  <div className="text-primary-600 mb-4 transform transition-transform duration-300 group-hover:scale-125">
                    <ChartIcon />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">
                    Real-Time Business Intelligence
                  </h4>
                  <p className="text-gray-600">
                    Track GMV, user acquisition, retention rates, and platform health with 
                    customizable dashboards and automated reporting.
                  </p>
                </div>
              </AnimatedCard>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection delay={0.1}>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Built for Scale, Designed for Trust
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Enterprise-grade infrastructure meets intuitive design—so you can focus on growing your business
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: ShieldIcon, title: "Bank-Level Security", description: "PCI-DSS compliant payment processing, end-to-end encryption, and SOC 2 certified infrastructure protect every transaction and data point." },
              { icon: UsersIcon, title: "5-Minute Setup", description: "Get your first property listed and accepting bookings in under 5 minutes. No technical skills required—our guided onboarding handles everything." },
              { icon: ChartIcon, title: "Infinite Scalability", description: "Cloud-native architecture handles millions of bookings without breaking a sweat. Auto-scaling infrastructure ensures 99.9% uptime SLA." },
              { icon: HomeIcon, title: "Purpose-Built for Rentals", description: "Every feature is designed specifically for short-term rental workflows—from dynamic pricing to multi-calendar sync. No generic solutions here." }
            ].map((item, index) => (
              <AnimatedCard key={index} delay={0.2} index={index}>
                <div className="text-center group">
                  <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:bg-primary-200 group-hover:scale-110 group-hover:rotate-6">
                    <item.icon className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600">
                    {item.description}
                  </p>
                </div>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <AnimatedSection delay={0.1}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to 10X Your Rental Revenue?
            </h2>
          </AnimatedSection>
          
          <AnimatedSection delay={0.2}>
            <p className="text-xl text-primary-100 mb-4 max-w-2xl mx-auto">
              Join 10,000+ property owners who've automated their business and increased bookings by 40% on average.
            </p>
          </AnimatedSection>
          
          <AnimatedSection delay={0.3}>
            <p className="text-lg text-primary-200 mb-10 max-w-xl mx-auto">
              Start your free trial today—no credit card required. Setup takes 5 minutes, results last forever.
            </p>
          </AnimatedSection>
          
          <AnimatedSection delay={0.4}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to={user ? "/properties" : "/register"}
                className="group inline-block bg-white text-primary-600 px-10 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 active:scale-95"
              >
                Start Free Trial
                <span className="inline-block ml-2 group-hover:translate-x-2 transition-transform">→</span>
              </Link>
              {!user && (
                <Link
                  to="/register?role=OWNER"
                  className="inline-block bg-transparent text-white px-10 py-4 rounded-lg font-semibold text-lg border-2 border-white hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 active:scale-95"
                >
                  See How It Works
                </Link>
              )}
            </div>
          </AnimatedSection>
          
          <AnimatedSection delay={0.5}>
            <p className="text-sm text-primary-200 mt-6">
              ✓ Free 14-day trial  ✓ No setup fees  ✓ Cancel anytime  ✓ 24/7 support included
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">PropertyRental</h3>
              <p className="text-gray-400">
                The all-in-one SaaS platform that automates property rentals, maximizes revenue, 
                and scales with your business.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Features</h4>
              <ul className="space-y-2">
                <li><Link to="/properties" className="hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">Browse Properties</Link></li>
                <li><Link to="/register?role=OWNER" className="hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">List Property</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">Contact</Link></li>
                <li><Link to="/support" className="hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link to="/privacy-policy" className="hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">Privacy Policy</Link></li>
                <li><Link to="/terms-of-service" className="hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">Terms of Service</Link></li>
                <li><Link to="/cookie-policy" className="hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} PropertyRental. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
