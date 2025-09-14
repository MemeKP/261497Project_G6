import bg1 from "../assets/imgs/bg-1.png";

const LandingPage = () => {
  return (
    <div className="w-full h-[852px] relative bg-black overflow-hidden">
      {/* BACKGROUND */}
      <img
        className="w-full h-full object-cover absolute inset-0"
        src={bg1}
        alt="background"
      />
      <div className="absolute inset-0 bg-black opacity-60"></div>
      
      {/* CONTENT */}
      <div className="absolute flex flex-col items-center justify-center w-screen">
        <h1 className="title1 text-white text-9xl mt-30">ENSO</h1>
        <p className="text-white p-2 mt-3 font-[Gantari]">
          Welcome to Authentic Japanese Dining.
        </p>
        <div className="flex flex-col space-y-8 mt-25 w-60">
            <button className="bg-white rounded-full p-2 text-2xl font-medium shadow-[0px_4px_18px_0px_rgba(217,217,217,1.00)] border-3 font-[Gantari]">For One</button>
            <button className="bg-white rounded-full p-2 text-2xl font-medium shadow-[0px_4px_18px_0px_rgba(217,217,217,1.00)] border-3 font-[Gantari]">Shared Table</button>
        </div>
      </div>

      {/* FOOTER */}
      <p className="absolute flex items-center justify-center inset-x-0 bottom-0 text-white bg-black h-10 font-[Gantari]">© 2025 ENSO RESTUARANT</p>
    </div>
  );
};

export default LandingPage;
