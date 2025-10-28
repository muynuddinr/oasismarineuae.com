"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Banner() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState(0);

  // Array of banner images with descriptions and links
  // Professional Landing Banner Data
// Professional Landing Banner Data (with original images)
// Professional Landing Banner Data (with original images)
const banners = [
  {
    image: "/banner/Contact.jpg",
    title: 'Reliable Marine & Industrial Solutions',
    highlight: "Trusted Partner Since 2023",
    description:
      "Delivering high-performance marine and oilfield equipment built for strength, precision, and durability. Empowering industries across the UAE and beyond with innovative supply solutions.",
    cta: "Explore Our Solutions",
    ctaLink: "/products",
  },
  {
    image: "/banner/About.jpg",
    title: 'Engineered for Performance',
    highlight: "Innovation That Drives Success",
    description:
      "Our advanced product range and commitment to quality ensure unmatched reliability in the toughest marine and industrial environments.",
    cta: "Discover Innovation",
    ctaLink: "/innovation",
  },
  {
    image: "/banner/Our Products.jpg",
    title: 'Driven by Excellence',
    highlight: "Precision. Durability. Trust.",
    description:
      "From valves and flanges to hoses and fittings, our solutions deliver top-tier performance for industrial and marine applications.",
    cta: "View Products",
    ctaLink: "/products",
  },
  {
    image: "/banner/Branches.jpg",
    title: 'Connecting Industries Worldwide',
    highlight: "Global Reach. Local Expertise.",
    description:
      "With a strong distribution network and dedicated customer support, we ensure seamless supply and responsive service across regions.",
    cta: "Explore Network",
    ctaLink: "/network",
  },
];


  // Auto-rotate images every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setDirection(1); // Forward direction for auto-rotation
      setCurrentImageIndex((prevIndex) =>
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  // Handle indicator click
  const handleIndicatorClick = (index: number) => {
    const newDirection = index > currentImageIndex ? 1 : -1;
    setDirection(newDirection);
    setCurrentImageIndex(index);
    setClickedIndex(index);
    setTimeout(() => setClickedIndex(null), 1000); // Reset after 1 second
  };

  // Animation variants
  const bannerVariants = {
    enter: (direction: number) => {
      return {
        x: direction > 0 ? 1000 : -1000,
        opacity: 0,
      };
    },
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => {
      return {
        x: direction < 0 ? 1000 : -1000,
        opacity: 0,
      };
    },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
      },
    },
  };

  // Underline animation variants - UPDATED COLOR to #3f23cc
  const underlineVariants = {
    hidden: {
      width: 0,
      opacity: 0
    },
    visible: {
      width: "30%",
      opacity: 1,
      transition: {
        delay: 0.8,
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  return (
    <div className="w-full relative banner">
      {/* Banner Container - Full screen height */}
      <div className="relative w-full h-screen mt-4 min-h-[600px] overflow-hidden">
        <AnimatePresence custom={direction} initial={false}>
          <motion.div
            key={currentImageIndex}
            custom={direction}
            variants={bannerVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", ease: "easeInOut", duration: 0.8 }}
            className="absolute inset-0"
          >
            <Image
              src={banners[currentImageIndex].image}
              alt={`Banner image ${currentImageIndex + 1}`}
              fill
              className="object-cover"
              priority={currentImageIndex === 0}
              sizes="100vw"
            />

            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Banner Content - Left aligned */}
            <div className="absolute inset-0 flex items-center">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="text-white px-6 md:px-12 lg:px-16 max-w-4xl lg:max-w-5xl"
              >
                {/* Title with Animated Underline */}
                <div className="relative inline-block mb-6">
                  <motion.h1
                    variants={itemVariants}
                    className="text-3xl md:text-5xl lg:text-6xl  leading-tight"
                    dangerouslySetInnerHTML={{ __html: banners[currentImageIndex].title }}
                  />

                  <motion.div
                    variants={underlineVariants}
                    initial="hidden"
                    animate="visible"
                    className="absolute -bottom-2 left-0 h-1 bg-gray-200 rounded-full shadow-lg"
                    style={{
                      boxShadow: "0 0 12px rgba(63, 35, 204, 0.5)",
                    }}
                  />
                </div>

                <motion.p
                  variants={itemVariants}
                  className="text-base md:text-lg lg:text-xl text-gray-200 mb-8 leading-relaxed drop-shadow-md"
                >
                  {banners[currentImageIndex].description}
                </motion.p>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="absolute bottom-6 left-6 flex space-x-2 z-10">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => handleIndicatorClick(index)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${index === currentImageIndex
                  ? "bg-white scale-110"
                  : "bg-white/50"
                } ${clickedIndex === index ? "scale-125" : ""}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx global>{`
        .banner p {
          font-size: 18px; /* a little bigger */
          line-height: 1.75;
          margin: 0;
          max-width: none;
          display: block;
          overflow: visible;
          text-overflow: clip;
          max-height: none;
        }
      `}</style>
    </div>
  );
}