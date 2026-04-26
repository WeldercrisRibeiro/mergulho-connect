/**
 * Converte áudio WebM/Opus (gravado pelo browser) para OGG/Opus em memória,
 * formato aceito pelo WhatsApp Mobile (iOS e Android) como PTT (Push-to-Talk).
 *
 * Usa streams PassThrough para evitar arquivos temporários — o buffer retornado
 * é enviado diretamente ao Baileys, sem risco de arquivo "não encontrado".
 */
import * as ffmpegPath from "ffmpeg-static";
import * as ffmpeg from "fluent-ffmpeg";
import { PassThrough } from "stream";
import * as fs from "fs";
import * as path from "path";

// Helper para lidar com as diferentes formas de exportação do fluent-ffmpeg
const ffmpegCommand = (ffmpeg as any).default || ffmpeg;

// Aponta o fluent-ffmpeg para o binário embutido
const actualFfmpegPath = (ffmpegPath as any).default || ffmpegPath;
if (actualFfmpegPath) {
  ffmpegCommand.setFfmpegPath(actualFfmpegPath);
}

/**
 * Converte um arquivo de áudio para OGG/Opus em memória.
 * Retorna um Buffer pronto para ser passado ao Baileys como `audio`.
 * Não cria arquivos temporários.
 */
export async function processAudioOgg(audioPath: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Lê o arquivo original como buffer e alimenta via stream
      const inputBuffer = fs.readFileSync(audioPath);
      const inputStream = new PassThrough();
      inputStream.end(inputBuffer);

      const outputStream = new PassThrough();
      const chunks: Buffer[] = [];

      outputStream.on("data", (chunk: Buffer) => chunks.push(chunk));
      outputStream.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
      outputStream.on("error", (err) => {
        console.error("[AudioConvert Stream Error]:", err.message);
        reject(err);
      });

      // Configuração otimizada para WhatsApp PTT (iOS + Android)
      ffmpegCommand(inputStream)
        .format("ogg")
        .audioCodec("libopus")
        .audioBitrate("48k")
        .addOption([
          "-vbr",             "on",
          "-compression_level", "10",
          "-application",     "voip",
        ])
        .on("error", (err) => {
          console.error("[AudioConvert] Falha na conversão:", err.message);
          reject(new Error(`Conversão de áudio falhou: ${err.message}`));
        })
        .pipe(outputStream, { end: true });
    } catch (error) {
      console.error("[AudioConvert Catch Error]:", error);
      reject(error);
    }
  });
}

/**
 * Verifica se o arquivo precisa de conversão para OGG/Opus.
 * Todo áudio que não for já OGG precisa ser convertido antes de enviar.
 */
export function needsConversion(filepath: string, mimetype: string): boolean {
  const ext = path.extname(filepath).toLowerCase();
  const isOgg = ext === ".ogg" || mimetype.includes("ogg");
  return !isOgg;
}
