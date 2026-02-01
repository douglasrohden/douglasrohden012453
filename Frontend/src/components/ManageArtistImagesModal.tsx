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
import { BehaviorSubject } from "rxjs";
import { useToast } from "../contexts/ToastContext";
import { getErrorMessage } from "../lib/http";
import {
  artistImagesFacade,
  type ArtistImagesState,
} from "../facades/ArtistImagesFacade";
import { useBehaviorSubjectValue } from "../hooks/useBehaviorSubjectValue";
import { artistsFacade } from "../facades/ArtistsFacade";
import { artistDetailFacade } from "../facades/ArtistDetailFacade";

const EMPTY_ARTIST_IMAGES_SUBJECT = new BehaviorSubject<ArtistImagesState>({
  status: "idle",
});

interface ManageArtistImagesModalProps {
  artistId: number | null;
  show: boolean;
  onClose: () => void;
}

export default function ManageArtistImagesModal({
  artistId,
  show,
  onClose,
}: ManageArtistImagesModalProps) {
  const { addToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const subject = useMemo(
    () => (artistId ? artistImagesFacade.state$(artistId) : EMPTY_ARTIST_IMAGES_SUBJECT),
    [artistId],
  );
  const state = useBehaviorSubjectValue(subject);
  const images = state.status === "ready" ? state.data : [];
  const loading = state.status === "loading";
  const facadeError = state.status === "error" ? state.message : null;

  const syncArtistPhoto = (imageUrl?: string) => {
    if (!artistId) return;

    const list = artistsFacade.snapshot.data.content ?? [];
    const artistInList = list.find((a) => a.id === artistId);
    if (artistInList) {
      artistsFacade.patchArtist({ ...artistInList, imageUrl });
    }

    const detailArtist = artistDetailFacade.snapshot.data.artist;
    if (detailArtist?.id === artistId) {
      artistDetailFacade.patchArtist({ imageUrl });
    }
  };

  useEffect(() => {
    if (show && artistId) {
      artistImagesFacade.load(artistId).catch((err) => {
        addToast(getErrorMessage(err, "Erro ao carregar imagens"), "error");
      });
      setFiles([]);
      setPreviews([]);
      setError(null);
    }
  }, [show, artistId, addToast]);

  const handleDelete = async (imageId: number) => {
    if (!artistId) return;
    if (!confirm("Tem certeza que deseja remover esta imagem?")) return;

    try {
      await artistImagesFacade.remove(artistId, imageId);
      addToast("Imagem removida com sucesso", "success");
      const nextImages = await artistImagesFacade.load(artistId);
      syncArtistPhoto(nextImages[0]?.url);
    } catch (err) {
      addToast(getErrorMessage(err, "Erro ao remover imagem"), "error");
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
    if (!artistId || files.length === 0) return;

    setUploading(true);
    try {
      await artistImagesFacade.upload(artistId, files);
      addToast("Imagens enviadas com sucesso!", "success");
      setFiles([]);
      setPreviews([]);
      const updatedImages = await artistImagesFacade.load(artistId);
      syncArtistPhoto(updatedImages[0]?.url);
    } catch (err) {
      addToast(getErrorMessage(err, "Erro ao enviar imagens"), "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal show={show} onClose={onClose} size="xl">
      <ModalHeader>Gerenciar Fotos do Artista</ModalHeader>
      <ModalBody>
        <div className="space-y-6">
          <div>
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
              Fotos Atuais
            </h3>
            {loading ? (
              <div className="py-4 text-center">
                <Spinner />
              </div>
            ) : images.length === 0 ? (
              <p className="italic text-gray-500">Nenhuma foto cadastrada.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="group relative overflow-hidden rounded-lg border bg-gray-100 dark:bg-gray-800"
                  >
                    <img src={img.url} alt="Foto" className="h-32 w-full object-cover" />
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

          <div>
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
              Adicionar Novas Fotos
            </h3>
            <Label htmlFor="new-artist-images">Selecionar arquivos (Max 5MB cada)</Label>
            <FileInput
              id="new-artist-images"
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
              <Button onClick={handleUpload} disabled={files.length === 0 || uploading || !!error}>
                {uploading ? <Spinner size="sm" className="mr-2" /> : <HiUpload className="mr-2 h-5 w-5" />}
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
