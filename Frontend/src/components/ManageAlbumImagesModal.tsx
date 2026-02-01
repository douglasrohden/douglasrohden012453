import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  Button,
  FileInput,
  Spinner,
  Label,
} from "flowbite-react";
import { HiTrash, HiUpload } from "react-icons/hi";
import { useToast } from "../contexts/ToastContext";
import { getErrorMessage } from "../lib/http";
import { albumImagesFacade, type AlbumImagesState } from "../facades/AlbumImagesFacade";
import { useBehaviorSubjectValue } from "../hooks/useBehaviorSubjectValue";
import { BehaviorSubject } from "rxjs";
import { albunsFacade } from "../facades/AlbumsFacade";
import { artistDetailFacade } from "../facades/ArtistDetailFacade";

const EMPTY_ALBUM_IMAGES_SUBJECT = new BehaviorSubject<AlbumImagesState>({ status: "idle" });

interface ManageAlbumImagesModalProps {
  albumId: number | null;
  show: boolean;
  onClose: () => void;
}

export default function ManageAlbumImagesModal({
  albumId,
  show,
  onClose,
}: ManageAlbumImagesModalProps) {
  const { addToast } = useToast();
  const [uploading, setUploading] = useState(false);

  // New files to upload
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const subject = useMemo(
    () => (albumId ? albumImagesFacade.state$(albumId) : EMPTY_ALBUM_IMAGES_SUBJECT),
    [albumId],
  );
  const state = useBehaviorSubjectValue(subject);
  const images = state.status === "ready" ? state.data : [];
  const loading = state.status === "loading";
  const facadeError = state.status === "error" ? state.message : null;

  const syncAlbumCover = (albumIdToSync: number, coverUrl?: string) => {
    if (!coverUrl) return;

    const albumList = albunsFacade.snapshot.data.content ?? [];
    const albumInList = albumList.find((alb) => alb.id === albumIdToSync);
    if (albumInList) {
      albunsFacade.updateAlbumInState({ ...albumInList, capaUrl: coverUrl });
    }

    const artistAlbums = artistDetailFacade.snapshot.data.albums ?? [];
    const artistAlbum = artistAlbums.find((alb) => alb.id === albumIdToSync);
    if (artistAlbum) {
      artistDetailFacade.patchAlbum({ ...artistAlbum, capaUrl: coverUrl });
    }
  };

  useEffect(() => {
    if (show && albumId) {
      albumImagesFacade.load(albumId).catch((err) => {
        addToast(getErrorMessage(err, "Erro ao carregar imagens"), "error");
      });
      setFiles([]);
      setPreviews([]);
      setError(null);
    }
  }, [show, albumId, addToast]);

  const handleDelete = async (imageId: number) => {
    if (!albumId) return;
    if (!confirm("Tem certeza que deseja remover esta imagem?")) return;

    try {
      await albumImagesFacade.remove(albumId, imageId);
      addToast("Imagem removida com sucesso", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "Erro ao remover imagem"), "error");
    }
  };

  const handleFilesChange = (fileList: FileList | null) => {
    if (!fileList) {
      setFiles([]);
      setPreviews([]);
      return;
    }
    const filesArray = Array.from(fileList);
    const MAX_FILE_BYTES = 5 * 1024 * 1024;

    if (filesArray.some((f) => f.size > MAX_FILE_BYTES)) {
      setError("Cada arquivo deve ter no máximo 5MB");
      return;
    }

    setError(null);
    setFiles(filesArray);
    setPreviews(filesArray.map((f) => URL.createObjectURL(f)));
  };

  const handleUpload = async () => {
    if (!albumId || files.length === 0) return;

    setUploading(true);
    try {
      await albumImagesFacade.upload(albumId, files);
      addToast("Imagens enviadas com sucesso!", "success");
      setFiles([]);
      setPreviews([]);
      const updatedImages = await albumImagesFacade.load(albumId);
      syncAlbumCover(albumId, updatedImages[0]?.url);
    } catch (error) {
      addToast(getErrorMessage(error, "Erro ao enviar imagens"), "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal show={show} onClose={onClose} size="xl">
      <ModalHeader>Gerenciar Capas do Álbum</ModalHeader>
      <ModalBody>
        <div className="space-y-6">
          {/* Existing Images Section */}
          <div>
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
              Capas Atuais
            </h3>
            {loading ? (
              <div className="py-4 text-center">
                <Spinner />
              </div>
            ) : images.length === 0 ? (
              <p className="text-gray-500 italic">Nenhuma capa cadastrada.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="group relative overflow-hidden rounded-lg border bg-gray-100 dark:bg-gray-800"
                  >
                    <img
                      src={img.url}
                      alt="Capa"
                      className="h-32 w-full object-cover"
                    />
                    <button
                      onClick={() => handleDelete(img.id)}
                      className="absolute top-1 right-1 rounded-full bg-red-600 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      title="Remover"
                    >
                      <HiTrash className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <hr className="dark:border-gray-700" />

          {/* Upload Section */}
          <div>
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
              Adicionar Novas Capas
            </h3>
            <Label htmlFor="new-images">
              Selecionar arquivos (Max 5MB cada)
            </Label>
            <FileInput
              id="new-images"
              multiple
              accept="image/*"
              onChange={(e) => handleFilesChange(e.target.files)}
              disabled={uploading}
            />

            {previews.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-2">
                {previews.map((src, idx) => (
                  <img
                    key={idx}
                    src={src}
                    alt="Preview"
                    className="h-20 w-full rounded border object-cover"
                  />
                ))}
              </div>
            )}

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            {facadeError && (
              <p className="mt-2 text-sm text-red-600">{facadeError}</p>
            )}

            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleUpload}
                disabled={files.length === 0 || uploading || !!error}
              >
                {uploading ? (
                  <Spinner size="sm" className="mr-2" />
                ) : (
                  <HiUpload className="mr-2 h-5 w-5" />
                )}
                Enviar Selecionadas
              </Button>
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="gray" onClick={onClose}>
          Fechar
        </Button>
      </ModalFooter>
    </Modal>
  );
}
