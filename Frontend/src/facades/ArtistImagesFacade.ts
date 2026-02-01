import axios from "axios";
import { BehaviorSubject } from "rxjs";
import {
  ArtistImage,
  deleteArtistImage,
  getArtistImages,
  uploadArtistImages,
} from "../services/artistsService";
import { getErrorMessage, getHttpStatus } from "../lib/http";

export type ArtistImagesState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; data: ArtistImage[] }
  | { status: "error"; message: string; retryAfter?: number };

class ArtistImagesFacade {
  private readonly subjects = new Map<
    number,
    BehaviorSubject<ArtistImagesState>
  >();
  private readonly cache = new Map<
    number,
    { data: ArtistImage[]; expiresAt: number }
  >();
  private readonly inFlight = new Map<number, Promise<ArtistImage[]>>();
  private readonly cacheTtlMs = 5 * 60 * 1000; // 5 minutos

  state$(artistaId: number): BehaviorSubject<ArtistImagesState> {
    return this.subject(artistaId);
  }

  snapshot(artistaId: number): ArtistImagesState {
    return this.subject(artistaId).getValue();
  }

  async load(artistaId: number): Promise<ArtistImage[]> {
    const now = Date.now();
    const cached = this.cache.get(artistaId);
    if (cached && cached.expiresAt > now) {
      this.subject(artistaId).next({ status: "ready", data: cached.data });
      return cached.data;
    }

    const pending = this.inFlight.get(artistaId);
    if (pending) return pending;

    const job = (async () => {
      this.subject(artistaId).next({ status: "loading" });
      try {
        const data = await getArtistImages(artistaId);
        this.cache.set(artistaId, { data, expiresAt: now + this.cacheTtlMs });
        this.subject(artistaId).next({ status: "ready", data });
        return data;
      } catch (error) {
        const status = getHttpStatus(error);
        const retryAfter =
          axios.isAxiosError(error) &&
          typeof error.response?.data?.retryAfter === "number"
            ? error.response.data.retryAfter
            : undefined;
        const message = getErrorMessage(
          error,
          "Erro ao carregar imagens do artista",
        );
        if (status === 429 && retryAfter) {
          this.subject(artistaId).next({
            status: "error",
            message,
            retryAfter,
          });
        } else {
          this.subject(artistaId).next({ status: "error", message });
        }
        throw error;
      } finally {
        this.inFlight.delete(artistaId);
      }
    })();

    this.inFlight.set(artistaId, job);
    return job;
  }

  async upload(artistaId: number, files: File[]): Promise<ArtistImage[]> {
    const subj = this.subject(artistaId);
    subj.next({ status: "loading" });
    try {
      await uploadArtistImages(artistaId, files);
      this.cache.delete(artistaId);
      return await this.load(artistaId);
    } catch (error) {
      const status = getHttpStatus(error);
      const retryAfter =
        axios.isAxiosError(error) &&
        typeof error.response?.data?.retryAfter === "number"
          ? error.response.data.retryAfter
          : undefined;
      const message = getErrorMessage(
        error,
        "Erro ao enviar imagens do artista",
      );
      if (status === 429 && retryAfter) {
        subj.next({ status: "error", message, retryAfter });
      } else {
        subj.next({ status: "error", message });
      }
      throw error;
    }
  }

  async remove(artistaId: number, imageId: number): Promise<void> {
    const subj = this.subject(artistaId);
    try {
      await deleteArtistImage(artistaId, imageId);
      const cached = this.cache.get(artistaId);
      if (cached) {
        const nextData = cached.data.filter((img) => img.id !== imageId);
        this.cache.set(artistaId, {
          data: nextData,
          expiresAt: Date.now() + this.cacheTtlMs,
        });
        subj.next({ status: "ready", data: nextData });
      } else {
        await this.load(artistaId);
      }
    } catch (error) {
      const status = getHttpStatus(error);
      const retryAfter =
        axios.isAxiosError(error) &&
        typeof error.response?.data?.retryAfter === "number"
          ? error.response.data.retryAfter
          : undefined;
      const message = getErrorMessage(
        error,
        "Erro ao remover imagem do artista",
      );
      if (status === 429 && retryAfter) {
        subj.next({ status: "error", message, retryAfter });
      } else {
        subj.next({ status: "error", message });
      }
      throw error;
    }
  }

  private subject(artistaId: number): BehaviorSubject<ArtistImagesState> {
    let subj = this.subjects.get(artistaId);
    if (!subj) {
      subj = new BehaviorSubject<ArtistImagesState>({ status: "idle" });
      this.subjects.set(artistaId, subj);
    }
    return subj;
  }
}

export const artistImagesFacade = new ArtistImagesFacade();
