import { Code2, TestTube, BarChart3, Users } from 'lucide-react';

const useCases = [
  {
    icon: BarChart3,
    title: 'Non-Technical Users',
    description: 'Extract usage data and metrics without engineering resources. Schedule regular data pulls and export to spreadsheets.',
    benefits: ['Self-service analytics', 'Usage monitoring', 'Data-driven decisions'],
  },
  {
    icon: Users,
    title: 'Support Teams',
    description: 'Quickly lookup customer data, check account status, and troubleshoot issues directly from API responses.',
    benefits: ['Faster troubleshooting', 'Customer data lookup', 'Issue investigation'],
  },
  {
    icon: Code2,
    title: 'Backend Developers',
    description: 'Test API endpoints without leaving your browser. Generate curl commands, validate responses, and debug integrations faster.',
    benefits: ['Quick endpoint testing', 'Response validation', 'Debug API integrations'],
  },
  {
    icon: TestTube,
    title: 'QA Engineers',
    description: 'Automate API testing workflows. Schedule recurring tests, compare responses, and export results for quality reports.',
    benefits: ['Automated API testing', 'Regression testing', 'Test data generation'],
  },
];

export default function UseCases() {
  return (
    <section id="use-cases" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Built for Modern Teams
          </h2>
          <p className="text-xl text-gray-600">
            Whether you're building, testing, or analyzing, our extension streamlines your workflow
          </p>
        </div>

        {/* Use cases grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon;
            return (
              <div
                key={index}
                // className="group relative bg-white rounded-none border border-gray-200 p-8 hover:shadow-lg hover:border-gray-300 transition-all duration-300 group"
                className="group relative bg-white rounded-none border border-gray-200 p-8 hover:shadow-lg hover:border-gray-300 transition-all duration-300 flex flex-col h-full"
              >
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-none bg-orange-50 border border-orange-200 mb-6 group-hover:bg-orange-200 transition-colors mx-auto">
                  <Icon className="w-7 h-7 text-orange-600" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {useCase.title}
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {useCase.description}
                </p>

                {/* Benefits list */}
                <ul className="space-y-2 mt-auto">
                  {useCase.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="w-5 h-5 text-accent-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Testimonial-style quote */}
        {/* <div className="mt-20 max-w-4xl mx-auto">
          <div className="bg-white rounded-none border border-gray-200 p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-accent-600 flex items-center justify-center text-white text-2xl font-bold">
                  "
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xl md:text-2xl text-gray-800 font-medium mb-6 leading-relaxed">
                  This extension saved our team countless hours. What used to take 30 minutes of reading docs and crafting requests now takes under 2 minutes.
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-300" />
                  <div>
                    <div className="font-semibold text-gray-900">Sarah Chen</div>
                    <div className="text-sm text-gray-600">Engineering Manager, TechCorp</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div> */}
      </div>
    </section>
  );
}
