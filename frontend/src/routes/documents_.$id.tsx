import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  Brain, ArrowLeft, Loader2, AlertCircle, CheckCircle, FileText,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface Doc {
  id: number;
  title: string;
  original_filename: string;
  file_type: "pdf" | "txt" | "docx";
  file_size: number;
  status: "pending" | "processing" | "completed" | "failed";
  summary: string | null;
  error_message: string | null;
  created_at: string;
}

export const Route = createFileRoute("/documents_/$id")({
  beforeLoad: () => {
    if (!localStorage.getItem("token")) throw redirect({ to: "/" });
  },
  component: DocumentDetailPage,
});

function DocumentDetailPage() {
  const { id } = Route.useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<Doc | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const blobRef = useRef<string | null>(null);

  useEffect(() => {
    api.get<Doc>(`/documents/${id}`)
      .then((r) => setDoc(r.data))
      .catch(() => { toast.error("Documento não encontrado."); navigate({ to: "/documents" }); })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!doc) return;
    if (doc.file_type === "docx") return;

    setPreviewLoading(true);
    api.get(`/documents/${id}/preview`, { responseType: "arraybuffer" })
      .then((r) => {
        const mime = doc.file_type === "pdf" ? "application/pdf" : "text/plain";
        const blob = new Blob([r.data], { type: mime });

        if (doc.file_type === "txt") {
          blob.text().then((t) => { setTextContent(t); setPreviewLoading(false); });
        } else {
          const url = URL.createObjectURL(blob);
          blobRef.current = url;
          setPreviewUrl(url);
          setPreviewLoading(false);
        }
      })
      .catch(() => { toast.error("Erro ao carregar preview."); setPreviewLoading(false); });

    return () => {
      if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    };
  }, [doc]);

  async function confirmAndLogout() {
    setConfirmLogout(false);
    await logout();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="sticky top-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/documents"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-card/80 transition-smooth"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:block">Voltar</span>
            </Link>
            <div className="w-px h-5 bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <Brain className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold tracking-tight">StudyFlow</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.name}</span>
            <button
              onClick={() => setConfirmLogout(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full glass text-sm font-medium hover:bg-card transition-smooth"
            >
              Sair
            </button>
          </div>
        </div>
      </nav>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <Loader2 className="w-7 h-7 animate-spin mr-2" /> Carregando...
        </div>
      ) : doc ? (
        <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10 flex flex-col gap-6">
          {/* Title row */}
          <div>
            <h1 className="text-3xl font-bold truncate">{doc.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{doc.original_filename} · {formatSize(doc.file_size)}</p>
          </div>

          {/* Two-column layout */}
          <div className="flex-1 grid lg:grid-cols-2 gap-6 min-h-0">
            {/* Preview panel */}
            <div className="glass rounded-2xl overflow-hidden flex flex-col min-h-[500px]">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Preview</span>
              </div>

              <div className="flex-1 relative">
                {doc.file_type === "docx" ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 text-muted-foreground">
                    <AlertCircle className="w-10 h-10 mb-3 opacity-40" />
                    <p className="font-medium">Preview indisponível para DOCX</p>
                    <p className="text-sm mt-1 opacity-70">O resumo gerado está disponível ao lado.</p>
                  </div>
                ) : previewLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : doc.file_type === "pdf" && previewUrl ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-full border-0"
                    title={doc.title}
                  />
                ) : doc.file_type === "txt" && textContent !== null ? (
                  <div className="absolute inset-0 overflow-auto p-5">
                    <pre className="text-sm text-foreground/90 whitespace-pre-wrap font-mono leading-relaxed">
                      {textContent}
                    </pre>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Summary panel */}
            <div className="glass rounded-2xl overflow-hidden flex flex-col min-h-[500px]">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <Brain className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Resumo IA</span>
              </div>

              <div className="flex-1 relative overflow-auto p-5">
                {doc.status === "completed" && doc.summary ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-secondary font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" /> Resumo gerado com sucesso
                    </div>
                    <div className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                      {doc.summary}
                    </div>
                  </div>
                ) : doc.status === "failed" ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 text-destructive/70">
                    <AlertCircle className="w-10 h-10 mb-3 opacity-40" />
                    <p className="font-medium">Falha no processamento</p>
                    {doc.error_message && (
                      <p className="text-sm mt-1 opacity-80">{doc.error_message}</p>
                    )}
                  </div>
                ) : doc.status === "processing" ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 text-muted-foreground">
                    <Loader2 className="w-10 h-10 mb-3 animate-spin opacity-40" />
                    <p className="font-medium">Processando...</p>
                    <p className="text-sm mt-1 opacity-70">O agente está analisando o documento.</p>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 text-muted-foreground">
                    <Loader2 className="w-10 h-10 mb-3 opacity-20" />
                    <p className="font-medium">Aguardando processamento</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      ) : null}

      <ConfirmDialog
        isOpen={confirmLogout}
        title="Sair da conta?"
        description="Você será desconectado e precisará entrar novamente para acessar seus documentos."
        confirmLabel="Sair"
        onConfirm={confirmAndLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
