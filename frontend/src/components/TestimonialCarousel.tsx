import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

interface Testimonial {
  id: string;
  name: string;
  text: string;
  role?: string;
  avatar_url?: string;
}

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
}

export const TestimonialCarousel = ({ testimonials }: TestimonialCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Define o índice central
  const middleIndex = Math.max(0, Math.floor((testimonials?.length || 0) / 2));
  const [activeIndex, setActiveIndex] = useState(middleIndex);

  const scrollToIndex = (index: number, immediate = false) => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const cards = container.querySelectorAll(".testimonial-card");
    if (cards[index]) {
      const card = cards[index] as HTMLElement;
      container.scrollTo({
        left: card.offsetLeft - (container.offsetWidth / 2) + (card.offsetWidth / 2),
        behavior: immediate ? "auto" : "smooth",
      });
      setActiveIndex(index);
    }
  };

  // Rola para o centro logo após carregar os depoimentos
  useEffect(() => {
    if (testimonials?.length > 0) {
      const mid = Math.floor(testimonials.length / 2);
      setActiveIndex(mid);
      
      const timer = setTimeout(() => {
        scrollToIndex(mid, true); // true = rolagem imediata, sem animação na primeira vez
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [testimonials]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const cards = container.querySelectorAll(".testimonial-card");
    let closestIndex = 0;
    let minDistance = Infinity;

    cards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const distance = Math.abs(
        (rect.left + rect.width / 2) - (containerRect.left + containerRect.width / 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex !== activeIndex) {
      setActiveIndex(closestIndex);
    }
  };

  const prev = () => scrollToIndex(Math.max(0, activeIndex - 1));
  const next = () => scrollToIndex(Math.min(testimonials.length - 1, activeIndex + 1));

  return (
    <div className="relative w-full py-12 px-4 md:px-12 group">
      {/* Scroll Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-12 pt-8 no-scrollbar items-stretch scroll-smooth"
        style={{ scrollPadding: "0 2rem" }}
      >
        {/* Shadow spacers for better centering */}
        <div className="shrink-0 w-[5vw] md:w-[25vw]" />
        
        {testimonials.map((t, i) => (
          <div
            key={t.id}
            className={cn(
              "testimonial-card transition-all duration-500 snap-center shrink-0 w-[280px] md:w-[400px] flex flex-col scale-90 opacity-40",
              activeIndex === i && "scale-105 opacity-100 z-10"
            )}
          >
            <div className="bg-card border border-border/50 rounded-[2rem] p-8 md:p-10 shadow-2xl flex flex-col h-full relative overflow-hidden group/card">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover/card:opacity-10 transition-opacity">
                <Quote className="h-20 w-20 rotate-180" />
              </div>

              <div className="flex-1 relative z-10">
                <p className="text-foreground/90 text-lg md:text-xl leading-relaxed font-medium italic text-center md:text-left">
                   &ldquo;{t.text}&rdquo;
                </p>
              </div>

              <div className="mt-10 pt-6 border-t border-border/40 relative z-10 flex flex-col items-center md:items-start">
                <p className="font-black text-xl tracking-tight text-foreground uppercase">{t.name}</p>
                {t.role && (
                  <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mt-1">
                    {t.role}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

        <div className="shrink-0 w-[5vw] md:w-[25vw]" />
      </div>

      {/* Navigation Arrows */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-2 md:px-8 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={prev}
          disabled={activeIndex === 0}
          className="pointer-events-auto h-12 w-12 rounded-full bg-background/80 backdrop-blur-md border border-border shadow-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all disabled:opacity-0"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={next}
          disabled={activeIndex === testimonials.length - 1}
          className="pointer-events-auto h-12 w-12 rounded-full bg-background/80 backdrop-blur-md border border-border shadow-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all disabled:opacity-0"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center gap-2 mt-4">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToIndex(i)}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              i === activeIndex ? "w-8 bg-primary" : "w-2 bg-primary/20 hover:bg-primary/40"
            )}
            aria-label={`Ir para depoimento ${i + 1}`}
          />
        ))}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
