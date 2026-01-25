import axios from "axios";
import { BehaviorSubject } from "rxjs";
import {
  AlbumImage,
  deleteAlbumImage,
  getAlbumImages,
  uploadAlbumImages,
} from "../services/albunsService";
import { getErrorMessage, getHttpStatus } from "../lib/http";

export type AlbumImagesState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; data: AlbumImage[] }
  | { status: "error"; message: string; retryAfter?: number };

class AlbumImagesFacade {
  private readonly subjects = new Map<
    number,
    BehaviorSubject<AlbumImagesState>
  >();
  private readonly cache = new Map<
    number,
    { data: AlbumImage[]; expiresAt: number }
  >();
  private readonly inFlight = new Map<number, Promise<AlbumImage[]>>();
  private readonly cacheTtlMs = 5 * 60 * 1000; // 5 minutos

  state$(albumId: number): BehaviorSubject<AlbumImagesState> {
    return this.subject(albumId);
  }

  snapshot(albumId: number): AlbumImagesState {
    return this.subject(albumId).getValue();
  }

  async load(albumId: number): Promise<AlbumImage[]> {
    const now = Date.now();
    const cached = this.cache.get(albumId);
    if (cached && cached.expiresAt > now) {
      this.subject(albumId).next({ status: "ready", data: cached.data });
      return cached.data;
    }

    const pending = this.inFlight.get(albumId);
    if (pending) return pending;

    const job = (async () => {
      this.subject(albumId).next({ status: "loading" });
      try {
        const data = await getAlbumImages(albumId);
        this.cache.set(albumId, { data, expiresAt: now + this.cacheTtlMs });
        this.subject(albumId).next({ status: "ready", data });
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
          "Erro ao carregar capas do álbum",
        );
        if (status === 429 && retryAfter) {
          this.subject(albumId).next({ status: "error", message, retryAfter });
        } else {
          this.subject(albumId).next({ status: "error", message });
        }
        throw error;
      } finally {
        this.inFlight.delete(albumId);
      }
    })();

    this.inFlight.set(albumId, job);
    return job;
  }

  async upload(albumId: number, files: File[]): Promise<AlbumImage[]> {
    const subj = this.subject(albumId);
    subj.next({ status: "loading" });
    try {
      await uploadAlbumImages(albumId, files);
      this.cache.delete(albumId);
      return await this.load(albumId);
    } catch (error) {
      const status = getHttpStatus(error);
      const retryAfter =
        axios.isAxiosError(error) &&
        typeof error.response?.data?.retryAfter === "number"
          ? error.response.data.retryAfter
          : undefined;
      const message = getErrorMessage(
        error,
        "Erro ao enviar capas do álbum",
      );
      if (status === 429 && retryAfter) {
        subj.next({ status: "error", message, retryAfter });
      } else {
        subj.next({ status: "error", message });
      }
      throw error;
    }
  }

  async remove(albumId: number, imageId: number): Promise<void> {
    const subj = this.subject(albumId);
    try {
      await deleteAlbumImage(albumId, imageId);
      const cached = this.cache.get(albumId);
      if (cached) {
        const nextData = cached.data.filter((img) => img.id !== imageId);
        this.cache.set(albumId, {
          data: nextData,
          expiresAt: Date.now() + this.cacheTtlMs,
        });
        subj.next({ status: "ready", data: nextData });
      } else {
        await this.load(albumId);
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
        "Erro ao remover capa do álbum",
      );
      if (status === 429 && retryAfter) {
        subj.next({ status: "error", message, retryAfter });
      } else {
        subj.next({ status: "error", message });
      }
      throw error;
    }
  }

  private subject(albumId: number): BehaviorSubject<AlbumImagesState> {
    let subj = this.subjects.get(albumId);
    if (!subj) {
      subj = new BehaviorSubject<AlbumImagesState>({ status: "idle" });
      this.subjects.set(albumId, subj);
    }
    return subj;
  }
}

export const albumImagesFacade = new AlbumImagesFacade();
