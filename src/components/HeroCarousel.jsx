"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  ArrowRight,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  Image as ImageIcon,
  Film,
} from "lucide-react";

// Curated high-resolution biomedical and diagnostic laboratory images
const STATIC_HERO_SLIDES = [
  {
    id: "slide-1",
    type: "image",
    url: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=2000&q=85",
    alt: "Automated Clinical Chemistry and Hematology Diagnostic Equipment",
  },
  {
    id: "slide-2",
    type: "image",
    url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=2000&q=85",
    alt: "Precision Pathology & Biomedical Laboratory Solutions",
  },
  {
    id: "slide-3",
    type: "image",
    url: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=2000&q=85",
    alt: "State-of-the-Art Hospital & Clinical Diagnostic Systems",
  },
  {
    id: "slide-4",
    type: "image",
    url: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=2000&q=85",
    alt: "Certified Biomedical Engineering & Laboratory Maintenance",
  },
];

export default function HeroCarousel({
  locationTitle = "",
  makeLink = (path) => path,
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const videoRefs = useRef({});

  const slides = STATIC_HERO_SLIDES;

  const heroBadge = locationTitle
    ? `Leading Biomedical Supplier in ${locationTitle}`
    : "Pioneering Biomedical & Diagnostic Innovations";

  const heroTitle = locationTitle
    ? `Leading Biomedical & Diagnostic Supplier in ${locationTitle}`
    : "Next-Gen Diagnostic Technologies & Healthcare Equipment";

  const heroDescription =
    "Delivering precision hematology, biochemistry analyzers, lab reagents, and certified 24/7 biomedical engineering support across India.";

  const btn1Text = "Explore Products";
  const btn2Text = "Contact Us";

  const btn1Href = makeLink("/items");
  const btn2Href = makeLink("/contact");

  useEffect(() => {
    if (!isPlaying || slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isPlaying, slides.length]);

  useEffect(() => {
    if (currentSlide >= slides.length) {
      setCurrentSlide(Math.max(0, slides.length - 1));
    }
  }, [slides.length, currentSlide]);

  useEffect(() => {
    const media = slides[currentSlide];
    if (media?.type === "video") {
      videoRefs.current[currentSlide]?.play().catch(() => { });
    }
  }, [currentSlide, slides]);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (touchStart == null || touchEnd == null) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) handleNext();
    else if (distance < -50) handlePrev();
  };

  const getOffset = (index) => {
    if (index === currentSlide) return 0;
    const diff = (index - currentSlide + slides.length) % slides.length;
    return diff === 1 ? 1 : diff === slides.length - 1 ? -1 : 2;
  };

  return (
    <section
      data-dark="true"
      className="hero-carousel-section relative overflow-hidden bg-[#240D1C] text-white py-3 sm:py-4 lg:py-5 select-none"
    >
      <div
        className="relative min-h-[380px] sm:min-h-[430px] lg:min-h-[480px] flex flex-col justify-center items-center"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* ================= 3D OFFSET CAROUSEL CARDS ================= */}
        <div className="relative w-full h-[340px] sm:h-[390px] lg:h-[440px] flex items-center justify-center overflow-hidden">
          {slides.map((media, index) => {
            const offset = getOffset(index);
            const active = offset === 0;

            return (
              <motion.div
                key={media.id || media.url || index}
                onClick={() => {
                  if (offset === 1) handleNext();
                  if (offset === -1) handlePrev();
                }}
                animate={{
                  x:
                    offset === 0
                      ? "0%"
                      : offset === 1
                        ? "58%"
                        : offset === -1
                          ? "-58%"
                          : "0%",
                  scale: active ? 1 : 0.85,
                  opacity: active ? 1 : Math.abs(offset) === 1 ? 0.85 : 0,
                  zIndex: active ? 25 : 10,
                }}
                transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
                className={`absolute w-[92%] sm:w-[84%] lg:w-[74%] h-[320px] sm:h-[370px] lg:h-[420px] rounded-[22px] sm:rounded-[30px] overflow-hidden border-2 sm:border-3 ${active
                  ? "border-white/30 shadow-[0_15px_45px_rgba(0,0,0,0.65)]"
                  : "border-white/15 shadow-xl cursor-pointer hover:border-white/30"
                  }`}
              >
                {/* Image / Video Media (High Opacity & High Resolution) */}
                {media.type === "video" ? (
                  <video
                    ref={(el) => (videoRefs.current[index] = el)}
                    src={media.url}
                    className="h-full w-full object-cover opacity-100"
                    autoPlay={active}
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={media.url}
                    alt={`Hero Slide ${index + 1}`}
                    className="h-full w-full object-cover object-center opacity-100"
                    style={{ opacity: 1 }}
                    onError={(e) => {
                      e.currentTarget.src = STATIC_HERO_SLIDES[0].url;
                    }}
                  />
                )}

                {/* Directional Overlay for Crisp Text Contrast */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#1D0916]/95 via-[#1D0916]/65 sm:via-[#1D0916]/40 to-transparent w-full md:w-[65%]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1D0916]/75 via-transparent to-black/20 pointer-events-none" />

                {/* Foreground Content inside Active Slide */}
                {active && (
                  <div className="absolute inset-0 z-20 flex flex-col justify-center px-5 sm:px-8 lg:px-12 py-5 sm:py-6 max-w-2xl lg:max-w-3xl">
                    {/* Top Location / Badge */}
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/40 px-3 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white shadow-md backdrop-blur-md w-fit"
                    >
                      <Sparkles size={12} className="text-[#E5799D] animate-pulse" />
                      <span className="!text-white font-bold">
                        {heroBadge}
                      </span>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                      key={`title-${index}-${heroTitle}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.08 }}
                      className="hero-title mt-2 sm:mt-2.5 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black leading-tight !text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]"
                      style={{ color: "#ffffff" }}
                    >
                      {heroTitle}
                    </motion.h1>

                    {/* Description */}
                    <motion.p
                      key={`desc-${index}-${heroDescription}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.15 }}
                      className="hero-desc mt-2 sm:mt-2.5 max-w-xl text-xs sm:text-sm md:text-base leading-relaxed !text-[#FDEBF2] font-normal drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)] line-clamp-2 md:line-clamp-3"
                      style={{ color: "#FDEBF2" }}
                    >
                      {heroDescription}
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.22 }}
                      className="mt-3.5 sm:mt-4 flex flex-wrap items-center gap-2.5 sm:gap-3"
                    >
                      {btn1Text && (
                        <Link
                          href={btn1Href}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#BE4F78] px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold !text-white shadow-lg shadow-[#BE4F78]/40 hover:bg-[#8F385B] hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border border-white/20"
                        >
                          <span className="!text-white font-bold">{btn1Text}</span>
                          <ArrowRight size={14} className="!text-white" />
                        </Link>
                      )}

                      {btn2Text && (
                        <Link
                          href={btn2Href}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/40 bg-white/15 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold !text-white backdrop-blur-md hover:bg-white hover:!text-[#3B1830] hover:border-white shadow-sm transition-all duration-300 group"
                        >
                          <PhoneCall
                            size={14}
                            className="text-[#E5799D] group-hover:text-[#3B1830] transition-colors"
                          />
                          <span className="font-bold">{btn2Text}</span>
                        </Link>
                      )}
                    </motion.div>

                    {/* Trust Indicators */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.28 }}
                      className="mt-3.5 hidden sm:flex flex-wrap items-center gap-4 border-t border-white/20 pt-2.5 text-[11px] font-semibold text-white/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
                    >
                      <div className="flex items-center gap-1">
                        <CheckCircle2 size={13} className="text-[#E5799D] shrink-0" />
                        <span className="!text-white font-medium">ISO 13485 Certified</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 size={13} className="text-[#E5799D] shrink-0" />
                        <span className="!text-white font-medium">24/7 SLA Support</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 size={13} className="text-[#E5799D] shrink-0" />
                        <span className="!text-white font-medium">NABL Traceable QC</span>
                      </div>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* ================= BOTTOM CONTROLS & PAGINATION ================= */}
        {slides.length > 1 && (
          <div className="mt-2.5 sm:mt-3 flex items-center justify-center gap-2.5 z-30">
            {/* Prev Button */}
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous slide"
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-black/50 text-white backdrop-blur-md border border-white/20 hover:bg-[#BE4F78] hover:border-[#BE4F78] transition-all shadow-md active:scale-95"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Play / Pause Toggle */}
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-black/50 text-white backdrop-blur-md border border-white/20 hover:bg-[#BE4F78] hover:border-[#BE4F78] transition-all shadow-md active:scale-95"
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} />}
            </button>

            {/* Slide Counter Pill */}
            <div className="flex items-center gap-1 rounded-lg bg-black/60 px-2.5 py-1 text-[11px] sm:text-xs font-bold text-white backdrop-blur-md border border-white/20 shadow-md">
              {slides[currentSlide]?.type === "video" ? (
                <Film size={11} className="text-[#E5799D]" />
              ) : (
                <ImageIcon size={11} className="text-[#E5799D]" />
              )}
              <span>
                {currentSlide + 1} / {slides.length}
              </span>
            </div>

            {/* Next Button */}
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next slide"
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-black/50 text-white backdrop-blur-md border border-white/20 hover:bg-[#BE4F78] hover:border-[#BE4F78] transition-all shadow-md active:scale-95"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Bottom Pagination Dots */}
        {slides.length > 1 && (
          <div className="mt-2 flex items-center justify-center gap-1.5 z-30">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full h-1.5 sm:h-2 ${currentSlide === idx
                  ? "w-6 sm:w-7 bg-[#E5799D] shadow-md shadow-[#E5799D]/60"
                  : "w-1.5 sm:w-2 bg-white/40 hover:bg-white/80"
                  }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
