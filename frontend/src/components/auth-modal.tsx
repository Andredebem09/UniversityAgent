import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Eye, EyeOff, Brain, Loader2, ArrowRight, UserPlus, LogIn, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { isAxiosError } from "axios";

type Mode = "login" | "register";
type Phase = "shown" | "exiting" | "entering-start" | "entering";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: Mode;
}

export function AuthModal({ isOpen, onClose, initialMode = "login" }: Props) {
  const [view, setView] = useState<Mode>(initialMode);
  const [phase, setPhase] = useState<Phase>("shown");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const nextViewRef = useRef<Mode>(initialMode);
  const firstRef = useRef<HTMLInputElement>(null);

  const [lEmail, setLEmail] = useState("");
  const [lPass, setLPass] = useState("");
  const [rName, setRName] = useState("");
  const [rEmail, setREmail] = useState("");
  const [rPass, setRPass] = useState("");
  const [rPassConf, setRPassConf] = useState("");

  // sync when modal opens with a different initialMode
  useEffect(() => {
    if (isOpen) {
      setView(initialMode);
      nextViewRef.current = initialMode;
      setPhase("shown");
      setShowPass(false);
      setTimeout(() => firstRef.current?.focus(), 320);
    }
  }, [isOpen, initialMode]);

  // close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [isOpen, onClose]);

  // transition state machine
  useEffect(() => {
    if (phase === "exiting") {
      const t = setTimeout(() => {
        setView(nextViewRef.current);
        setShowPass(false);
        setPhase("entering-start");
      }, 210);
      return () => clearTimeout(t);
    }
    if (phase === "entering-start") {
      const id = requestAnimationFrame(() =>
        requestAnimationFrame(() => setPhase("entering"))
      );
      return () => cancelAnimationFrame(id);
    }
    if (phase === "entering") {
      const t = setTimeout(() => {
        setPhase("shown");
        setTimeout(() => firstRef.current?.focus(), 50);
      }, 210);
      return () => clearTimeout(t);
    }
  }, [phase]);

  function switchMode(next: Mode) {
    if (next === view || phase !== "shown") return;
    nextViewRef.current = next;
    setPhase("exiting");
  }

  // direction: login→register is "forward", register→login is "backward"
  const goingForward = nextViewRef.current === "register";

  const contentStyle: React.CSSProperties = (() => {
    if (phase === "exiting") return {
      opacity: 0,
      transform: goingForward ? "translateX(-28px) scale(0.96)" : "translateX(28px) scale(0.96)",
      transition: "opacity 0.21s ease, transform 0.21s ease",
    };
    if (phase === "entering-start") return {
      opacity: 0,
      transform: goingForward ? "translateX(28px) scale(0.96)" : "translateX(-28px) scale(0.96)",
      transition: "none",
    };
    if (phase === "entering") return {
      opacity: 1,
      transform: "translateX(0) scale(1)",
      transition: "opacity 0.21s ease, transform 0.21s ease",
    };
    return { opacity: 1, transform: "translateX(0) scale(1)", transition: "none" };
  })();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(lEmail, lPass);
      toast.success("Bem-vindo de volta!");
      onClose();
    } catch (err) {
      toast.error(
        isAxiosError(err) ? (err.response?.data?.message ?? "Credenciais inválidas.") : "Algo deu errado.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (rPass !== rPassConf) { toast.error("As senhas não coincidem."); return; }
    setLoading(true);
    try {
      await register(rName, rEmail, rPass, rPassConf);
      toast.success("Conta criada! Bem-vindo ao StudyFlow.");
      onClose();
    } catch (err) {
      if (isAxiosError(err)) {
        const d = err.response?.data;
        const firstErr = d?.errors
          ? (Object.values(d.errors as Record<string, string[]>)[0] as string[])[0]
          : (d?.message ?? "Algo deu errado.");
        toast.error(firstErr);
      } else {
        toast.error("Algo deu errado.");
      }
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full px-4 py-3 rounded-xl border border-border bg-background/50 text-sm text-foreground " +
    "placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 " +
    "focus:border-primary/60 transition-colors duration-150";

  const labelCls = "block mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70";

  const modal = (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 40,
          background: "oklch(0.1 0.02 270 / 0.85)",
          backdropFilter: "blur(8px)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.28s ease",
        }}
      />

      {/* Centering shell */}
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "1rem",
          pointerEvents: isOpen ? "auto" : "none",
        }}
      >
        {/* Outer card — handles open/close animation */}
        <div
          style={{
            position: "relative",
            width: "100%", maxWidth: 420,
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? "translateY(0) scale(1)" : "translateY(24px) scale(0.94)",
            transition: "opacity 0.32s ease, transform 0.32s cubic-bezier(0.34,1.4,0.64,1)",
          }}
        >
          {/* Inner content — handles view-switch animation */}
          <div style={contentStyle}>

            {/* ── LOGIN CARD ── */}
            {view === "login" && (
              <div className="glass rounded-3xl shadow-glow overflow-hidden">
                {/* Decorative gradient */}
                <div
                  style={{
                    position: "absolute", top: -64, right: -64,
                    width: 200, height: 200,
                    background: "var(--gradient-primary)",
                    borderRadius: "50%", filter: "blur(48px)", opacity: 0.18,
                    pointerEvents: "none",
                  }}
                />

                <div style={{ position: "relative", padding: "2rem" }}>
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                        <LogIn className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <div>
                        <div className="text-base font-bold tracking-tight">Bem-vindo de volta</div>
                        <div className="text-xs text-muted-foreground">Entre na sua conta</div>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-card/80 transition-colors duration-150"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className={labelCls}>E-mail</label>
                      <input
                        ref={firstRef}
                        type="email"
                        autoComplete="email"
                        required
                        value={lEmail}
                        onChange={(e) => setLEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className={labelCls}>Senha</label>
                      <div className="relative">
                        <input
                          type={showPass ? "text" : "password"}
                          autoComplete="current-password"
                          required
                          value={lPass}
                          onChange={(e) => setLPass(e.target.value)}
                          placeholder="••••••••"
                          className={inputCls + " pr-11"}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowPass((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold text-sm shadow-glow flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none"
                      style={{ marginTop: "0.5rem" }}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                      Entrar
                    </button>
                  </form>

                  {/* Switch link */}
                  <div
                    style={{
                      marginTop: "1.25rem",
                      padding: "1rem",
                      borderRadius: "1rem",
                      background: "oklch(0.21 0.04 270 / 0.4)",
                      border: "1px solid oklch(1 0 0 / 0.06)",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div className="text-xs font-semibold text-foreground/80">Não tem conta?</div>
                      <div className="text-xs text-muted-foreground">Cadastre-se e comece grátis</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => switchMode("register")}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-primary hover:bg-primary/10 transition-colors duration-150"
                    >
                      Cadastrar <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── REGISTER CARD ── */}
            {view === "register" && (
              <div className="glass rounded-3xl shadow-glow overflow-hidden">
                {/* Decorative gradient */}
                <div
                  style={{
                    position: "absolute", top: -64, left: -64,
                    width: 200, height: 200,
                    background: "var(--gradient-accent)",
                    borderRadius: "50%", filter: "blur(48px)", opacity: 0.18,
                    pointerEvents: "none",
                  }}
                />

                <div style={{ position: "relative", padding: "2rem" }}>
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      <div className="w-9 h-9 rounded-xl bg-gradient-accent flex items-center justify-center shadow-glow">
                        <UserPlus className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <div>
                        <div className="text-base font-bold tracking-tight">Criar conta</div>
                        <div className="text-xs text-muted-foreground">É grátis, sempre</div>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-card/80 transition-colors duration-150"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleRegister} className="space-y-3">
                    <div>
                      <label className={labelCls}>Nome</label>
                      <input
                        ref={firstRef}
                        type="text"
                        autoComplete="name"
                        required
                        value={rName}
                        onChange={(e) => setRName(e.target.value)}
                        placeholder="Seu nome completo"
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className={labelCls}>E-mail</label>
                      <input
                        type="email"
                        autoComplete="email"
                        required
                        value={rEmail}
                        onChange={(e) => setREmail(e.target.value)}
                        placeholder="seu@email.com"
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className={labelCls}>Senha</label>
                      <div className="relative">
                        <input
                          type={showPass ? "text" : "password"}
                          autoComplete="new-password"
                          required
                          minLength={8}
                          value={rPass}
                          onChange={(e) => setRPass(e.target.value)}
                          placeholder="Mín. 8 caracteres"
                          className={inputCls + " pr-11"}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowPass((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className={labelCls}>Confirmar senha</label>
                      <input
                        type={showPass ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        value={rPassConf}
                        onChange={(e) => setRPassConf(e.target.value)}
                        placeholder="••••••••"
                        className={inputCls}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 rounded-xl bg-gradient-accent text-primary-foreground font-semibold text-sm shadow-glow flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none"
                      style={{ marginTop: "0.5rem" }}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                      Criar conta grátis
                    </button>
                  </form>

                  {/* Switch link */}
                  <div
                    style={{
                      marginTop: "1.25rem",
                      padding: "1rem",
                      borderRadius: "1rem",
                      background: "oklch(0.21 0.04 270 / 0.4)",
                      border: "1px solid oklch(1 0 0 / 0.06)",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div className="text-xs font-semibold text-foreground/80">Já tem conta?</div>
                      <div className="text-xs text-muted-foreground">Entre e continue consultado</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => switchMode("login")}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-secondary hover:bg-secondary/10 transition-colors duration-150"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Entrar
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* StudyFlow brand pill at bottom */}
          <div
            style={{
              display: "flex", justifyContent: "center",
              marginTop: "1rem",
              opacity: isOpen ? 1 : 0,
              transition: "opacity 0.4s ease 0.1s",
            }}
          >
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-xs text-muted-foreground">
              <Brain className="w-3 h-3 text-primary" />
              StudyFlow
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modal, document.body);
}
