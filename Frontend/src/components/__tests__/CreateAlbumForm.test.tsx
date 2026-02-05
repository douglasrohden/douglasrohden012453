import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import CreateAlbumForm from "../CreateAlbumForm";
import { ToastProvider } from "../../contexts/ToastContext";

beforeAll(() => {
  global.URL.createObjectURL = vi.fn(() => "blob:preview");
});

describe("CreateAlbumForm", () => {
  it("deve renderizar preview ao selecionar arquivos", () => {
    const { getByLabelText, getAllByAltText } = render(
      <ToastProvider>
        <CreateAlbumForm show={true} onClose={() => {}} onSuccess={() => {}} artistId={1} />
      </ToastProvider>,
    );

    const input = getByLabelText("Capas do Álbum (Adicionar múltiplas)") as HTMLInputElement;
    const file = new File(["dummy"], "capa.png", { type: "image/png" });

    fireEvent.change(input, { target: { files: [file] } });

    const previews = getAllByAltText("preview-0");
    expect(previews.length).toBe(1);
  });
});
