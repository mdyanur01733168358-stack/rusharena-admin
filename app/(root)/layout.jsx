import Navbar from "../component/application/menubar";

export default function adminLayout({ children }) {
  return (
    <div className="w-full font-sans min-h-screen  flex flex-col items-center gap-16 pt-4">
      <main className="w-full  mt-16">
        <Navbar />
        {children}
      </main>
    </div>
  );
}
