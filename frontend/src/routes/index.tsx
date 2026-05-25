import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Brain, ChevronRight, LogOut } from "lucide-react";
import heroImg from "@/assets/study-hero.jpg";
import { AuthModal } from "@/components/auth-modal";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

function useCountUp(target: number, decimals = 0, duration = 1600) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf: number;
    let startTime: number | null = null;
    const tick = (ts: number) => {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(parseFloat((eased * target).toFixed(decimals)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return value;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StudyFlow — Plataforma moderna de estudos" },
      { name: "description", content: "Organize seus estudos, acompanhe progresso e mantenha o foco com Pomodoro, metas e flashcards." },
    ],
  }),
  component: Index,
});

function Index() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"login" | "register">("login");
  const [confirmLogout, setConfirmLogout] = useState(false);
  const countStudents = useCountUp(120);
  const countRating = useCountUp(4.9, 1);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (user) { navigate({ to: "/documents" }); }

  function openLogin() { setModalMode("login"); setModalOpen(true); }
  function openRegister() { setModalMode("register"); setModalOpen(true); }

  async function confirmAndLogout() {
    setConfirmLogout(false);
    await logout();
    toast.success("Até logo!");
  }

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">StudyFlow</span>
          </button>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground" />
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden md:block">
                Olá, <span className="text-foreground font-semibold">{user.name.split(" ")[0]}</span>
              </span>
              <button
                onClick={() => setConfirmLogout(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full glass text-sm font-medium hover:bg-card transition-smooth"
              >
                <LogOut className="w-3.5 h-3.5" /> Sair
              </button>
            </div>
          ) : (
            <button
              onClick={openLogin}
              className="px-5 py-2 rounded-full bg-gradient-primary text-primary-foreground font-medium text-sm shadow-glow hover:scale-105 transition-smooth"
            >
              Entrar
            </button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-32 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm">
              <span className="text-muted-foreground">Resumos com</span>
              <span className="font-bold text-accent">IA</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.05]">
              Estude com <span className="text-gradient">foco</span>,
              <br /> conquiste mais.
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg">
              A plataforma que une Pomodoro, metas, flashcards e analytics em um único lugar — feita para quem leva os estudos a sério.
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={openRegister} className="px-7 py-3.5 rounded-full bg-gradient-primary text-primary-foreground font-semibold shadow-glow hover:scale-105 transition-smooth flex items-center gap-2">
                Começar agora <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-8 pt-4">
              <StatCounter value={countStudents} label="Estudantes" format={(v) => `${v}K+`} />
              <StatCounter value={countRating}   label="Avaliação"  format={(v) => `${v.toFixed(1)}★`} />
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-primary blur-3xl opacity-30 animate-pulse-glow" />
            <img
              src={heroImg}
              alt="Ilustração de estudos"
              width={1536}
              height={1024}
              className="relative rounded-3xl shadow-glow animate-float"
            />
          </div>
        </div>
      </header>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="relative glass rounded-3xl p-12 md:p-16 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-primary opacity-20" />
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-secondary rounded-full blur-3xl opacity-30 animate-pulse-glow" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-primary rounded-full blur-3xl opacity-30 animate-pulse-glow" />
          <div className="relative">
            <h2 className="text-4xl md:text-6xl font-bold mb-5">
              Pronto para <span className="text-gradient">transformar</span> seus estudos?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              Junte-se a milhares de estudantes que já elevaram seu desempenho com o StudyFlow.
            </p>
            <button onClick={openRegister} className="px-8 py-4 rounded-full bg-gradient-primary text-primary-foreground font-semibold shadow-glow hover:scale-105 transition-smooth">
              Criar conta grátis
            </button>
          </div>
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-6 py-10 border-t border-border text-center text-sm text-muted-foreground">
        © 2026 StudyFlow — Andre De Bem
      </footer>

      <AuthModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialMode={modalMode}
        onSuccess={() => navigate({ to: "/documents" })}
      />
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

function StatCounter({ value, label, format }: { value: number; label: string; format: (v: number) => string }) {
  return (
    <div>
      <div className="text-2xl font-bold text-gradient">{format(value)}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  );
}
