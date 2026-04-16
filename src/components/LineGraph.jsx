"use client";

import { useEffect, useState } from "react";

export default function LineGraph({ title, data, maxValue, color = "#4f7c82" }) {
  const [pathLength, setPathLength] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
 
  const [width, setWidth] = useState(1200);
  const height = 230;

  useEffect(() => {
    const updateWidth = () => {
      if (typeof window !== 'undefined') {
        
        const is2560 = window.innerWidth >= 2560;
        const isMobile = window.innerWidth < 640;
        const containerWidth = is2560
          ? window.innerWidth - 200 
          : isMobile 
            ? window.innerWidth - 40 
            : Math.min(window.innerWidth - 100, 1200); 
        setWidth(containerWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);
  const padding = { 
    top: 20, 
    right: width < 640 ? 20 : 20, 
    bottom: 40, 
    left: width < 640 ? 35 : 32
  };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    setIsVisible(false);
   
    setTimeout(() => {
      setIsVisible(true);
    }, 50);
    
    const yMax = maxValue || Math.max(Math.max(...data.map(d => d.value || 0), 0), 10);
    let length = 0;
    
    for (let i = 1; i < data.length; i++) {
      const x1 = data.length <= 1 ? padding.left + chartWidth / 2 : padding.left + ((i - 1) / (data.length - 1)) * chartWidth;
      const y1 = padding.top + chartHeight - ((data[i - 1].value || 0) / yMax) * chartHeight;
      const x2 = data.length <= 1 ? padding.left + chartWidth / 2 : padding.left + (i / (data.length - 1)) * chartWidth;
      const y2 = padding.top + chartHeight - ((data[i].value || 0) / yMax) * chartHeight;
      length += Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }
    setPathLength(length);
  }, [data, maxValue, chartWidth, chartHeight]);

  if (!data || data.length === 0) {
    return (
      <>
        {title && <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>}
        <div className="flex items-center justify-center h-60 text-gray-500">
          No data available
        </div>
      </>
    );
  }

  // Get max value from data or provided maxValue
  const dataMax = Math.max(...data.map(d => d.value || 0), 0);
  const yMax = maxValue || Math.max(dataMax, 10); // Minimum 10 for better visualization
  const yStep = Math.ceil(yMax / 7); // 7 major grid lines

  // Calculate x and y scales
  const xScale = (index) => {
    if (data.length <= 1) return padding.left + chartWidth / 2;
    return padding.left + (index / (data.length - 1)) * chartWidth;
  };

  const yScale = (value) => {
    return padding.top + chartHeight - (value / yMax) * chartHeight;
  };

  // Generate path for line with smooth curves
  const generatePath = () => {
    if (data.length === 0) return "";
    if (data.length === 1) {
      const value = data[0].value || 0;
      return `M ${xScale(0)} ${yScale(value)} L ${xScale(0) + 10} ${yScale(value)}`;
    }
    
    // Create smooth curve using quadratic bezier curves
    let path = `M ${xScale(0)} ${yScale(data[0].value || 0)}`;
    
    for (let i = 1; i < data.length; i++) {
      const x1 = xScale(i - 1);
      const y1 = yScale(data[i - 1].value || 0);
      const x2 = xScale(i);
      const y2 = yScale(data[i].value || 0);
      
      // Calculate control point for smooth curve
      const cpX = (x1 + x2) / 2;
      const cpY1 = y1;
      const cpY2 = y2;
      
      path += ` Q ${cpX} ${cpY1}, ${x2} ${y2}`;
    }
    
    return path;
  };

  // Generate area path (for gradient fill)
  const generateAreaPath = () => {
    if (data.length === 0) return "";
    const linePath = generatePath();
    const firstX = xScale(0);
    const lastX = xScale(data.length - 1);
    const bottomY = padding.top + chartHeight;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  // Generate Y-axis labels
  const yLabels = [];
  for (let i = 0; i <= 7; i++) {
    const value = i * yStep;
    if (value <= yMax) {
      yLabels.push({
        value,
        y: yScale(value),
      });
    }
  }

  return (
    <>
      {title && <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>}
      <div className="w-full overflow-hidden">
        <svg width={width} height={height} className="w-full" style={{ display: 'block' }}>
          {/* Gradient definition for area fill */}
          <defs>
            <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Grid lines with fade-in animation */}
          {yLabels.map((label, index) => (
            <g key={index}>
              <line
                x1={padding.left}
                y1={label.y}
                x2={width - padding.right}
                y2={label.y}
                stroke="#e5e7eb"
                strokeWidth="1"
                className="transition-opacity duration-500"
                style={{ opacity: isVisible ? 1 : 0, transitionDelay: `${index * 50}ms` }}
              />
            </g>
          ))}

          {/* Y-axis labels */}
          {yLabels.map((label, index) => (
            <text
              key={index}
              x={padding.left - 10}
              y={label.y + 4}
              textAnchor="end"
              fontSize="12"
              fill="#6b7280"
              className="transition-opacity duration-500"
              style={{ opacity: isVisible ? 1 : 0, transitionDelay: `${index * 50}ms` }}
            >
              {Math.round(label.value)}
            </text>
          ))}

          {/* X-axis labels */}
          {data.map((item, index) => {
       
            const isLargeScreen = width >= 1024;
            const showLabel = isLargeScreen 
              ? (index % 2 === 0 || index === data.length - 1) // Show every 2nd label on laptop
              : (data.length <= 10 || index % Math.ceil(data.length / 10) === 0 || index === data.length - 1);
            return showLabel ? (
              <text
                key={index}
                x={xScale(index)}
                y={height - padding.bottom + 20}
                textAnchor="middle"
                fontSize="12"
                fill="#6b7280"
                className="transition-opacity duration-500"
                style={{ opacity: isVisible ? 1 : 0, transitionDelay: `${index * 30}ms` }}
              >
                {item.label}
              </text>
            ) : null;
          })}

          {/* Area fill under the line */}
          <path
            d={generateAreaPath()}
            fill={`url(#gradient-${color.replace('#', '')})`}
            className="transition-opacity duration-1000"
            style={{ opacity: isVisible ? 1 : 0 }}
          />

          {/* Main line path with animation */}
          <path
            d={generatePath()}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-1000"
            style={{
              strokeDasharray: pathLength,
              strokeDashoffset: isVisible ? 0 : pathLength,
              opacity: isVisible ? 1 : 0,
            }}
          />
        </svg>
      </div>
    </>
  );
}


















// "use client";

// import { useEffect, useState } from "react";

// export default function LineGraph({ title, data, maxValue, color = "#4f7c82" }) {
//   const [pathLength, setPathLength] = useState(0);
//   const [isVisible, setIsVisible] = useState(false);
  
//   // Calculate dimensions - responsive width
//   const [width, setWidth] = useState(296); // Default for 320px screens
//   const height = 200;

//   useEffect(() => {
//     const updateWidth = () => {
//       if (typeof window !== 'undefined') {
//         if (window.innerWidth <= 320) {
//           // For 320px screens, use exact container width minus padding
//           setWidth(320 - 24); // 12px padding on each side
//         } else if (window.innerWidth > 1536) {
//           // Use full container width on large screens
//           setWidth(window.innerWidth - 100);
//         } else {
//           // Responsive for other screens
//           const containerWidth = Math.min(window.innerWidth - 32, 1200);
//           const minWidth = window.innerWidth < 640 ? 280 : 600;
//           setWidth(Math.max(containerWidth, minWidth));
//         }
//       }
//     };
//     updateWidth();
//     window.addEventListener('resize', updateWidth);
//     return () => window.removeEventListener('resize', updateWidth);
//   }, []);
//   const padding = { 
//     top: 40, 
//     right: window?.innerWidth <= 320 ? 20 : 40, 
//     bottom: 40, 
//     left: window?.innerWidth <= 320 ? 30 : 50 
//   };
//   const chartWidth = width - padding.left - padding.right;
//   const chartHeight = height - padding.top - padding.bottom;

//   // Calculate path length and trigger animation on mount
//   useEffect(() => {
//     if (!data || data.length === 0) return;
    
//     setIsVisible(false);
//     // Reset and animate
//     setTimeout(() => {
//       setIsVisible(true);
//     }, 50);
    
//     // Approximate path length for animation
//     const yMax = maxValue || Math.max(Math.max(...data.map(d => d.value || 0), 0), 10);
//     let length = 0;
    
//     for (let i = 1; i < data.length; i++) {
//       const x1 = data.length <= 1 ? padding.left + chartWidth / 2 : padding.left + ((i - 1) / (data.length - 1)) * chartWidth;
//       const y1 = padding.top + chartHeight - ((data[i - 1].value || 0) / yMax) * chartHeight;
//       const x2 = data.length <= 1 ? padding.left + chartWidth / 2 : padding.left + (i / (data.length - 1)) * chartWidth;
//       const y2 = padding.top + chartHeight - ((data[i].value || 0) / yMax) * chartHeight;
//       length += Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
//     }
//     setPathLength(length);
//   }, [data, maxValue, chartWidth, chartHeight]);

//   // Handle empty data - must be after all hooks
//   if (!data || data.length === 0) {
//     return (
//       <>
//         {title && <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>}
//         <div className="flex items-center justify-center h-60 text-gray-500">
//           No data available
//         </div>
//       </>
//     );
//   }

//   // Get max value from data or provided maxValue
//   const dataMax = Math.max(...data.map(d => d.value || 0), 0);
//   const yMax = maxValue || Math.max(dataMax, 10); // Minimum 10 for better visualization
//   const yStep = Math.ceil(yMax / 7); // 7 major grid lines

//   // Calculate x and y scales
//   const xScale = (index) => {
//     if (data.length <= 1) return padding.left + chartWidth / 2;
//     return padding.left + (index / (data.length - 1)) * chartWidth;
//   };

//   const yScale = (value) => {
//     return padding.top + chartHeight - (value / yMax) * chartHeight;
//   };

//   // Generate path for line with smooth curves
//   const generatePath = () => {
//     if (data.length === 0) return "";
//     if (data.length === 1) {
//       const value = data[0].value || 0;
//       return `M ${xScale(0)} ${yScale(value)} L ${xScale(0) + 10} ${yScale(value)}`;
//     }
    
//     // Create smooth curve using quadratic bezier curves
//     let path = `M ${xScale(0)} ${yScale(data[0].value || 0)}`;
    
//     for (let i = 1; i < data.length; i++) {
//       const x1 = xScale(i - 1);
//       const y1 = yScale(data[i - 1].value || 0);
//       const x2 = xScale(i);
//       const y2 = yScale(data[i].value || 0);
      
//       // Calculate control point for smooth curve
//       const cpX = (x1 + x2) / 2;
//       const cpY1 = y1;
//       const cpY2 = y2;
      
//       path += ` Q ${cpX} ${cpY1}, ${x2} ${y2}`;
//     }
    
//     return path;
//   };

//   // Generate area path (for gradient fill)
//   const generateAreaPath = () => {
//     if (data.length === 0) return "";
//     const linePath = generatePath();
//     const firstX = xScale(0);
//     const lastX = xScale(data.length - 1);
//     const bottomY = padding.top + chartHeight;
//     return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
//   };

//   // Generate Y-axis labels with reduced count for mobile
//   const yLabels = [];
//   const labelCount = typeof window !== 'undefined' && window.innerWidth <= 320 ? 4 : 7; // Fewer labels on mobile
//   const step = Math.ceil(yMax / labelCount);
  
//   for (let i = 0; i <= labelCount; i++) {
//     const value = i * step;
//     if (value <= yMax) {
//       yLabels.push({
//         value,
//         y: yScale(value),
//       });
//     }
//   }

//   return (
//     <>
//       {title && <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>}
//       <div className="w-full overflow-hidden">
//         <svg width={width} height={height} className="w-full block" style={{ maxWidth: '100%', height: 'auto', overflow: 'visible' }}>
//           {/* Gradient definition for area fill */}
//           <defs>
//             <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
//               <stop offset="0%" stopColor={color} stopOpacity="0.3" />
//               <stop offset="100%" stopColor={color} stopOpacity="0.05" />
//             </linearGradient>
//           </defs>

//           {/* Grid lines with fade-in animation */}
//           {yLabels.map((label, index) => (
//             <g key={index}>
//               <line
//                 x1={padding.left}
//                 y1={label.y}
//                 x2={width - padding.right}
//                 y2={label.y}
//                 stroke="#e5e7eb"
//                 strokeWidth="1"
//                 className="transition-opacity duration-500"
//                 style={{ opacity: isVisible ? 1 : 0, transitionDelay: `${index * 50}ms` }}
//               />
//             </g>
//           ))}

//           {/* Y-axis labels */}
//           {yLabels.map((label, index) => (
//             <text
//               key={index}
//               x={padding.left - 10}
//               y={label.y + 4}
//               textAnchor="end"
//               fontSize={typeof window !== 'undefined' && window.innerWidth <= 320 ? "10" : "12"}
//               fill="#6b7280"
//               className="transition-opacity duration-500"
//               style={{ opacity: isVisible ? 1 : 0, transitionDelay: `${index * 50}ms` }}
//             >
//               {Math.round(label.value)}
//             </text>
//           ))}

//           {/* X-axis labels with better mobile spacing */}
//           {data.map((item, index) => {
//             // Show fewer labels on mobile to avoid crowding
//             const isMobile = typeof window !== 'undefined' && window.innerWidth <= 320;
//             const labelInterval = isMobile ? Math.ceil(data.length / 4) : Math.ceil(data.length / 10);
//             const showLabel = data.length <= (isMobile ? 6 : 10) || index % labelInterval === 0 || index === data.length - 1;
            
//             return showLabel ? (
//               <text
//                 key={index}
//                 x={xScale(index)}
//                 y={height - padding.bottom + 20}
//                 textAnchor="middle"
//                 fontSize={isMobile ? "10" : "12"}
//                 fill="#6b7280"
//                 className="transition-opacity duration-500"
//                 style={{ opacity: isVisible ? 1 : 0, transitionDelay: `${index * 30}ms` }}
//               >
//                 {item.label}
//               </text>
//             ) : null;
//           })}

//           {/* Area fill under the line */}
//           <path
//             d={generateAreaPath()}
//             fill={`url(#gradient-${color.replace('#', '')})`}
//             className="transition-opacity duration-1000"
//             style={{ opacity: isVisible ? 1 : 0 }}
//           />

//           {/* Main line path with animation */}
//           <path
//             d={generatePath()}
//             fill="none"
//             stroke={color}
//             strokeWidth="4"
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             className="transition-all duration-1000"
//             style={{
//               strokeDasharray: pathLength,
//               strokeDashoffset: isVisible ? 0 : pathLength,
//               opacity: isVisible ? 1 : 0,
//             }}
//           />
//         </svg>
//       </div>
//     </>
//   );
// }

