import { Download, Printer, Users, Briefcase, Clock, BadgeCheck } from 'lucide-react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler);

export default function Overview() {

  const pipelineData = {
    labels: ['Applied', 'Screened', 'Interview', 'Offer', 'Hired'],
    datasets: [{
      label: 'Candidates',
      data: [1200, 720, 280, 52, 18],
      backgroundColor: '#059669',
      borderRadius: 8,
      barThickness: 18,
    }]
  };

  const sourceData = {
    labels: ['LinkedIn', 'Careers Page', 'Referral', 'Indeed', 'Other'],
    datasets: [{
      data: [38, 26, 18, 12, 6],
      backgroundColor: ['#059669', '#0d9488', '#10b981', '#a7f3d0', '#d1fae5'],
      borderWidth: 0,
    }]
  };

  const timeData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
    datasets: [{
      label: 'Days',
      data: [26, 18, 20, 22, 23, 21, 20.5, 18],
      borderColor: '#059669',
      backgroundColor: 'rgba(5, 150, 105, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
    }]
  };

  return (
    <div className="w-full p-6 bg-[#f8faf9] min-h-screen space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports - Overview</h1>
          <p className="text-sm text-slate-500">Key metrics • Last 30 days</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border px-4 py-2.5 rounded-xl text-sm flex items-center gap-2"><Printer className='size-4'/> Print</button>
          <button className="bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm flex items-center gap-2"><Download className='size-4'/> Export to Excel</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-emerald-100 border border-emerald-200 rounded-2xl p-5"><Users className="text-emerald-600"/><p className="text-xs mt-4 font-bold">TOTAL CANDIDATES</p><h3 className="text-4xl font-extrabold">1,248</h3></div>
        <div className="bg-white border rounded-2xl p-5"><Briefcase/><p className="text-xs mt-4 font-bold">ACTIVE VACANCIES</p><h3 className="text-4xl font-extrabold">12</h3></div>
        <div className="bg-white border rounded-2xl p-5"><Clock/><p className="text-xs mt-4 font-bold">AVG TIME TO HIRE</p><h3 className="text-4xl font-extrabold">18 days</h3></div>
        <div className="bg-white border rounded-2xl p-5"><BadgeCheck/><p className="text-xs mt-4 font-bold">HIRED THIS MONTH</p><h3 className="text-4xl font-extrabold">6</h3></div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 bg-white border rounded-2xl p-6">
          <h3 className="font-bold">Pipeline Report</h3>
          <div className="h- mt-4"><Bar data={pipelineData} options={{ indexAxis: 'y', plugins: { legend: { display: false } } }} /></div>
        </div>
        <div className="col-span-2 bg-white border rounded-2xl p-6">
          <h3 className="font-bold">Source Report</h3>
          <div className="h- mt-4 flex justify-center"><Pie data={sourceData} /></div>
        </div>
      </div>

      <div className="bg-white border rounded-2xl p-6">
        <h3 className="font-bold">Time to Hire Trend</h3>
        <div className="h- mt-4"><Line data={timeData} options={{ plugins: { legend: { display: false } } }} /></div>
      </div>
    </div>
  )
}