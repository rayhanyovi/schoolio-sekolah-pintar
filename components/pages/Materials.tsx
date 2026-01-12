'use client';

import { useState } from "react";
import { ROLES } from "@/lib/constants";
import { useRoleContext } from "@/hooks/useRoleContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { 
  BookOpen, 
  Plus, 
  Search, 
  FileText, 
  Download, 
  Eye, 
  Pencil, 
  Trash2, 
  Calendar,
  Clock,
  Upload,
  File,
  X,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// Demo data
const demoSchedules = [
  { id: "1", className: "X-A", subject: "Matematika" },
  { id: "2", className: "X-B", subject: "Matematika" },
  { id: "3", className: "XI-A", subject: "Fisika" },
];

const demoSubjects = [
  { id: "1", name: "Matematika", teacher: "Pak Budi" },
  { id: "2", name: "Fisika", teacher: "Bu Sari" },
  { id: "3", name: "Bahasa Indonesia", teacher: "Pak Ahmad" },
];

const demoMaterials = [
  {
    id: "1",
    title: "Pengenalan Aljabar Linear",
    description: "Materi dasar tentang aljabar linear meliputi vektor, matriks, dan operasi dasar. Cocok untuk pemula yang ingin memahami konsep dasar matematika tingkat lanjut.",
    subject: "Matematika",
    className: "X-A",
    teacher: "Pak Budi",
    createdAt: new Date(2025, 0, 2),
    attachments: [
      { name: "aljabar-linear.pdf", size: "2.4 MB", type: "pdf" },
      { name: "latihan-soal.pdf", size: "1.1 MB", type: "pdf" },
    ],
  },
  {
    id: "2",
    title: "Hukum Newton tentang Gerak",
    description: "Pembahasan lengkap tentang tiga hukum Newton beserta contoh penerapannya dalam kehidupan sehari-hari.",
    subject: "Fisika",
    className: "XI-A",
    teacher: "Bu Sari",
    createdAt: new Date(2025, 0, 5),
    attachments: [
      { name: "hukum-newton.pptx", size: "5.2 MB", type: "pptx" },
    ],
  },
  {
    id: "3",
    title: "Trigonometri Dasar",
    description: "Konsep dasar trigonometri: sin, cos, tan, dan aplikasinya dalam menyelesaikan masalah geometri.",
    subject: "Matematika",
    className: "X-A",
    teacher: "Pak Budi",
    createdAt: new Date(2025, 0, 8),
    attachments: [
      { name: "trigonometri.pdf", size: "3.0 MB", type: "pdf" },
      { name: "video-penjelasan.mp4", size: "45 MB", type: "video" },
    ],
  },
];

const demoChildren = [
  { id: "1", name: "Anak 1 - Ahmad", class: "X-A" },
  { id: "2", name: "Anak 2 - Budi", class: "XI-B" },
];

const fileTypeIcons: Record<string, string> = {
  pdf: "📄",
  pptx: "📊",
  docx: "📝",
  video: "🎥",
  default: "📎",
};

export default function Materials() {
  const { role } = useRoleContext();
  
  if (role === ROLES.TEACHER || role === ROLES.ADMIN) {
    return <TeacherMaterialsView />;
  }
  
  if (role === ROLES.PARENT) {
    return <ParentMaterialsView />;
  }
  
  return <StudentMaterialsView />;
}

function TeacherMaterialsView() {
  const [selectedSchedule, setSelectedSchedule] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<typeof demoMaterials[0] | null>(null);
  const [detailMaterial, setDetailMaterial] = useState<typeof demoMaterials[0] | null>(null);

  const filteredMaterials = selectedSchedule 
    ? demoMaterials.filter(m => {
        const schedule = demoSchedules.find(s => s.id === selectedSchedule);
        return schedule && m.className === schedule.className && m.subject === schedule.subject;
      })
    : demoMaterials;

  const handleEdit = (material: typeof demoMaterials[0]) => {
    setEditingMaterial(material);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMaterial(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Materi Pembelajaran</h1>
          <p className="text-muted-foreground">Kelola materi untuk kelas Anda</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingMaterial(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Materi
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingMaterial ? "Edit Materi" : "Tambah Materi Baru"}</DialogTitle>
              <DialogDescription>
                {editingMaterial ? "Ubah informasi materi pembelajaran" : "Isi informasi untuk materi baru"}
              </DialogDescription>
            </DialogHeader>
            <MaterialForm material={editingMaterial} onClose={handleCloseDialog} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedSchedule} onValueChange={setSelectedSchedule}>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Filter berdasarkan jadwal..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jadwal</SelectItem>
                {demoSchedules.map((schedule) => (
                  <SelectItem key={schedule.id} value={schedule.id}>
                    {schedule.className} - {schedule.subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari materi..." className="pl-10" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Materials Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMaterials.map((material) => (
          <MaterialCard
            key={material.id}
            material={material}
            onView={() => setDetailMaterial(material)}
            onEdit={() => handleEdit(material)}
            onDelete={() => {}}
            showActions
          />
        ))}
      </div>

      {filteredMaterials.length === 0 && (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Belum ada materi</p>
            <p className="text-sm">Tambahkan materi pertama untuk kelas ini</p>
          </div>
        </Card>
      )}

      {/* Detail Sheet */}
      <Sheet open={!!detailMaterial} onOpenChange={() => setDetailMaterial(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {detailMaterial && (
            <>
              <SheetHeader>
                <SheetTitle>{detailMaterial.title}</SheetTitle>
                <SheetDescription>
                  {detailMaterial.className} • {detailMaterial.subject}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Deskripsi</h4>
                  <p className="text-sm">{detailMaterial.description}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Tanggal Upload</h4>
                  <p className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(detailMaterial.createdAt, "EEEE, d MMMM yyyy", { locale: id })}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Lampiran</h4>
                  <div className="space-y-2">
                    {detailMaterial.attachments.map((file, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{fileTypeIcons[file.type] || fileTypeIcons.default}</span>
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{file.size}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function StudentMaterialsView() {
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailMaterial, setDetailMaterial] = useState<typeof demoMaterials[0] | null>(null);

  const filteredMaterials = demoMaterials.filter(m => {
    const matchSubject = !selectedSubject || selectedSubject === "all" || m.subject === demoSubjects.find(s => s.id === selectedSubject)?.name;
    const matchSearch = !searchQuery || m.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSubject && matchSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Materi Pembelajaran</h1>
        <p className="text-muted-foreground">Akses materi dari semua mata pelajaran</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Materi</p>
                <p className="text-xl font-bold">{demoMaterials.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Mata Pelajaran</p>
                <p className="text-xl font-bold">{demoSubjects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Download className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sudah Dibaca</p>
                <p className="text-xl font-bold">8</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Materi Baru</p>
                <p className="text-xl font-bold">2</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder="Pilih mata pelajaran..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Mata Pelajaran</SelectItem>
                {demoSubjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cari materi..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Materials Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMaterials.map((material) => (
          <MaterialCard
            key={material.id}
            material={material}
            onView={() => setDetailMaterial(material)}
          />
        ))}
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!detailMaterial} onOpenChange={() => setDetailMaterial(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {detailMaterial && (
            <>
              <SheetHeader>
                <SheetTitle>{detailMaterial.title}</SheetTitle>
                <SheetDescription>
                  {detailMaterial.subject} • {detailMaterial.teacher}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Deskripsi</h4>
                  <p className="text-sm">{detailMaterial.description}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Tanggal Upload</h4>
                  <p className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(detailMaterial.createdAt, "EEEE, d MMMM yyyy", { locale: id })}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Lampiran ({detailMaterial.attachments.length})</h4>
                  <div className="space-y-2">
                    {detailMaterial.attachments.map((file, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{fileTypeIcons[file.type] || fileTypeIcons.default}</span>
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{file.size}</p>
                          </div>
                        </div>
                        <Button size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Unduh
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ParentMaterialsView() {
  const [selectedChild, setSelectedChild] = useState<string>(demoChildren[0]?.id || "");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Materi Pembelajaran Anak</h1>
          <p className="text-muted-foreground">Lihat materi yang diberikan kepada anak Anda</p>
        </div>
        <Select value={selectedChild} onValueChange={setSelectedChild}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Pilih anak..." />
          </SelectTrigger>
          <SelectContent>
            {demoChildren.map((child) => (
              <SelectItem key={child.id} value={child.id}>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {child.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Materials List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {demoMaterials.map((material) => (
          <MaterialCard key={material.id} material={material} onView={() => {}} />
        ))}
      </div>
    </div>
  );
}

// Shared Components
interface MaterialCardProps {
  material: typeof demoMaterials[0];
  onView: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

function MaterialCard({ material, onView, onEdit, onDelete, showActions }: MaterialCardProps) {
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="secondary" className="text-xs">
            {material.subject}
          </Badge>
          {showActions && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
        <CardTitle className="text-base line-clamp-2">{material.title}</CardTitle>
        <CardDescription className="line-clamp-2">{material.description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(material.createdAt, "d MMM yyyy", { locale: id })}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {material.attachments.length} file
          </span>
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={onView}>
          <Eye className="h-4 w-4 mr-2" />
          Lihat Detail
        </Button>
      </CardContent>
    </Card>
  );
}

interface MaterialFormProps {
  material?: typeof demoMaterials[0] | null;
  onClose: () => void;
}

function MaterialForm({ material, onClose }: MaterialFormProps) {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="schedule">Jadwal</Label>
        <Select defaultValue={material ? "1" : undefined}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih jadwal..." />
          </SelectTrigger>
          <SelectContent>
            {demoSchedules.map((schedule) => (
              <SelectItem key={schedule.id} value={schedule.id}>
                {schedule.className} - {schedule.subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Judul Materi</Label>
        <Input 
          id="title" 
          placeholder="Masukkan judul materi..."
          defaultValue={material?.title}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea 
          id="description" 
          placeholder="Jelaskan isi materi..."
          rows={4}
          defaultValue={material?.description}
        />
      </div>

      <div className="space-y-2">
        <Label>Lampiran</Label>
        <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-2">
            Drag & drop file atau klik untuk upload
          </p>
          <Input
            type="file"
            multiple
            className="hidden"
            id="file-upload"
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
          />
          <Button variant="outline" size="sm" asChild>
            <label htmlFor="file-upload" className="cursor-pointer">
              Pilih File
            </label>
          </Button>
        </div>
        {files.length > 0 && (
          <div className="space-y-2 mt-3">
            {files.map((file, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50">
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4" />
                  <span className="text-sm">{file.name}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Batal</Button>
        <Button onClick={onClose}>
          {material ? "Simpan Perubahan" : "Tambah Materi"}
        </Button>
      </DialogFooter>
    </div>
  );
}
