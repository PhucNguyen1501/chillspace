import { FileText, MessageSquare, Zap, Clock, Download, Shield } from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'Smart Documentation Parser',
    description: 'Automatically extract API schemas from OpenAPI, Swagger, REST, and GraphQL documentation pages.',
  },
  {
    icon: MessageSquare,
    title: 'Natural Language Processing',
    description: 'Simply describe what you want in plain English. Our AI converts it to precise API calls instantly.',
  },
  {
    icon: Zap,
    title: 'One-Click Execution',
    description: 'Execute API calls directly from your browser with built-in authentication and parameter management.',
  },
  {
    icon: Clock,
    title: 'Scheduled Data Jobs',
    description: 'Automate repetitive data extraction tasks with flexible scheduling—hourly, daily, or custom intervals.',
  },
  {
    icon: Download,
    title: 'Multi-Format Export',
    description: 'Export data to JSON, CSV, or XLSX formats. Perfect for reporting, analysis, and data warehousing.',
  },
  {
    icon: Shield,
    title: 'Enterprise-Grade Security',
    description: 'Your API keys and sensitive data are encrypted and stored securely. SOC 2 Type II compliant.',
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Need Data? <span className="text-orange-600">Have it your way.</span>
          </h2>
          <p className="text-xl text-gray-600">
            We believe non-technical people should able to gain access to data quickly and easily.<br></br>
            <span>You decide when, how often and in what format, we deliver.</span>
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group relative bg-white rounded-none border border-gray-200 p-8 hover:border-gray-300 hover:shadow-lg transition-all duration-300"
              >
                {/* Icon with minimal design */}
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-none bg-accent-50 border border-accent-200 mb-6 group-hover:bg-accent-100 transition-colors duration-300">
                  <Icon className="w-7 h-7 text-accent-600" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p
                  className="leading-relaxed"
                >
                  {feature.description}
                </p>

              </div>
            );
          })}
        </div>

        {/* Stats section */}
        {/* <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">500+</div>
            <div className="text-sm text-gray-600 font-medium">API Schemas Supported</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">10K+</div>
            <div className="text-sm text-gray-600 font-medium">Queries Generated</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">95%</div>
            <div className="text-sm text-gray-600 font-medium">Accuracy Rate</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">5min</div>
            <div className="text-sm text-gray-600 font-medium">Average Time Saved</div>
          </div>
        </div> */}
      </div>
    </section>
  );
}
