'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Package, Library, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectQuestionSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectSource: (source: "package" | "bank" | "new") => void;
}

const sources = [
  {
    id: "package" as const,
    icon: Package,
    title: "Dari Paket Soal",
    description: "Gunakan paket soal yang sudah tersedia untuk tugas baru",
    color: "bg-primary/10 text-primary",
  },
  {
    id: "bank" as const,
    icon: Library,
    title: "Pilih dari Bank Soal",
    description: "Pilih soal-soal individual dari bank soal untuk membuat tugas",
    color: "bg-secondary/10 text-secondary",
  },
  {
    id: "new" as const,
    icon: PlusCircle,
    title: "Buat Soal Baru",
    description: "Buat soal baru langsung dan assign ke siswa",
    color: "bg-accent/10 text-accent",
  },
];

export function SelectQuestionSourceDialog({
  open,
  onOpenChange,
  onSelectSource,
}: SelectQuestionSourceDialogProps) {
  const handleSelect = (source: "package" | "bank" | "new") => {
    onSelectSource(source);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Buat Tugas Baru</DialogTitle>
          <DialogDescription>
            Pilih sumber soal untuk tugas yang akan dibuat
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {sources.map((source) => (
            <Card
              key={source.id}
              className="p-4 cursor-pointer transition-all hover:border-primary hover:shadow-md group"
              onClick={() => handleSelect(source.id)}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                    source.color
                  )}
                >
                  <source.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {source.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {source.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
