"use client";
import CarModel from "./CarModel";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "./ui/carousel";

export default function CarCarousel({ items }) {
  const models = items && items.length > 0 ? items : [];

  return (
    <div className="relative w-full">
      <Carousel opts={{ loop: true }} className="w-full">
        <CarouselContent className="-ml-0">
          {models.map((m, i) => (
            <CarouselItem key={i} className="pl-0">
              <div className="flex flex-col items-center">
                <CarModel src={m.src} alt={m.name} stageHeightVh={68} />
                <div className="-mt-3 flex items-center gap-5">
                  <p className="text-base md:text-lg font-semibold tracking-wide text-neutral-900">
                    {m.name}
                  </p>
                  <a
                    href={m.href || "#"}
                    className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 transition-colors text-sm md:text-base"
                  >
                    Learn more
                    <span aria-hidden>→</span>
                  </a>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious className="bg-white/90 border border-neutral-200 text-neutral-900 shadow-lg hover:bg-white hover:shadow-xl" />
        <CarouselNext className="bg-white/90 border border-neutral-200 text-neutral-900 shadow-lg hover:bg-white hover:shadow-xl" />
      </Carousel>
    </div>
  );
}
