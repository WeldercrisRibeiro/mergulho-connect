import {
  AuthenticationState,
  AuthenticationCreds,
  SignalDataTypeMap,
  initAuthCreds,
  BufferJSON,
} from '@whiskeysockets/baileys';
import { PrismaClient } from '@prisma/client';

/**
 * Adaptador para persistir o estado de autenticação do Baileys no Prisma.
 * Isso permite que a sessão do WhatsApp sobreviva a reinicializações no Render (que tem FS efêmero).
 */
export const usePrismaAuthState = async (
  prisma: PrismaClient,
  sessionId: string,
): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> => {
  
  // Helper para buscar dados do banco
  const writeData = async (data: any, key: string) => {
    const value = JSON.stringify(data, BufferJSON.replacer);
    await prisma.baileysAuth.upsert({
      where: { sessionId_key: { sessionId, key } },
      update: { value },
      create: { sessionId, key, value },
    });
  };

  const readData = async (key: string) => {
    try {
      const res = await prisma.baileysAuth.findUnique({
        where: { sessionId_key: { sessionId, key } },
      });
      if (!res) return null;
      return JSON.parse(res.value, BufferJSON.reviver);
    } catch (error) {
      console.error(`[PrismaAuth] Erro ao ler chave ${key}:`, error);
      return null;
    }
  };

  const removeData = async (key: string) => {
    try {
      await prisma.baileysAuth.delete({
        where: { sessionId_key: { sessionId, key } },
      });
    } catch (error) {
      // Ignora se já não existir
    }
  };

  // Carrega credenciais iniciais ou cria novas
  const creds: AuthenticationCreds = (await readData('creds')) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data: { [id: string]: SignalDataTypeMap[typeof type] } = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}:${id}`);
              if (type === 'app-state-sync-key' && value) {
                // Algumas chaves precisam de tratamento especial se necessário
              }
              data[id] = value;
            }),
          );
          return data;
        },
        set: async (data) => {
          const tasks: Promise<void>[] = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const key = `${category}:${id}`;
              tasks.push(value ? writeData(value, key) : removeData(key));
            }
          }
          await Promise.all(tasks);
        },
      },
    },
    saveCreds: async () => {
      await writeData(creds, 'creds');
    },
  };
};
