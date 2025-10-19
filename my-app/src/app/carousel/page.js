"use client"

import {
  Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext
} from "../components/ui/carousel"
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
} from "../components/ui/card"

export default function Page() {
  const items = [1,2,3,4,5]

  return (
    <main className="p-6">
      <div className="max-w-xl">
        <Carousel opts={{ align: "start", loop: true }}>
          <CarouselContent className="-ml-4">
            {items.map(n => (
              <CarouselItem key={n} className="pl-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Card {n}</CardTitle>
                    <CardDescription>Tailwind + JS</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video grid place-items-center rounded-xl border">
                      Slide {n}
                    </div>
                  </CardContent>
                  <CardFooter>Footer</CardFooter>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>

          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </main>
  )
}
