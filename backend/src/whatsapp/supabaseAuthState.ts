/**
 * supabaseAuthState.ts
 *
 * Persiste os arquivos de credenciais do Baileys no Supabase Storage
 * em vez do disco local (baileys_auth/).
 *
 * MOTIVAÇÃO:
 *   - No Render.com free tier o disco é efêmero: toda reinicialização do
 *     container apaga os arquivos, forçando um novo scan do QR Code.
 *   - Ao armazenar no Supabase Storage, a sessão sobrevive a restarts.
 *
 * BUCKET NECESSÁRIO:
 *   Crie um bucket PRIVADO chamado "baileys-auth" no Supabase Storage.
 *   Não precisa de RLS — o acesso é feito com a SERVICE_ROLE_KEY.
 *
 * COMO USAR (substitui useMultiFileAuthState do Baileys):
 *   import { useSupabaseAuthState } from "./supabaseAuthState";
 *   const { state, saveCreds } = await useSupabaseAuthState();
 */

import {
  AuthenticationCreds,
  AuthenticationState,
  BufferJSON,
  initAuthCreds,
  proto,
  SignalDataTypeMap,
} from "@whiskeysockets/baileys";
import { supabase } from "../lib/supabase";

const BUCKET = "baileys-auth";
const PREFIX = "session"; // prefixo dos arquivos dentro do bucket

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fileKey(name: string): string {
  return `${PREFIX}/${name}.json`;
}

async function readFile(name: string): Promise<any | null> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .download(fileKey(name));

    if (error || !data) return null;

    const text = await data.text();
    return JSON.parse(text, BufferJSON.reviver);
  } catch {
    return null;
  }
}

async function writeFile(name: string, value: any): Promise<void> {
  const content = JSON.stringify(value, BufferJSON.replacer, 2);
  const blob = new Blob([content], { type: "application/json" });

  await supabase.storage.from(BUCKET).upload(fileKey(name), blob, {
    upsert: true,
    contentType: "application/json",
  });
}

async function removeFile(name: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([fileKey(name)]);
}

// ─── useSupabaseAuthState ─────────────────────────────────────────────────────

export async function useSupabaseAuthState(): Promise<{
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
  clearState: () => Promise<void>;
}> {
  // Carrega ou inicializa as credenciais
  let creds: AuthenticationCreds =
    (await readFile("creds")) ?? initAuthCreds();

  // Retorna o estado de autenticação compatível com Baileys
  const state: AuthenticationState = {
    creds,
    keys: {
      get: async (type, ids) => {
        const data: { [id: string]: SignalDataTypeMap[typeof type] } = {};
        for (const id of ids) {
          let value = await readFile(`${type}-${id}`);
          if (type === "app-state-sync-key" && value) {
            value = proto.Message.AppStateSyncKeyData.fromObject(value);
          }
          data[id] = value;
        }
        return data;
      },

      set: async (data) => {
        const tasks: Promise<void>[] = [];
        for (const category in data) {
          const cat = category as keyof SignalDataTypeMap;
          for (const id in data[cat]) {
            const value = (data[cat] as any)[id];
            const name = `${cat}-${id}`;
            tasks.push(value != null ? writeFile(name, value) : removeFile(name));
          }
        }
        await Promise.all(tasks);
      },
    },
  };

  // Salva as credenciais atualizadas no Supabase
  const saveCreds = async () => {
    await writeFile("creds", state.creds);
  };

  // Remove toda a sessão do Supabase (equivalente ao clearAuthFiles local)
  const clearState = async () => {
    try {
      const { data: files } = await supabase.storage
        .from(BUCKET)
        .list(PREFIX);

      if (files && files.length > 0) {
        const paths = files.map((f) => `${PREFIX}/${f.name}`);
        await supabase.storage.from(BUCKET).remove(paths);
      }
    } catch {
      // ignora erros de limpeza
    }
  };

  return { state, saveCreds, clearState };
}
