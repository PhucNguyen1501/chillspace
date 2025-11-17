import { ArrowRight, Mail, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { supabase, type EmailCapture } from '../lib/supabase';
import { track } from '@vercel/analytics';

export default function CTA() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('email_captures')
        .insert<EmailCapture>({ email, source: 'cta' });
      
      if (error) {
        if (error.code === '23505') {
          // Duplicate email error
          console.log('Email already subscribed:', email);
          setSubmitted(true);
          setEmail('');
          setTimeout(() => setSubmitted(false), 5000);
        } else {
          console.error('Error submitting email:', error);
          // Fallback to console log if Supabase fails
          console.log('Waitlist email submitted (fallback):', email);
          setSubmitted(true);
          setEmail('');
          setTimeout(() => setSubmitted(false), 5000);
        }
      } else {
        console.log('Waitlist email successfully captured:', email);
        // Track email submission event
        track('email_submitted', {
          source: 'cta',
          location: 'cta_section'
        });
        setSubmitted(true);
        setEmail('');
        setTimeout(() => setSubmitted(false), 5000);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      // Still show success to user even if there's an error
      setSubmitted(true);
      setEmail('');
      setTimeout(() => setSubmitted(false), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-24 bg-gray-900 relative overflow-hidden">
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          {/* Main heading */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Ready to gain insights from your data quickly?
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Join our Journey
          </p>

          {/* Email capture form */}
          <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={submitted}
                  className="w-full pl-12 pr-4 py-4 rounded-none border-2 border-gray-700 focus:border-accent-500 focus:ring-4 focus:ring-accent-100 outline-none transition-all text-lg bg-gray-800 text-white placeholder-gray-400"
                />
              </div>
              <button
                type="submit"
                disabled={loading || submitted}
                className="px-8 py-4 bg-accent-600 hover:bg-accent-700 disabled:bg-accent-400 text-white font-semibold rounded-none shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-75"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : submitted ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    You're on the waitlist!
                  </>
                ) : (
                  <>
                    Join Waitlist
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Or divider */}
          {/* <div className="flex items-center gap-4 max-w-md mx-auto mb-8">
            <div className="flex-1 h-px bg-gray-700" />
            <span className="text-gray-400 font-medium">or</span>
            <div className="flex-1 h-px bg-gray-700" />
          </div> */}

          {/* Chrome Web Store button */}
          {/* <a
            href="#"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gray-800 border-2 border-gray-700 hover:bg-accent-600 hover:border-accent-700 text-white rounded-none shadow-lg hover:shadow-xl transition-all duration-200 group"
          >
            <Chrome className="w-6 h-6" />
            <div className="text-left">
              <div className="text-xs text-gray-400 font-medium">Install from</div>
              <div className="text-base font-semibold">Chrome Web Store</div>
            </div>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a> */}

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-accent-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Limited-time offer plan</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-accent-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No credit card required </span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-accent-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>2-minute setup</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
