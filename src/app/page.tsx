import SmoothScroll from "@/components/layout/SmoothScroll";
import Experience from "@/components/3d/Experience";
import CinematicOverlay from "@/components/ui/CinematicOverlay";
import Hud from "@/components/ui/Hud";
import CustomCursor from "@/components/ui/CustomCursor";

export default function Home() {
  return (
    <main className="bg-black text-white selection:bg-white selection:text-black">
      <CustomCursor />
      <Hud />
      {/* Fixed WebGL stage — the film. Never scrolls itself. */}
      <Experience />
      {/* Scrollable DOM — the screenplay driving the film. */}
      <SmoothScroll>
        <CinematicOverlay />
      </SmoothScroll>
    </main>
  );
}
