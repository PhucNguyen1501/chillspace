import { MousePointer, Brain, PlayCircle, Calendar } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: MousePointer,
    title: 'Parse API Documentation',
    description: 'Navigate to any API documentation page and click the extension icon. Our intelligent parser automatically extracts endpoints, parameters, and authentication requirements.',
  },
  {
    number: '02',
    icon: Brain,
    title: 'Describe What You Need',
    description: 'Type your request in plain English like "Get all users with status active" or "Create a new post with title and content". No need to remember exact endpoint names.',
  },
  {
    number: '03',
    icon: PlayCircle,
    title: 'Review & Execute',
    description: 'Our AI generates the complete API call with proper headers, authentication, and parameters. Review the request, make any adjustments, and execute with one click.',
  },
  {
    number: '04',
    icon: Calendar,
    title: 'Automate & Schedule',
    description: 'Save frequently-used queries and schedule them to run automatically. Export results to JSON, CSV, or XLSX for further analysis or integration.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600">
            From API documentation to automated data extraction in four simple steps
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4 md:space-y-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isEven = index % 2 === 0;
            
            return (
              <div
                key={index}
                className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-8 md:gap-16`}
              >
                {/* Content */}
                <div className="flex-1 space-y-4">
                  {/* <div className="inline-flex items-center justify-center w-16 h-16 rounded-none bg-accent-50 border border-accent-200 mb-4">
                    <Icon className="w-8 h-8 text-accent-600" />
                  </div> */}
                  
                  <div className="flex items-center gap-4">
                    <span className="text-6xl font-bold text-gray-300">{step.number}</span>
                    <h3 className="text-3xl font-bold text-gray-900">
                      {step.title}
                    </h3>
                  </div>
                  
                  <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
                    {step.description}
                  </p>
                </div>

                {/* Visual representation */}
                <div className="flex-1 w-full">
                  <div className="relative group">
                    <div className="relative px-8 shadow-sm aspect-[4/3] flex items-center justify-center">
                      <div className="text-center">
                        <div className="relative">
                          <Icon className="w-20 h-20 mx-auto mb-4 text-accent-600" />
                          {/* Animated connecting dots */}
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full animate-dot-bounce"></div>
                          <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-orange-400 rounded-full animate-dot-ping"></div>
                        </div>
                        <p className="text-sm font-medium text-gray-700">
                          {index === 0 && "API Documentation → Parsed Endpoints"}
                          {index === 1 && "Natural Language → API Calls"}
                          {index === 2 && "Data Flow → Export Formats"}
                          {index === 3 && "View Schedule → Know what's coming"}
                        </p>
                        {/* Visual flow indicators */}
                        <div className="flex justify-center items-center mt-4 gap-2">
                          <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-accent-600' : 'bg-accent-300'}`}></div>
                          <div className={`w-2 h-2 rounded-full ${index === 1 ? 'bg-accent-600' : 'bg-accent-300'}`}></div>
                          <div className={`w-2 h-2 rounded-full ${index === 2 ? 'bg-accent-600' : 'bg-accent-300'}`}></div>
                          <div className={`w-2 h-2 rounded-full ${index === 3 ? 'bg-accent-600' : 'bg-accent-300'}`}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
