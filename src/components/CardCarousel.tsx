import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CardCarouselProps {
  children: React.ReactNode[];
}

export function CardCarousel({ children }: CardCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
    slidesToScroll: 1,
    containScroll: "trimSnaps",
    dragFree: false,
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [snaps, setSnaps] = useState<number[]>([]);
  const [selected, setSelected] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setSnaps(emblaApi.scrollSnapList());
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div className="relative h-full flex flex-col min-h-0">
      <div ref={emblaRef} className="overflow-hidden flex-1 min-h-0 -mx-1">
        <div className="flex h-full touch-pan-y">
          {children.map((c, i) => (
            <div
              key={i}
              className="flex-[0_0_calc(33.333%-0.5rem)] min-w-0 px-1 h-full"
            >
              <div className="h-full">{c}</div>
            </div>
          ))}
        </div>
      </div>

      <button
        aria-label="Previous"
        disabled={!canPrev}
        onClick={() => emblaApi?.scrollPrev()}
        className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full glass-panel flex items-center justify-center hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition"
      >
        <ChevronLeft className="h-4 w-4 text-primary" />
      </button>
      <button
        aria-label="Next"
        disabled={!canNext}
        onClick={() => emblaApi?.scrollNext()}
        className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full glass-panel flex items-center justify-center hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition"
      >
        <ChevronRight className="h-4 w-4 text-primary" />
      </button>

      <div className="flex items-center justify-center gap-1.5 mt-2 shrink-0">
        {snaps.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1 rounded-full transition-all ${
              i === selected
                ? "w-6 bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-magenta)] shadow-[0_0_8px_oklch(0.82_0.16_210/0.6)]"
                : "w-1.5 bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}