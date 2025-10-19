'use client'
// /components/InfoCard.tsx

import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function InfoCard({ data }) {
    // Now accepts a `data` prop
    if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{data.title}</CardTitle>
        <CardDescription>Model Recommendation</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
          <Image
            src={""}
            alt={data.alt}
            fill
            className="object-cover"
            // Add a fallback for broken images
            onError={(e) => { e.currentTarget.src = ''; }}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {data.description}
        </p>
      </CardContent>
    </Card>
  );
}
