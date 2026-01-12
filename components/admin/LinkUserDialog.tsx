'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Link2, Users } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface LinkUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceUser: User | null;
  availableUsers: User[];
  linkedUserIds: string[];
  onLink: (sourceUserId: string, targetUserIds: string[]) => void;
  mode: "parent-to-student" | "student-to-parent";
}

export function LinkUserDialog({
  open,
  onOpenChange,
  sourceUser,
  availableUsers,
  linkedUserIds,
  onLink,
  mode,
}: LinkUserDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>(linkedUserIds);

  const filteredUsers = availableUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggle = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = () => {
    if (sourceUser) {
      onLink(sourceUser.id, selectedIds);
      onOpenChange(false);
    }
  };

  const title =
    mode === "parent-to-student"
      ? "Hubungkan ke Anak"
      : "Hubungkan ke Orang Tua";
  const description =
    mode === "parent-to-student"
      ? `Pilih siswa yang merupakan anak dari ${sourceUser?.name || "pengguna ini"}`
      : `Pilih orang tua dari ${sourceUser?.name || "siswa ini"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Source User Info */}
          {sourceUser && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage src={sourceUser.avatar} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {sourceUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{sourceUser.name}</p>
                <p className="text-sm text-muted-foreground">{sourceUser.email}</p>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari pengguna..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* User List */}
          <ScrollArea className="h-[250px] border rounded-lg">
            {filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
                <Users className="h-10 w-10 mb-2 opacity-50" />
                <p>Tidak ada pengguna ditemukan</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted ${
                      selectedIds.includes(user.id) ? "bg-primary/5 border border-primary/20" : ""
                    }`}
                    onClick={() => handleToggle(user.id)}
                  >
                    <Checkbox
                      checked={selectedIds.includes(user.id)}
                      onCheckedChange={() => handleToggle(user.id)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {selectedIds.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {selectedIds.length} pengguna dipilih
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} className="gradient-primary text-primary-foreground">
            Simpan Hubungan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
