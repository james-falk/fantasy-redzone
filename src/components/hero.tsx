interface HeroProps {
  title: string[]
  description: string
}

const Hero: React.FC<HeroProps> = ({ title, description }) => {
  return (
    <section className="relative py-24 md:py-32 redzone-hero-bg overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20"></div>
      <div className="absolute top-0 left-0 w-full h-2 redzone-gradient"></div>
      
      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 text-center">
        <div className="mb-8">
          <h1 className="mb-6 text-5xl md:text-7xl lg:text-8xl font-black tracking-wide text-white redzone-text-shadow">
            <span className="inline-block redzone-gradient-intense px-6 py-3 rounded-lg shadow-2xl redzone-glow mr-4 transform hover:scale-105 transition-transform duration-300">
              {title[0].toUpperCase()}
            </span>
            <span className="text-white drop-shadow-2xl">
              {title[1].toUpperCase()}
            </span>
          </h1>
          
          {/* Tagline */}
          <div className="mb-8">
            <div className="inline-block redzone-red px-6 py-2 rounded-full text-white font-bold text-lg md:text-xl tracking-wider uppercase shadow-lg">
              EVERY TOUCHDOWN • EVERY PLAY • EVERY SUNDAY
            </div>
          </div>
        </div>
        
        <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed font-medium">
          {description}
        </p>
        
        {/* Call to Action */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button className="redzone-gradient-intense hover:scale-105 transform transition-all duration-300 px-8 py-4 rounded-lg text-white font-bold text-lg tracking-wide shadow-xl redzone-glow">
            START DOMINATING NOW
          </button>
          <button className="border-2 border-white/30 hover:border-white text-white hover:bg-white/10 transform hover:scale-105 transition-all duration-300 px-8 py-4 rounded-lg font-bold text-lg tracking-wide">
            WATCH HIGHLIGHTS
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
