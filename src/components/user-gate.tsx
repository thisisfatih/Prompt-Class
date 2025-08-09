"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function UserGate() {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");

    useEffect(() => {
        const raw = localStorage.getItem("pc_user");
        if (!raw) setOpen(true);
    }, []);

    const save = async () => {
        const trimmed = name.trim();
        if (!trimmed) return toast.error("Please enter a name");
        try {
            const res = await fetch("/api/users/ensure", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: trimmed }),
            });
            if (!res.ok) throw new Error("Failed to save user");
            const json = await res.json();
            localStorage.setItem("pc_user", JSON.stringify(json));
            setOpen(false);
            toast.success(`Welcome, ${json.name}!`);
        } catch (e) {
            toast.error("Error", { description: (e as Error).message });
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent side="bottom" className="max-w-md mx-auto">
                <SheetHeader>
                    <SheetTitle>Welcome! 👋</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-3">
                    <div className="space-y-2">
                        <Label htmlFor="userName">Your name</Label>
                        <Input id="userName" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" />
                    </div>
                    <Button onClick={save} className="w-full h-12 rounded-2xl">Continue</Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
