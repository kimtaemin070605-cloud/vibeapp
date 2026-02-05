import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * 전역 Supabase 클라이언트 인스턴스
 * 이를 통해 모든 데이터베이스 CRUD 작업을 수행합니다.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
