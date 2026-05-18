import useEmblaCarousel from 'embla-carousel-react'
import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
interface Props { children: React.ReactNode[] }
export function CardCarousel({ children }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: true,
    slidesToScroll: 1,
    dragFree: false,
  })
  const [snaps,    setSnaps]    = useState<number[]>([])
  const [selected, setSelected] = useState(0)
  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelected(emblaApi.selectedScrollSnap())
  }, [emblaApi])
  useEffect(() => {
    if (!emblaApi) return
    setSnaps(emblaApi.scrollSnapList())
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    return () => { emblaApi.off('select', onSelect); emblaApi.off('reInit', onSelect) }
  }, [emblaApi, onSelect])
  return (
    <div className="relative h-full w-full">
      {/* viewport — negative margin offsets slide padding */}
      <div ref={emblaRef} className="overflow-hidden h-full" style={{ margin: '0 -6px' }}>
        <div className="flex h-full">
          {children.map((c, i) => (
            <div key={i} className="flex-shrink-0 h-full" style={{ flex: '0 0 33.333%', padding: '0 6px' }}>
              {c}
            </div>
          ))}
        </div>
      </div>

      {/* prev/next arrows */}
      <button onClick={() => emblaApi?.scrollPrev()}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[14px] z-10 h-[40px] w-[40px] rounded-full glass-panel flex items-center justify-center hover:border-primary/60 transition">
        <ChevronLeft className="h-4 w-4 text-primary" />
      </button>
      <button onClick={() => emblaApi?.scrollNext()}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[14px] z-10 h-[40px] w-[40px] rounded-full glass-panel flex items-center justify-center hover:border-primary/60 transition">
        <ChevronRight className="h-4 w-4 text-primary" />
      </button>

      {/* dots — absolutely positioned at bottom, inside carousel height */}
      <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-[6px] z-10">
        {snaps.map((_, i) => (
          <button key={i} onClick={() => emblaApi?.scrollTo(i)}
            className={`rounded-full transition-all border-none p-0 cursor-pointer ${i === selected
              ? 'w-[24px] h-[4px] bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-magenta)]'
              : 'w-[6px] h-[4px] bg-white/20 hover:bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  )
}
