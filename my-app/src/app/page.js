import Image from "next/image";
import { ResizeNavbar } from "./components/navbar";
import Form from "./components/form";
export default function Home() {
  return (
    <div className="font-sans">
      <ResizeNavbar />
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start" style={{backgroundColor:'white'}}>
        <Form />
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        
      </footer>
    </div>
  );
}
