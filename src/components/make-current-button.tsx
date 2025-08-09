"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function MakeCurrentButton({
    courseId,
    courseVersionId,
}: {
    courseId: string;
    courseVersionId: string;
}) {
    const router = useRouter();

    const onClick = async () => {
        try {
            const res = await fetch(`/api/courses/${courseId}/set-current-version`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ courseVersionId }),
            });
            if (!res.ok) throw new Error("Failed to set current version");
            toast.success("Set as current version");
            router.refresh(); // refresh server component data
        } catch (e) {
            toast.error("Error", { description: (e as Error).message });
        }
    };

    return (
        <button type="button" onClick={onClick} className="text-xs underline">
            Make current
        </button>
    );
}
