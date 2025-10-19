// /components/SummaryCard.tsx

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SummaryCard({ data }) {
  // Now accepts a `data` prop
  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{data.title}</CardTitle>
        <CardDescription>High-Level Analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{data.text}</p>
      </CardContent>
    </Card>
  );
}
