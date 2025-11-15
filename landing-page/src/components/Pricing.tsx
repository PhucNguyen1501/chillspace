import { Clock } from 'lucide-react';

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-orange-50 border border-orange-200 text-sm font-medium text-orange-700 mb-6">
          <span className="inline-flex h-2 w-2 rounded-full bg-orange-500" />
          <span>Pricing</span>
          <span className="text-gray-400">·</span>
          <span className="uppercase tracking-wide text-xs text-gray-600">Coming soon</span>
        </div>

        <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          Simple, transparent pricing
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
          We&apos;re finalising plans that work for solo operators through to data-heavy teams.
          Early adopters will get generous usage limits and priority support.
        </p>

        <div className="max-w-xl mx-auto border border-dashed border-gray-300 rounded-none p-8 sm:p-10 bg-gray-50">
          <div className="flex flex-col items-center gap-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white border border-gray-200 mb-2">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-gray-800 font-medium">
              Pricing and early-access details are on the way.
            </p>
            <p className="text-md text-gray-600 max-w-md">
              If you&apos;d like to be notified when pricing goes live,
            </p>
            <a href="#" className="inline-flex items-center gap-2 text-md font-medium text-orange-600 hover:text-orange-700">join the waitlist now!</a>
          </div>
        </div>
      </div>
    </section>
  );
}
