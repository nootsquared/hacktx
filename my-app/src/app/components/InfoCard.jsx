// /components/InfoCard.tsx

import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function InfoCard() {
  // --- Placeholder Data ---
  // Your ML model will determine which image and text to show.
  // You can replace this object with props or fetched data.
  const imageData = {
    src: "/placeholder-car.jpg", // Make sure to add an image to your /public folder
    alt: "A modern electric car",
    title: "Predicted Best Match",
    description: "Based on current market trends, the model suggests this vehicle profile as the optimal choice.",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{imageData.title}</CardTitle>
        <CardDescription>Model Recommendation</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
          <Image
            src={imageData.src}
            alt={imageData.alt}
            fill
            className="object-cover"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {imageData.description}
        </p>
      </CardContent>
    </Card>
  );
}