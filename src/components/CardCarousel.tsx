import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/* ============================================================
   Component-scoped styles (kept inside this file by request)
   ============================================================ */
const ccStyles = `
.cc-root { position: relative; height: 100%; display: flex; flex-direction: column; min-height: 0; }
.cc-viewport { overflow: hidden; flex: 1; min-height: 0; margin-left: -4px; margin-right: -4px; }
.cc-track { display: flex; height: 100%; touch-action: pan-y; }
.cc-slide { flex: 0 0 calc(33.333% - 8px); min-width: 0; padding: 0 4px; height: 100%; }
.cc-slide-inner { height: 100%; }

.cc-nav {
  position: absolute; top: 50%; transform: translateY(-50%);
  z-index: 10; height: 40px; width: 40px; border-radius: 999px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  background: linear-gradient(160deg, oklch(0.22 0.06 260 / 0.9), oklch(0.16 0.05 260 / 0.6));
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  border: 1px solid var(--border);
  box-shadow: 0 20px 60px -20px oklch(0.05 0.05 260 / 0.8);
  transition: all 0.3s ease;
}
.cc-nav:hover:not(:disabled) { border-color: var(--primary); box-shadow: 0 0 20px oklch(0.82 0.16 210 / 0.4); }
.cc-nav:disabled { opacity: 0.3; cursor: not-allowed; }
.cc-nav.prev { left: -8px; }
.cc-nav.next { right: -8px; }
.cc-nav svg { height: 16px; width: 16px; color: var(--primary); }

.cc-dots { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 8px; flex-shrink: 0; }
.cc-dot {
  height: 4px; width: 6px; border-radius: 999px;
  background: oklch(1 0 0 / 0.2); cursor: pointer;
  border: none; padding: 0; transition: all 0.3s ease;
}
.cc-dot:hover { background: oklch(1 0 0 / 0.4); }
.cc-dot.active {
  width: 24px;
  background: linear-gradient(90deg, var(--neon-cyan), var(--neon-magenta));
  box-shadow: 0 0 8px oklch(0.82 0.16 210 / 0.6);
}
`;

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
    <>
      <style>{ccStyles}</style>
      <div className="cc-root">
        <div ref={emblaRef} className="cc-viewport">
          <div className="cc-track">
            {children.map((c, i) => (
              <div key={i} className="cc-slide">
                <div className="cc-slide-inner">{c}</div>
              </div>
            ))}
          </div>
        </div>

        <button
          aria-label="Previous"
          disabled={!canPrev}
          onClick={() => emblaApi?.scrollPrev()}
          className="cc-nav prev"
        >
          <ChevronLeft />
        </button>
        <button
          aria-label="Next"
          disabled={!canNext}
          onClick={() => emblaApi?.scrollNext()}
          className="cc-nav next"
        >
          <ChevronRight />
        </button>

        <div className="cc-dots">
          {snaps.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`cc-dot ${i === selected ? "active" : ""}`}
            />
          ))}
        </div>
      </div>
    </>
  );
}
