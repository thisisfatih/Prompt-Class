"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const schema = z.object({
    topic: z.string().min(3, "Topic is too short"),
    count: z.coerce.number().int().min(1).max(50),
    courseName: z.string().optional(),        // allow override; else we derive from topic
    courseCreator: z.string().optional(),     // allow override; else "AI"
});
type Form = z.infer<typeof schema>;

export default function GenerateAIPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<Form>({
        resolver: zodResolver(schema),
        defaultValues: { count: 5 },
    });

    const onSubmit = async (data: Form) => {
        setLoading(true);
        try {
            const res = await fetch("/api/courses/generate-ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("AI generation failed");
            const json = await res.json() as { courseId: string; newVersionNumber: number };
            toast.success("Course generated!");
            router.push(`/courses/${json.courseId}?v=${json.newVersionNumber}`);
        } catch (e) {
            toast.error("Error", { description: (e as Error).message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="space-y-4">
            <h1 className="text-xl font-semibold">Generate course with AI</h1>
            <Card className="rounded-2xl">
                <CardContent className="p-4 space-y-3">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                        <div className="space-y-2">
                            <Label htmlFor="topic">Topic</Label>
                            <Input id="topic" placeholder="e.g., PostgreSQL basics" {...register("topic")} />
                            {errors.topic && <p className="text-xs text-red-600">{errors.topic.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="count">How many questions?</Label>
                            <Input id="count" type="number" min={1} max={50} {...register("count")} />
                            {errors.count && <p className="text-xs text-red-600">{errors.count.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="courseName">Course name (optional)</Label>
                            <Input id="courseName" placeholder="Intro to PostgreSQL" {...register("courseName")} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="courseCreator">Creator (optional)</Label>
                            <Input id="courseCreator" placeholder="Your name or 'AI'" {...register("courseCreator")} />
                        </div>
                        <Button type="submit" className="w-full h-12 rounded-2xl" disabled={loading}>
                            {loading ? "Generating…" : "Generate"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}
