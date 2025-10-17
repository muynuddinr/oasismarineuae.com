"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Banner() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState(0);

  // Array of banner images with descriptions and links
  const banners = [
    {
      image: "/banner/Contact.jpg",
      title: 'Contact <span class="text-[#3f23cc]">Us</span>',
      highlight: "Get In Touch",
      description: "Reach out for quotes, support, or inquiries. Our expert team is here to help you find the right marine and industrial supplies.",
      cta: "Contact Now",
      ctaLink: "/contact",
    },
    {
      image: "/banner/About.jpg",
      title: 'About <span class="text-[#3f23cc]">Us</span>',
      highlight: "Excellence Since 2023",
      description: "Founded in 2023, we deliver high-quality marine & oilfield equipment across UAE & Middle East, driven by innovation, quality & customer service.",
      cta: "Learn More",
      ctaLink: "/about",
    },
    {
      image: "/banner/Our Products.jpg",
      title: 'Our <span class="text-[#3f23cc]">Products</span>',
      highlight: "Premium Equipment",
      description: "Valves, fittings, flanges, rubber & gasket sheets, clamps, hoses + more — all engineered for durability & performance in demanding environments.",
      cta: "Browse Products",
      ctaLink: "/products",
    },
    {
      image: "/banner/Branches.jpg",
      title: 'Our <span class="text-[#3f23cc]">Branches</span>',
      highlight: "Serving You Better",
      description: "Serving multiple locations with efficient distribution, quick response & in-person support so you can count on local presence & reliability.",
      cta: "Find Location",
      ctaLink: "/branch",
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
    <div className="w-full relative">
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
                className="text-white px-8 md:px-12 lg:px-24 max-w-2xl"
              >
                {/* Title with Animated Underline */}
                <div className="relative inline-block mb-6">
                  <motion.h1
                    variants={itemVariants}
                    className="text-4xl md:text-5xl lg:text-6xl  leading-tight"
                    dangerouslySetInnerHTML={{ __html: banners[currentImageIndex].title }}
                  />
                 
                  <motion.div
                    variants={underlineVariants}
                    initial="hidden"
                    animate="visible"
                    className="absolute -bottom-2 left-0 h-1 bg-[#3f23cc] rounded-full shadow-lg"
                    style={{
                      boxShadow: "0 0 12px rgba(63, 35, 204, 0.5)",
                    }}
                  />
                </div>

                <motion.p
                  variants={itemVariants}
                  className="text-lg md:text-xl lg:text-2xl mb-8 font-light tracking-wide opacity-90 max-w-xl"
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
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                index === currentImageIndex
                  ? "bg-white scale-110"
                  : "bg-white/50"
              } ${clickedIndex === index ? "scale-125" : ""}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Custom Styles */}
      
    </div>
  );
}