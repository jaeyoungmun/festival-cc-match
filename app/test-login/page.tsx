// 이 페이지는 비활성화되었습니다 (테스트용 페이지)
export default function Page() {
  return null;
}

/*
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function TestLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function login() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      alert(error.message);
      return;
    }
    router.push("/feed");
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>테스트 로그인</h1>
      <input
        placeholder="이메일"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: "block", margin: "8px 0", padding: 8, width: 300 }}
      />
      <input
        placeholder="비밀번호"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", margin: "8px 0", padding: 8, width: 300 }}
      />
      <button onClick={login} style={{ padding: "8px 24px", marginTop: 8 }}>
        로그인
      </button>
    </div>
  );
}
*/
