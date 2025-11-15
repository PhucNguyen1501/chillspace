import { ArrowRight, FileText, MessageSquare, PlayCircle } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { supabase, type EmailCapture } from '../lib/supabase';

export default function Hero() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('email_captures')
        .insert<EmailCapture>({ email, source: 'hero' });
      
      if (error) {
        if (error.code === '23505') {
          // Duplicate email error
          console.log('Email already subscribed:', email);
          setSubmitted(true);
          setTimeout(() => {
            setSubmitted(false);
            setEmail('');
          }, 3000);
        } else {
          console.error('Error submitting email:', error);
          // Fallback to console log if Supabase fails
          console.log('Email submitted (fallback):', email);
          setSubmitted(true);
          setTimeout(() => {
            setSubmitted(false);
            setEmail('');
          }, 3000);
        }
      } else {
        console.log('Email successfully captured:', email);
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          setEmail('');
        }, 3000);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      // Still show success to user even if there's an error
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setEmail('');
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
     className="relative overflow-hidden bg-white"
     style={{
      backgroundImage: "url('/hero-grid-bg.png')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
     }}
     >
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-24 sm:pb-32">
        {/* Announcement badge
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 border border-primary-200 text-primary-700 text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            <span>Now available as Chrome Extension</span>
          </div>
        </div> */}

        {/* Hero content - Split layout */}
        <div className="lg:grid lg:grid-cols-[2fr_1fr] lg:gap-12 max-w-6xl mx-auto">
          {/* Left: CTA Section */}
          <div className="text-left lg:text-left lg:pr-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-6">
              Leverage APIs
              <span className="block gradient-text relative z-10">
                with natural language
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 mb-2 leading-relaxed">
              Convert natural language to API calls instantly, 
              execute queries, and automate data extraction — all from your browser.
            </p>
            <p className="text-sm sm:text-xs text-gray-600 mb-4 leading-relaxed">
              "We hate spams, so we don't send you any."
            </p>

        {/* Email capture form */}
        <div className="mx-auto mt-6 mb-8">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-center">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your work email"
              required
              className="flex-1 w-full px-6 py-3 rounded-none border-2 border-gray-200 focus:border-accent-500 focus:ring-4 focus:ring-accent-100 outline-none transition-all text-lg"
            />
            <button
              type="submit"
              disabled={loading || submitted}
              className="w-full sm:w-auto px-8 py-4 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-semibold rounded-none shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 group whitespace-nowrap">
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : submitted ? (
                <>✓ Joined Waitlist</>
              ) : (
                <>
                  Join the Journey
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
                      {/* Chrome Web Store CTA
            <div className="flex flex-col sm:flex-row items-start gap-4 mb-8">
              <a
                href="#"
                className="inline-flex items-center gap-3 px-6 py-3 bg-white border-2 border-gray-200 hover:border-primary-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 group"
              >
                <Chrome className="w-6 h-6 text-primary-600" />
                <div className="text-left">
                  <div className="text-sm text-gray-500 font-medium">Available on</div>
                  <div className="text-sm font-semibold text-gray-900">Chrome Web Store</div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
              </a>
              
              <span className="text-sm text-gray-500 mt-2">Free • No credit card required</span>
            </div> */}
        </div>
          </div>

          {/* Right: Workflow Visualization */}
          <div className="lg:pl-8">
            <div className="hidden lg:block">
              {/* Desktop: Vertical workflow in right column */}
              <div className="space-y-8">
                {/* Step 1 */}
                <div className="flex items-start gap-3 group">
                  <div className="w-14 h-14 rounded-none bg-accent-50 border border-accent-200 flex items-center justify-center flex-shrink-0 group-hover:bg-accent-100 transition-colors duration-300">
                    <FileText className="w-8 h-8 text-accent-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Parse API Docs</h3>
                    <p className="text-md text-gray-600 leading-relaxed">Click to extract endpoints from any documentation page automatically</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 group">
                  <div className="w-14 h-14 rounded-none bg-accent-50 border border-accent-200 flex items-center justify-center flex-shrink-0 group-hover:bg-accent-100 transition-colors duration-300">
                    <MessageSquare className="w-8 h-8 text-accent-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Ask in Plain English</h3>
                    <p className="text-md text-gray-600 leading-relaxed">Describe what you need, we convert it to precise API calls instantly</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3 group">
                  <div className="w-14 h-14 rounded-none bg-accent-50 border border-accent-200 flex items-center justify-center flex-shrink-0 group-hover:bg-accent-100 transition-colors duration-300">
                    <PlayCircle className="w-8 h-8 text-accent-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Execute & Export</h3>
                    <p className="text-md text-gray-600 leading-relaxed">Run queries instantly and export results to JSON, CSV, or XLSX</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile/Tablet: Centered workflow */}
            <div className="lg:hidden text-center">
              <p className="text-md font-medium text-gray-500 mb-6">How it works in 3 simple steps</p>
              
              <div className="space-y-6">
                {/* Step 1 */}
                <div className="flex items-center gap-4 group justify-start">
                  <div className="w-12 h-12 rounded-none bg-accent-50 border border-accent-200 flex items-center justify-center flex-shrink-0 group-hover:bg-accent-100 transition-colors duration-300">
                    <FileText className="w-6 h-6 text-accent-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">1. Parse API Docs</h3>
                    <p className="text-md text-gray-600">Click to extract endpoints from any documentation page</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-center gap-4 group justify-start">
                  <div className="w-12 h-12 rounded-none bg-accent-50 border border-accent-200 flex items-center justify-center flex-shrink-0 group-hover:bg-accent-100 transition-colors duration-300">
                    <MessageSquare className="w-6 h-6 text-accent-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">2. Ask in Plain English</h3>
                    <p className="text-sm text-gray-600">Describe what you need, we convert to API calls</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-center gap-4 group justify-start">
                  <div className="w-12 h-12 rounded-none bg-accent-50 border border-accent-200 flex items-center justify-center flex-shrink-0 group-hover:bg-accent-100 transition-colors duration-300">
                    <PlayCircle className="w-6 h-6 text-accent-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">3. Execute & Export</h3>
                    <p className="text-sm text-gray-600">Run queries instantly and export results</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust badges - Full width below split */}
        <div className="max-w-6xl mx-auto mt-12">
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-accent-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>SOC 2 Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-accent-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>GDPR Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-accent-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Enterprise Security</span>
            </div>
          </div>
        </div>

              </div>
    </section>
  );
}
