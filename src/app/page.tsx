import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">Prompt Class</h1>
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <Button asChild size="lg" className="h-12 rounded-2xl">
              <Link href="/courses">Courses</Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              size="lg"
              className="h-12 rounded-2xl"
            >
              <Link href="/generate">Generate a new course</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
