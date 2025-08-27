interface HeroProps {
  title: string[]
  description: string
}

const Hero: React.FC<HeroProps> = ({ title, description }) => {
  return (
    <section className="relative py-12 md:py-16 redzone-hero-bg overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20"></div>
      <div className="absolute top-0 left-0 w-full h-2 redzone-gradient"></div>
      
      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 text-center">
        <div className="mb-4">
          <h1 className="mb-4 text-4xl md:text-6xl lg:text-7xl font-black tracking-wide text-white redzone-text-shadow">
            <span className="inline-block redzone-gradient-intense px-4 py-2 rounded-lg shadow-2xl redzone-glow mr-3 transform hover:scale-105 transition-transform duration-300">
              {title[0].toUpperCase()}
            </span>
            <span className="text-white drop-shadow-2xl">
              {title[1].toUpperCase()}
            </span>
          </h1>
        </div>
        
        <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-medium">
          {description}
        </p>
        
        {/* Call to Action */}
        <div className="mt-6 flex justify-center items-center">
          <button className="redzone-gradient-intense hover:scale-105 transform transition-all duration-300 px-6 py-3 rounded-lg text-white font-bold text-base tracking-wide shadow-xl redzone-glow">
            START DOMINATING NOW
          </button>
        </div>
      </div>
      
      {/* Bottom accent */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent"></div>
    </section>
  )
}

export default Hero
// import React from "react";

// interface HeroProps {
//   title: string;
//   description?: string;
// }

// const Hero: React.FC<HeroProps> = ({ title, description }) => {
//   return (
//     <div className="bg-zinc-100">
//       <div className="mx-auto max-w-3xl px-3 py-6 text-center md:py-11">
//         <h1 className="text-3xl font-semibold leading-tight text-stone-900 md:text-[40px]">
//           {title}
//         </h1>
//         {description && (
//           <h2 className="mt-5 text-lg text-stone-900 md:font-medium">
//             {description}
//           </h2>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Hero;
