import { ArrowRight } from "lucide-react";

const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'];

export default function RecruitmentPipeline({ candidates = [], activeStage, onStageChange }) {
  
  // Har stage ka count nikalna
  const getCount = (stage) => candidates.filter(c => c.CurrentStage === stage).length;

  return (
    <div className="w-full bg-white border rounded-xl p-4">
      <h3 className="text-sm font-bold mb-3">Recruitment Pipeline</h3>
      <div className="flex items-center gap-2 flex-wrap">
        {STAGES.map((stage, idx) => {
          const isActive = activeStage === stage;
          const count = getCount(stage);
          return (
            <div key={stage} className="flex items-center gap-2">
              <button
                onClick={() => onStageChange(stage)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium border transition-all flex items-center gap-2
                  ${isActive 
                    ? 'bg-green-950 text-white border-green-900 shadow' 
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
              >
                {stage} 
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white text-blue-600' : 'bg-white border'}`}>{count}</span>
              </button>
              {idx < STAGES.length - 1 && <ArrowRight className="w-4 h-4 text-gray-400" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}