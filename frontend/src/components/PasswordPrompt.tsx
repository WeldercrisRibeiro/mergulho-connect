import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export const PasswordPrompt = () => {
  const { user, needsPasswordChange } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    console.log("[PasswordPrompt] user:", user?.email, "needsChange:", needsPasswordChange, "path:", location.pathname);
    if (user && needsPasswordChange && location.pathname !== "/perfil") {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [user, needsPasswordChange, location.pathname]);

  if (!user || !needsPasswordChange) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md rounded-3xl border-0 shadow-2xl">
        <DialogHeader className="flex flex-col items-center text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
            <ShieldAlert className="h-6 w-6 text-amber-600" />
          </div>
          <DialogTitle className="text-xl font-bold">Segurança da Conta</DialogTitle>
          <DialogDescription className="text-sm">
            Detectamos que você ainda está utilizando a senha padrão. Para a segurança da sua conta e de seus dados, recomendamos que você altere sua senha agora.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2 w-full justify-end">
          <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
            Lembrar depois
          </Button>
          <Button onClick={() => {
            setOpen(false);
            navigate("/perfil");
          }} className="w-full sm:w-auto">
            Alterar Senha
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
