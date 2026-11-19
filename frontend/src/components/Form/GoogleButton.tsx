import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";
import { errorMessage } from "@/utils/format";

export const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

/** Renders only when VITE_GOOGLE_CLIENT_ID is configured. */
export function GoogleButton({ onError }: { onError: (message: string) => void }) {
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();
  if (!GOOGLE_ENABLED) return null;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full items-center gap-3 text-xs text-white/50">
        <span className="h-px flex-1 bg-white/15" /> or <span className="h-px flex-1 bg-white/15" />
      </div>
      <GoogleLogin
        theme="filled_black"
        shape="pill"
        onSuccess={async ({ credential }) => {
          if (!credential) return onError("Google sign-in failed.");
          try {
            const res = await authService.google(credential);
            setSession(res.access_token, res.user, true);
            navigate("/home", { replace: true });
          } catch (e) {
            onError(errorMessage(e, "Google sign-in failed."));
          }
        }}
        onError={() => onError("Google sign-in was cancelled.")}
      />
    </div>
  );
}
