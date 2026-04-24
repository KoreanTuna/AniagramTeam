import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import {
  onIdTokenChanged,
  signInAnonymously,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithPopup,
  signInWithRedirect,
  linkWithRedirect,
  signInWithCredential,
  getRedirectResult,
  browserPopupRedirectResolver,
  User,
  UserCredential,
} from "firebase/auth";
import { auth } from "./firebase";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  isGoogleAuthed: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutGoogle: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isGoogleAuthed: false,
  signInWithGoogle: async () => {
    throw new Error("AuthProvider not ready");
  },
  signOutGoogle: async () => {
    throw new Error("AuthProvider not ready");
  },
});

function hasGoogleProvider(u: User | null): boolean {
  if (!u) return false;
  return u.providerData.some((p) => p.providerId === "google.com");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGoogleAuthed, setIsGoogleAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;

    // 리다이렉트로 돌아온 경우의 결과를 먼저 수거한다.
    // linkWithRedirect로 anonymous 유저에 Google 계정을 링크하면 uid가 유지되므로
    // onAuthStateChanged는 재발화하지 않는다. onIdTokenChanged는 토큰 갱신(=링크 포함) 시 발화하므로 이쪽을 쓴다.
    (async () => {
      try {
        const result = await getRedirectResult(auth, browserPopupRedirectResolver);
        if (!mounted) return;
        console.log("[auth] getRedirectResult", {
          hasResult: !!result,
          resultUid: result?.user?.uid,
          resultProviders: result?.user?.providerData.map((p) => p.providerId),
          currentUid: auth.currentUser?.uid,
          currentProviders: auth.currentUser?.providerData.map((p) => p.providerId),
          isAnonymous: auth.currentUser?.isAnonymous,
        });
        // result가 null이어도 auth.currentUser로 폴백해 provider 상태를 동기화한다.
        const u = result?.user ?? auth.currentUser;
        if (u) {
          setUser(u);
          setIsGoogleAuthed(hasGoogleProvider(u));
          setLoading(false);
        }
      } catch (e) {
        const code = (e as { code?: string })?.code;
        // 이미 다른 Firebase 계정에 연결된 Google 계정이면,
        // anonymous 계정 링크는 실패하지만 error에 담긴 credential로 해당 기존 계정에 로그인한다.
        if (
          code === "auth/credential-already-in-use" ||
          code === "auth/email-already-in-use"
        ) {
          const credential = GoogleAuthProvider.credentialFromError(e as never);
          if (credential) {
            try {
              const cred = await signInWithCredential(auth, credential);
              if (mounted) {
                setUser(cred.user);
                setIsGoogleAuthed(hasGoogleProvider(cred.user));
                setLoading(false);
              }
            } catch (inner) {
              console.error("기존 Google 계정으로 로그인 실패", inner);
            }
          }
        } else {
          console.error("redirect 결과 처리 실패", e);
        }
      }
    })();

    // onIdTokenChanged: sign-in/out뿐 아니라 토큰 갱신(linkWithRedirect 후 포함)에도 발화한다.
    const unsub = onIdTokenChanged(auth, async (u) => {
      if (!mounted) return;
      console.log("[auth] onIdTokenChanged", {
        uid: u?.uid,
        isAnonymous: u?.isAnonymous,
        providers: u?.providerData.map((p) => p.providerId),
      });
      if (u) {
        setUser(u);
        setIsGoogleAuthed(hasGoogleProvider(u));
        setLoading(false);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          if (!mounted) return;
          setUser(cred.user);
          setIsGoogleAuthed(false);
        } catch (e) {
          console.error("익명 로그인 실패", e);
        } finally {
          if (mounted) setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const signInWithGoogle = async (): Promise<void> => {
    const provider = new GoogleAuthProvider();
    const current = auth.currentUser;
    console.log("[auth] signInWithGoogle start", {
      uid: current?.uid,
      isAnonymous: current?.isAnonymous,
      authDomain: auth.config.authDomain,
      origin: window.location.origin,
    });

    // popup을 우선 시도한다. cross-origin storage 이슈 없이 postMessage로 결과를 받는다.
    // popup 차단 등 실패 시 redirect로 폴백한다.
    const tryPopup = async (): Promise<UserCredential> => {
      if (current && current.isAnonymous) {
        return await linkWithPopup(current, provider, browserPopupRedirectResolver);
      }
      return await signInWithPopup(auth, provider, browserPopupRedirectResolver);
    };

    try {
      const cred = await tryPopup();
      // onIdTokenChanged가 발화하지만, 동일 uid 링크의 경우 누락될 수 있어 직접도 갱신한다.
      setUser(cred.user);
      setIsGoogleAuthed(hasGoogleProvider(cred.user));
      setLoading(false);
    } catch (e) {
      const code = (e as { code?: string })?.code;
      // 이미 다른 Firebase 계정에 연결된 Google 계정이면 기존 계정으로 로그인한다.
      if (
        code === "auth/credential-already-in-use" ||
        code === "auth/email-already-in-use"
      ) {
        const credential = GoogleAuthProvider.credentialFromError(e as never);
        if (credential) {
          const cred = await signInWithCredential(auth, credential);
          setUser(cred.user);
          setIsGoogleAuthed(hasGoogleProvider(cred.user));
          setLoading(false);
          return;
        }
      }
      // popup 차단/취소 등은 redirect로 폴백한다.
      if (
        code === "auth/popup-blocked" ||
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request" ||
        code === "auth/operation-not-supported-in-this-environment"
      ) {
        if (current && current.isAnonymous) {
          await linkWithRedirect(current, provider, browserPopupRedirectResolver);
        } else {
          await signInWithRedirect(auth, provider, browserPopupRedirectResolver);
        }
        return;
      }
      throw e;
    }
  };

  const signOutGoogle = async (): Promise<void> => {
    // onAuthStateChanged가 익명 로그인으로 다시 복귀시킨다.
    await signOut(auth);
    setIsGoogleAuthed(false);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isGoogleAuthed,
      signInWithGoogle,
      signOutGoogle,
    }),
    [user, loading, isGoogleAuthed]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
