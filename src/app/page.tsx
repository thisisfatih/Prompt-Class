import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, PlusCircle, Bot, Play } from "lucide-react";

export default function HomePage() {
  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">prompt-class</h1>
      <Card className="glass rounded-2xl shadow-card">
        <CardContent className="p-5 space-y-4">
          <p className="text-sm text-gray-600">
            Build, practice, and publish mobile-first courses.
          </p>
          <div className="grid grid-cols-1 gap-3">
            <Button asChild size="lg" className="h-12 rounded-2xl">
              <Link href="/courses"><BookOpen className="mr-2 h-4 w-4" /> Courses</Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="h-12 rounded-2xl">
              <Link href="/generate"><PlusCircle className="mr-2 h-4 w-4" /> Generate a new course</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 rounded-2xl">
              <Link href="/generate-ai"><Bot className="mr-2 h-4 w-4" /> Generate course with AI</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-soft hover:shadow-card">
              <Link href="/practice"><Play className="mr-2 h-4 w-4" /> Take a course</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
