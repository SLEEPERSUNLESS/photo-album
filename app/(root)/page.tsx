import React from "react";
import { FaFacebook, FaGoogle, FaInstagram } from "react-icons/fa";
import { IoIosCheckmarkCircle } from "react-icons/io";
import { SiPhotopea } from "react-icons/si";
import { IoChevronDown } from "react-icons/io5";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
      <div className="flex flex-row items-center w-2/3 h-3/4 bg-white">
        <div className="bg-slate-700 w-1/2 h-full">
          <div className="flex flex-col justify-between p-10 text-slate-50 h-full">
            <div className="flex flex-col items-center justify-center">
              <h1 className="flex flex-row items-center gap-2 text-2xl font w-1/1">
                <SiPhotopea className="text-2xl mr-2" />
                <span>Nazwa firmy</span>
              </h1>
              <div className="w-1/2 h-0.5 bg-slate-600 my-8"></div>
              <p className="w-full font-bold text-3xl">Złap swoje momenty!</p>
              <p className="w-full font-bold text-slate-400 my-2 mb-16">Profesjonalne usługi fotograficzne pod twoją ręką! Nie zwklekaj i utrwal swoje wspomnienia na zawsze!</p>
              <div className="flex flex-col w-full gap-4">
                <div className="flex flex-row w-full items-center gap-4">
                  <IoIosCheckmarkCircle className="text-xl" /><span className="font-bold ">Przeglądaj albumy</span>
                </div>
                <div className="flex flex-row w-full items-center gap-4">
                  <IoIosCheckmarkCircle className="text-xl" /><span className="font-bold ">Wybierz i kup wybrane zdjęcia</span>
                </div>
                <div className="flex flex-row w-full items-center gap-4">
                  <IoIosCheckmarkCircle className="text-xl" /><span className="font-bold ">Udostępnij album najbliższym</span>
                </div>
              </div>
            </div>
            <div className="bg-slate-700 w-1/2 h-full flex flex-col justify-end items-center">
              <div className="flex flex-row w-full items-start gap-4">
                <FaFacebook className="text-slate-400 text-2xl" />
                <FaInstagram className="text-slate-400 text-2xl" />
              </div>
            </div>
          </div>
        </div>
        <div className="w-1/2 h-full flex flex-col justify-center items-center">
          <div className="w-3/5 h-2/3 flex flex-col justify-center items-center">
            <p className="text-slate-700 font-bold text-2xl text-center">Jeszcze jeden krok</p>
            <p className="text-slate-600 text-sm text-center mb-6">Wybierz dowolną opcję logowania i przeglądaj swoje zdjęcia</p>
            <div className="PhoneNumberWrapper flex flex-col w-full items-center">
              <p className="text-slate-700 text-sm w-full mb-1">Wpisz numer telefonu</p>
              <div className="phoneNumberNnputNrapper flex flex-row w-full items-center">
                <div className="h-full px-4 rounded-l-md border-l border-t border-b border-slate-300 flex items-center justify-between gap-4">
                  <span>+48</span>
                  <IoChevronDown />
                </div>
                <input type="text" placeholder="111 111 111" className="w-full h-10 rounded-r-md border-2 border-slate-300 p-2" />
              </div>
              <Link href="/albums" className="w-full">
                <button className="w-full h-10 rounded-md bg-slate-700 text-slate-50 border border-slate-50 mt-4">Wyślij kod</button>
              </Link>
            </div>
            <div className="Divider flex flex-row w-full items-center my-2 gap-2">
              <div className="h-0.5 bg-slate-200 flex-grow"></div>
              <span className="px-4 whitespace-nowrap text-slate-400 text-sm">Inne formy logowania</span>
              <div className="h-0.5 bg-slate-200 flex-grow"></div>
            </div>
            <Link href="/dashboard" className="w-full">
              <button className="w-full h-10 rounded-md border-1 border-slate-300 p-2 text-slate-400 flex flex-row items-center justify-center gap-2">
                <FaGoogle />
                <span>Kontynuuj z Google</span>
              </button>
            </Link>
            <div className="helpButton flex flex-row w-full items-center justify-center mt-2">
              <span className="text-slate-400 text-sm">Potrzebujesz pomocy? <span className="text-slate-700 underline cursor-pointer">Skontaktuj</span> się z nami</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
