import { PageLayout } from "../components/layout/PageLayout";
import AlbunsList from "../components/AlbunsList";
import { albunsFacade } from "../facades/AlbumsFacade";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function AlbunsPage() {
  const location = useLocation();
  console.log('location', location)

  useEffect(() => {
    albunsFacade.activate();
    return () => albunsFacade.deactivate();
  }, []);

  useEffect(() => {
    albunsFacade.load();
  }, [location.key]);

  return (
    <PageLayout>
      <AlbunsList />
    </PageLayout>
  );
}
