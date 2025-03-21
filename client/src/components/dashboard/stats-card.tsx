import { ReactNode } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  iconBgColor: string;
  iconColor: string;
  changeValue?: number;
  changeText?: string;
}

export default function StatsCard({
  title,
  value,
  icon,
  iconBgColor,
  iconColor,
  changeValue,
  changeText
}: StatsCardProps) {
  const isPositiveChange = changeValue && changeValue > 0;
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 ${iconBgColor} rounded-full p-3`}>
          <div className={`h-6 w-6 ${iconColor}`}>{icon}</div>
        </div>
        <div className="ml-5">
          <p className="text-gray-500 text-sm">{title}</p>
          <h3 className="text-xl font-bold text-gray-800">{value}</h3>
        </div>
      </div>
      
      {(changeValue !== undefined && changeText) && (
        <div className="mt-4">
          <div className="flex items-center">
            <span className={`text-sm flex items-center ${isPositiveChange ? 'text-green-500' : 'text-red-500'}`}>
              {isPositiveChange ? (
                <ArrowUp className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDown className="h-4 w-4 mr-1" />
              )}
              {Math.abs(changeValue)}%
            </span>
            <span className="text-xs text-gray-500 ml-2">{changeText}</span>
          </div>
        </div>
      )}
    </div>
  );
}
