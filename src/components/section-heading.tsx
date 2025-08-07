import { FC } from "react";

interface SectionHeadingProps {
  title: string[];
  subtitle?: string;
}

const SectionHeading: FC<SectionHeadingProps> = ({ title, subtitle }) => (
  <div className="my-12 text-center">
    <h2 className="text-4xl md:text-5xl font-black text-white redzone-text-shadow mb-4 tracking-wide">
      {title[0]} <span className="redzone-red-text">{title[1].toUpperCase()}</span>
    </h2>
    {subtitle && (
      <div className="max-w-4xl mx-auto">
        <p className="text-lg md:text-xl text-gray-300 leading-relaxed font-medium">{subtitle}</p>
        <div className="mt-6 w-24 h-1 redzone-gradient mx-auto rounded-full"></div>
      </div>
    )}
  </div>
);

export default SectionHeading;
