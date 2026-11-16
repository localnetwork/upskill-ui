import { useEffect, useRef, useState } from "react";
import Google from "@/components/icons/Google";

const GOOGLE_IDENTITY_SCRIPT_URL = "https://accounts.google.com/gsi/client";

function waitForGoogleIdentity(maxWaitMs = 10000) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const timer = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(timer);
        resolve();
        return;
      }

      if (Date.now() - startedAt >= maxWaitMs) {
        clearInterval(timer);
        reject(new Error("Google Identity API did not initialize in time"));
      }
    }, 100);
  });
}

function loadGoogleIdentityScript() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();

  const existingScript = document.querySelector(
    `script[src="${GOOGLE_IDENTITY_SCRIPT_URL}"]`,
  );

  if (existingScript) {
    return waitForGoogleIdentity();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GOOGLE_IDENTITY_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      waitForGoogleIdentity().then(resolve).catch(reject);
    };
    script.onerror = () => reject(new Error("Failed to load Google script"));
    document.head.appendChild(script);
  });
}

export default function GoogleAuthButton({
  clientId,
  onCredential,
  disabled = false,
  label = "Continue with Google",
}) {
  const [ready, setReady] = useState(false);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!clientId || typeof window === "undefined") return;

    let active = true;
    loadGoogleIdentityScript()
      .then(() => {
        if (!active || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) onCredential(response.credential);
          },
        });

        if (buttonRef.current) {
          buttonRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(buttonRef.current, {
            type: "icon",
            theme: "outline",
            size: "large",
            shape: "circle",
          });
        }
        setReady(true);
      })
      .catch(() => {
        if (active) setReady(false);
      });

    return () => {
      active = false;
    };
  }, [clientId, onCredential]);

  return (
    <div
      className={`flex justify-center ${disabled ? "opacity-70 pointer-events-none" : ""}`}
    >
      <div className="relative h-[40px] w-[40px]" title={label}>
        <span
          aria-hidden="true"
          className={`absolute inset-0 border border-[#D0D4DC] bg-white rounded-full inline-flex justify-center items-center ${ready ? "" : "opacity-70"}`}
        >
          <Google className="w-5 h-5" />
        </span>
        <div
          ref={buttonRef}
          aria-label={label}
          className="absolute inset-0 overflow-hidden rounded-full opacity-[0.01] [&>div]:!w-[40px] [&>div]:!h-[40px]"
        />
      </div>
    </div>
  );
}
