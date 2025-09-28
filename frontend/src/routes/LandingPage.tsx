import { Link } from "react-router-dom";
import bg1 from "../assets/imgs/bg-1.png";
import PageAnimation from "../common/PageAnimetion";
import ButtonAnimation from "../common/ButtonAnimetion";

const LandingPage = () => {
  return (
    <>
      <div className="w-full h-screen relative bg-black overflow-hidden ">
        {/* BACKGROUND */}
        {/* <img
        className="w-full h-full bg-center object-cover absolute inset-0"
        src={bg1}
        alt="background"
      /> */}
        <div
          className="w-full h-full bg-cover absolute inset-0 bg-center"
          style={{ backgroundImage: `url(${bg1})` }}
        ></div>
        <div className="absolute inset-0 bg-black opacity-60"></div>

        {/* CONTENT */}

        <div className="absolute flex flex-col w-full items-center justify-center">
          <PageAnimation index={0}>
            <div className="flex flex-col items-center justify-center">
              <h1 className="title1 text-white text-9xl mt-30">ENSO</h1>
            </div>
          </PageAnimation>
          <PageAnimation index={1}>
            <p className="text-white p-2 mt-3 font-[Gantari]">
              Welcome to Authentic Japanese Dining.
            </p>
          </PageAnimation>
          <PageAnimation index={2}>
            <Link to="/homepage">
              <ButtonAnimation className="flex flex-col items-center mt-25 w-60 bg-white rounded-full p-2 text-2xl font-medium shadow-[0px_4px_18px_0px_rgba(217,217,217,1.00)] border-3 font-[Gantari]">
                For One
              </ButtonAnimation>
            </Link>
          </PageAnimation>
          <PageAnimation index={3}>
            <Link to="/addmember">
              <ButtonAnimation className="flex flex-col mt-10 w-60 items-center bg-white rounded-full p-2 text-2xl font-medium shadow-[0px_4px_18px_0px_rgba(217,217,217,1.00)] border-3 font-[Gantari]">
                Shared Table
              </ButtonAnimation>
            </Link>
          </PageAnimation>
        </div>
      </div>

      {/* FOOTER */}
      <p className="flex w-full z-10 items-center justify-center inset-x-0 bottom-0 text-white bg-black h-10 font-[Gantari]">
        © 2025 ENSO RESTUARANT
      </p>
    </>
  );
};

export default LandingPage;
