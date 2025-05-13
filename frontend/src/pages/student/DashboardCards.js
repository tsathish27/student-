// import React from 'react';

// export default function DashboardCard({ icon, label, value, color, link }) {
//   return (
//     <a href={link} className={`bg-gradient-to-br ${color} text-white rounded-2xl shadow-lg flex flex-col items-center justify-center transform hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer group min-w-[180px] min-h-[180px] w-[200px] h-[200px] m-2`}>
//       <div className="mb-2 group-hover:animate-bounce">{icon}</div>
//       <div className="text-3xl font-extrabold drop-shadow mb-1">{value}</div>
//       <div className="text-lg font-semibold tracking-wide uppercase opacity-90">{label}</div>
//       <div className="text-xs mt-2 underline text-blue-200">View</div>
//     </a>
//   );
// }
import React from 'react';

export default function DashboardCard({ icon, label, value, color, link }) {
  return (
    <a
      href={link}
      className={`
        bg-gradient-to-br ${color} text-white rounded-2xl shadow-lg
        flex flex-col items-center justify-center
        transform hover:scale-105 hover:shadow-2xl
        transition-all duration-300 cursor-pointer group
        w-[160px] h-[160px] sm:w-[200px] sm:h-[200px] m-2
      `}
    >
      <div className="mb-2 text-3xl sm:text-4xl group-hover:animate-bounce">
        {icon}
      </div>
      <div className="text-2xl sm:text-3xl font-extrabold drop-shadow mb-1">
        {value}
      </div>
      <div className="text-sm sm:text-lg font-semibold tracking-wide uppercase opacity-90 text-center px-2">
        {label}
      </div>
      <div className="text-xs mt-2 underline text-blue-200">View</div>
    </a>
  );
}
